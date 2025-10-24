// app/api/vendor/integrations/sync-products/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TrendyolClient } from '@/lib/marketplaces/TrendyolClient';
import { Marketplace, LastSyncStatus } from '@prisma/client';

/**
 * Trendyol için ürün senkronizasyonunu başlatan API rotası (POST).
 * Bu rota, Trendyol API'sine bağlanır ve ürünleri çeker.
 */
export async function POST() {
    try {
        // 1. Trendyol Entegrasyon Ayarlarını Çek
        const integration = await prisma.marketplaceIntegration.findFirst({
            where: { marketplace: Marketplace.TRENDYOL },
        });

        // 2. Entegrasyon Kontrolü
        if (!integration || !integration.isEnabled) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Trendyol entegrasyonu aktif değil.'
                },
                { status: 400 }
            );
        }

        if (!integration.apiKey || !integration.apiSecret || !integration.sellerId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Trendyol entegrasyonu için kimlik bilgileri eksik.'
                },
                { status: 400 }
            );
        }

        // 3. Trendyol Client'ı Başlat
        const trendyolClient = new TrendyolClient({
            apiKey: integration.apiKey,
            apiSecret: integration.apiSecret,
            sellerId: integration.sellerId,
            isTestMode: false, // CANLI VERİ İÇİN FALSE
        });

        // 4. Ürünleri Çek
        // TODO: Gerçek entegrasyonda tüm sayfaları döngüye alın
        const products = await trendyolClient.getProducts(0, 50);

        // 5. Veritabanı İşlemleri
        // TODO: Ürünleri Product tablosuna kaydetme/güncelleme işlemlerini buraya ekleyin
        console.log(`Trendyol'dan çekilen toplam ürün sayısı: ${products.length}`);

        // 6. Entegrasyon Durumunu Güncelle - Başarılı
        await prisma.marketplaceIntegration.update({
            where: { id: integration.id },
            data: {
                lastSyncStatus: LastSyncStatus.SUCCESS,
                lastSyncDate: new Date(),
                productCount: products.length,
                lastErrorMessage: null, // Başarılı olduğu için hata mesajını temizle
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Trendyol ürün senkronizasyonu başarıyla tamamlandı.',
            totalProductsSynced: products.length,
            marketplace: 'TRENDYOL',
            syncDate: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Trendyol Ürün Senkronizasyon Hatası:', error);

        const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata oluştu';

        // Hata durumunda entegrasyon durumunu güncelle
        try {
            const integration = await prisma.marketplaceIntegration.findFirst({
                where: { marketplace: Marketplace.TRENDYOL },
            });

            if (integration) {
                await prisma.marketplaceIntegration.update({
                    where: { id: integration.id },
                    data: {
                        lastSyncStatus: LastSyncStatus.FAILED,
                        lastSyncDate: new Date(),
                        lastErrorMessage: errorMessage.substring(0, 500),
                    },
                });
            }
        } catch (dbError) {
            console.error('Hata durumunu veritabanına kaydetme başarısız:', dbError);
        }

        // Hata türüne göre uygun HTTP status kodu belirle
        let statusCode = 500;
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            statusCode = 401;
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            statusCode = 403;
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Senkronizasyon sırasında hata oluştu.',
                error: errorMessage,
                marketplace: 'TRENDYOL',
            },
            { status: statusCode }
        );
    }
}