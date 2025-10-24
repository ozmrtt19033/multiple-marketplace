import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Marketplace, LastSyncStatus } from '@prisma/client';
import { z } from 'zod';
// Olası bir Vendor/Kullanıcı ID'si için oturumu çekelim
import { getServerSession } from 'next-auth';
// AuthOptions'ı doğru yoldan çekmelisin
// Hata vermemesi için şimdilik NextAuth rotasının olduğu yeri varsayıyoruz
// @ts-ignore
import { authOptions } from '../../auth/[...nextauth]/route';

// Ayarların doğrulanması için Schema
const integrationSchema = z.object({
    marketplace: z.enum(['TRENDYOL', 'HEPSIBURADA', 'AMAZON', 'ETSY', 'ALIEXPRESS']),
    isEnabled: z.boolean().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    sellerId: z.string().optional(),
    // Diğer ayarları buraya ekleyin
});

/**
 * GET - Tüm marketplace entegrasyon ayarlarını getirir.
 */
export async function GET() {
    try {
        const integrations = await prisma.marketplaceIntegration.findMany({
            orderBy: { marketplace: 'asc' },
        });

        return NextResponse.json(integrations);
    } catch (error) {
        console.error('Entegrasyon Ayarlarını Getirme Hatası:', error);
        return NextResponse.json(
            { success: false, message: 'Entegrasyon ayarları getirilirken bir hata oluştu.' },
            { status: 500 }
        );
    }
}

/**
 * POST - Yeni bir entegrasyon ayarı oluşturur veya günceller.
 * @param request Body'de entegrasyon ayarlarını içerir.
 */
export async function POST(request: Request) {
    try {
        // Oturumu kontrol et ve Vendor ID'yi çek
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.vendorId) {
            return NextResponse.json(
                { success: false, message: 'Yetkilendirme başarısız veya satıcı (vendor) bilgisi eksik.' },
                { status: 401 }
            );
        }

        const vendorId = session.user.vendorId as string; // VendorId'nin string olduğunu varsayıyoruz

        const body = await request.json();

        // 1. Veriyi Doğrula
        const validatedData = integrationSchema.parse(body);

        const { marketplace, ...data } = validatedData;

        // 2. Güncellenecek veriyi filtrele ve dönüştür
        const updateData: Record<string, any> = {};
        let processedSellerId: number | undefined;

        // Seller ID'yi özel olarak ele al: String'i Int'e çevir
        if (data.sellerId && data.sellerId.length > 0) {
            const parsedSellerId = parseInt(data.sellerId, 10);

            if (isNaN(parsedSellerId) || parsedSellerId <= 0) {
                return NextResponse.json(
                    { success: false, message: 'Satıcı ID geçerli bir pozitif sayı olmalıdır.' },
                    { status: 400 }
                );
            }
            processedSellerId = parsedSellerId;
        }

        // Diğer alanları filtrele
        for (const key in data) {
            const value = data[key as keyof typeof data];

            if (key === 'sellerId') {
                continue;
            }

            // undefined, null veya boş stringleri yok say
            if (value !== undefined && value !== null) {
                if (typeof value === 'string' && value.trim() === '') {
                    continue;
                }
                updateData[key] = value;
            }
        }

        if (processedSellerId !== undefined) {
            updateData.sellerId = processedSellerId;
        }


        // 3. MarketplaceIntegration tablosunu 'upsert' ile kullan
        const integration = await prisma.marketplaceIntegration.upsert({
            where: {
                // vendorId ve marketplace ikilisi unique olmalı, yoksa sadece marketplace'i kullan
                // Şemanızdaki unique kısıtlamasına göre burayı ayarlayın
                marketplace_vendorId: {
                    marketplace: marketplace as Marketplace,
                    vendorId: vendorId,
                }
            },

            // UPDATE:
            update: {
                ...updateData,
                // lastSyncStatus hatası düzeltildi: doğrudan string kullanılıyor
                lastSyncStatus: 'PENDING',
                lastErrorMessage: null,
            },

            // CREATE:
            create: {
                marketplace: marketplace as Marketplace,
                vendorId: vendorId, // BURASI KRİTİK: Vendor ID'yi CREATE'e ekledik

                ...updateData,

                apiKey: updateData.apiKey || '',
                apiSecret: updateData.apiSecret || '',
                sellerId: processedSellerId || 0,
                isEnabled: updateData.isEnabled !== undefined ? updateData.isEnabled : false,

                // lastSyncStatus hatası düzeltildi: doğrudan string kullanılıyor
                lastSyncStatus: 'PENDING',
                lastSyncDate: new Date(),
                productCount: 0,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: `${marketplace} entegrasyon ayarları başarıyla kaydedildi.`,
                integration,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Entegrasyon Kaydetme Hatası:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Geçersiz veri formatı.',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                { status: 400 }
            );
        }

        // Genel hata
        return NextResponse.json(
            { success: false, message: 'Entegrasyon ayarları kaydedilirken beklenmeyen bir hata oluştu. Lütfen sunucu loglarını kontrol edin.' },
            { status: 500 }
        );
    }
}