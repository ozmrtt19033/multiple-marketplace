import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Enum'ları TEKRAR import ediyoruz ve KULLANIYORUZ
import { MarketplaceName, SyncStatus } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
// @ts-ignore
import { authOptions } from '../../auth/[...nextauth]/route';
import { invalidateCache } from '@/lib/redis';

// Schema aynı kalabilir
const integrationSchema = z.object({
    marketplace: z.enum(['TRENDYOL', 'HEPSIBURADA', 'AMAZON', 'ETSY', 'ALIEXPRESS']),
    isEnabled: z.boolean().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    sellerId: z.string().optional(),
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
 */
export async function POST(request: Request) {
    let vendorId: string;

    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.vendorId) {
            return NextResponse.json(
                { success: false, message: 'Yetkilendirme başarısız veya satıcı (vendor) bilgisi eksik.' },
                { status: 401 }
            );
        }
        vendorId = session.user.vendorId as string;

        const body = await request.json();
        const validatedData = integrationSchema.parse(body);
        // MarketplaceName Enum'unu kullanıyoruz
        const marketplaceEnum = validatedData.marketplace as MarketplaceName;
        const { marketplace, ...data } = validatedData;

        const updateData: Record<string, any> = {};
        let processedSellerId: string | undefined;

        if (data.sellerId && data.sellerId.trim().length > 0) {
            processedSellerId = data.sellerId.trim();
        }

        for (const key in data) {
            const value = data[key as keyof typeof data];
            if (key === 'sellerId') continue;

            if (value !== undefined && value !== null) {
                if (typeof value === 'string' && value.trim() === '') continue;
                updateData[key] = value;
            }
        }

        if (processedSellerId !== undefined) {
            updateData.sellerId = processedSellerId;
        }


        // 3. MarketplaceIntegration tablosunu 'upsert' ile kullan
        const integration = await prisma.marketplaceIntegration.upsert({
            where: {
                vendorId_marketplace: {
                    marketplace: marketplaceEnum, // Enum kullanılıyor
                    vendorId: vendorId,
                }
            },
            update: {
                ...updateData,
                // --- Enum Kullanımı Geri Geldi ---
                lastSyncStatus: SyncStatus.PENDING,
                lastSyncError: null, // Şemadaki doğru alan adı
            },
            create: {
                marketplace: marketplaceEnum, // Enum kullanılıyor
                vendorId: vendorId,
                apiKey: updateData.apiKey || '',
                apiSecret: updateData.apiSecret || '',
                sellerId: processedSellerId || '',
                isEnabled: updateData.isEnabled !== undefined ? updateData.isEnabled : false,
                // --- Enum Kullanımı Geri Geldi ---
                lastSyncStatus: SyncStatus.PENDING,
                lastSyncAt: new Date(), // Şemadaki doğru alan adı
                totalProducts: 0, // Şemadaki doğru alan adı
            },
        });

        await invalidateCache('integrations:*');
        console.log(`🧹 Cache invalidated for pattern: integrations:*`);

        return NextResponse.json(
            {
                success: true,
                message: `${marketplaceEnum} entegrasyon ayarları başarıyla kaydedildi.`,
                integration,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Entegrasyon Kaydetme Hatası:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, message: 'Geçersiz veri formatı (Zod).', errors: error.errors }, { status: 400 });
        }

        let errorMessage = error.message;
        if (error.code) {
            errorMessage = `Prisma Hata Kodu ${error.code}: ${error.message}`;
        }

        return NextResponse.json({ success: false, message: 'Entegrasyon ayarları kaydedilirken hata oluştu.', errorDetail: errorMessage }, { status: 500 });
    }
}

