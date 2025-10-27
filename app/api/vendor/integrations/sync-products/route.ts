import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MarketplaceName, SyncStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
// @ts-ignore
import { authOptions } from '../../../auth/[...nextauth]/route';

/**
 * GET /api/vendor/integrations/sync-products
 * Senkronizasyon durumunu kontrol et
 */
export async function GET() {
    return NextResponse.json({
        message: 'Bu endpoint sadece POST metodunu destekler. Senkronizasyon başlatmak için POST isteği gönderin.',
        usage: {
            method: 'POST',
            body: { marketplace: 'TRENDYOL' | 'HEPSIBURADA' | 'AMAZON' }
        }
    }, { status: 405 });
}

/**
 * POST /api/vendor/integrations/sync-products
 * Belirtilen marketplace için ürün senkronizasyonu başlatır
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.vendorId) {
            return NextResponse.json(
                { success: false, message: 'Yetkilendirme başarısız veya satıcı (vendor) bilgisi eksik.' },
                { status: 401 }
            );
        }

        const vendorId = session.user.vendorId as string;
        const body = await request.json();
        const { marketplace } = body;

        if (!marketplace) {
            return NextResponse.json(
                { success: false, message: 'Marketplace belirtilmedi.' },
                { status: 400 }
            );
        }

        // Entegrasyonu kontrol et
        const integration = await prisma.marketplaceIntegration.findUnique({
            where: {
                vendorId_marketplace: {
                    vendorId: vendorId,
                    marketplace: marketplace as MarketplaceName,
                }
            }
        });

        if (!integration) {
            return NextResponse.json(
                { success: false, message: 'Entegrasyon bulunamadı. Lütfen önce entegrasyon ayarlarını yapın.' },
                { status: 404 }
            );
        }

        if (!integration.isEnabled) {
            return NextResponse.json(
                { success: false, message: 'Entegrasyon aktif değil. Lütfen önce entegrasyonu aktif edin.' },
                { status: 400 }
            );
        }

        // API bilgilerini kontrol et
        if (!integration.apiKey || !integration.apiSecret || !integration.sellerId) {
            return NextResponse.json(
                { success: false, message: 'API bilgileri eksik. Lütfen API Key, Secret ve Seller ID bilgilerini girin.' },
                { status: 400 }
            );
        }

        // Senkronizasyon durumunu IN_PROGRESS yap
        await prisma.marketplaceIntegration.update({
            where: { id: integration.id },
            data: {
                lastSyncStatus: SyncStatus.IN_PROGRESS,
                lastSyncAt: new Date(),
                lastSyncError: null,
            }
        });

        // Sync Log oluştur
        const syncLog = await prisma.syncLog.create({
            data: {
                marketplaceIntegrationId: integration.id,
                syncType: 'PRODUCTS',
                status: SyncStatus.IN_PROGRESS,
                itemsProcessed: 0,
                itemsSucceeded: 0,
                itemsFailed: 0,
            }
        });

        console.log(`🔄 ${marketplace} senkronizasyonu başlatıldı...`);

        // Marketplace'e göre senkronizasyon fonksiyonunu çağır
        let syncResult;

        try {
            switch (marketplace) {
                case 'TRENDYOL':
                    syncResult = await syncTrendyolProducts(integration, vendorId);
                    break;
                case 'HEPSIBURADA':
                    syncResult = await syncHepsiburadaProducts(integration, vendorId);
                    break;
                case 'AMAZON':
                    syncResult = await syncAmazonProducts(integration, vendorId);
                    break;
                case 'N11':
                case 'CICEKSEPETI':
                case 'GITTIGIDIYOR':
                    return NextResponse.json({
                        success: false,
                        message: `${marketplace} entegrasyonu henüz aktif değil.`
                    }, { status: 400 });
                default:
                    throw new Error('Desteklenmeyen marketplace');
            }

            // Başarılı senkronizasyon
            await prisma.marketplaceIntegration.update({
                where: { id: integration.id },
                data: {
                    lastSyncStatus: SyncStatus.SUCCESS,
                    lastSyncAt: new Date(),
                    totalProducts: syncResult.productCount,
                    lastSyncError: null,
                }
            });

            // Sync Log güncelle
            await prisma.syncLog.update({
                where: { id: syncLog.id },
                data: {
                    status: SyncStatus.SUCCESS,
                    itemsProcessed: syncResult.totalFound || syncResult.productCount,
                    itemsSucceeded: syncResult.productCount,
                    itemsFailed: (syncResult.totalFound || syncResult.productCount) - syncResult.productCount,
                    completedAt: new Date(),
                }
            });

            console.log(`✅ ${marketplace} senkronizasyonu tamamlandı: ${syncResult.productCount} ürün`);

            return NextResponse.json({
                success: true,
                message: `${marketplace} senkronizasyonu başarıyla tamamlandı! ${syncResult.productCount} ürün senkronize edildi.`,
                data: syncResult
            });

        } catch (syncError: any) {
            console.error(`❌ ${marketplace} Senkronizasyon Hatası:`, syncError);

            // Senkronizasyon hatası durumunu kaydet
            await prisma.marketplaceIntegration.update({
                where: { id: integration.id },
                data: {
                    lastSyncStatus: SyncStatus.FAILED,
                    lastSyncError: syncError.message,
                }
            });

            // Sync Log güncelle
            await prisma.syncLog.update({
                where: { id: syncLog.id },
                data: {
                    status: SyncStatus.FAILED,
                    errorMessage: syncError.message,
                    completedAt: new Date(),
                }
            });

            return NextResponse.json({
                success: false,
                message: `${marketplace} senkronizasyonu başarısız oldu: ${syncError.message}`,
                error: syncError.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('❌ Senkronizasyon İşlemi Hatası:', error);
        console.error('❌ Error stack:', error.stack);

        return NextResponse.json({
            success: false,
            message: 'Senkronizasyon başlatılamadı.',
            error: error.message,
            detail: error.stack?.split('\n').slice(0, 3).join('\n')
        }, { status: 500 });
    }
}

// ====== TRENDYOL SYNC ======
async function syncTrendyolProducts(integration: any, vendorId: string) {
    try {
        console.log('🔄 Trendyol senkronizasyonu başlatılıyor...');
        console.log('📋 Seller ID:', integration.sellerId);

        // API bilgileri test modu
        const USE_MOCK = process.env.TRENDYOL_USE_MOCK === 'true';

        let products = [];

        if (USE_MOCK) {
            console.log('🧪 MOCK MODE: Test verisi kullanılıyor (API bilgileri çalışmıyor)');
            products = [
                {
                    id: '1001',
                    barcode: 'TR1001',
                    productCode: 'PROD1001',
                    title: 'Trendyol Test Ürünü 1',
                    description: 'Bu bir test ürünüdür',
                    salePrice: 299.99,
                    listPrice: 399.99,
                    quantity: 50,
                    approved: true
                },
                {
                    id: '1002',
                    barcode: 'TR1002',
                    productCode: 'PROD1002',
                    title: 'Trendyol Test Ürünü 2',
                    description: 'Bu ikinci test ürünüdür',
                    salePrice: 499.99,
                    listPrice: 599.99,
                    quantity: 30,
                    approved: true
                },
                {
                    id: '1003',
                    barcode: 'TR1003',
                    productCode: 'PROD1003',
                    title: 'Trendyol Test Ürünü 3',
                    description: 'Bu üçüncü test ürünüdür',
                    salePrice: 799.99,
                    listPrice: 999.99,
                    quantity: 20,
                    approved: true
                }
            ];
            console.log(`✅ ${products.length} test ürünü oluşturuldu`);
        } else {
            // Gerçek Trendyol API çağrısı
            console.log('🌐 Gerçek Trendyol API\'ye bağlanılıyor...');
            console.log('🔑 Seller ID:', integration.sellerId);
            console.log('🔑 API Key (ilk 10 karakter):', integration.apiKey?.substring(0, 10) + '...');

            const authString = Buffer.from(`${integration.apiKey}:${integration.apiSecret}`).toString('base64');
            console.log('🔐 Auth String (ilk 20 karakter):', authString.substring(0, 20) + '...');

            // v2 endpoint'i dene
            const apiUrl = `https://api.trendyol.com/sapigw/suppliers/${integration.sellerId}/v2/products`;
            console.log('🔗 API URL:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'TrendyolMP/1.0',
                }
            });

            console.log('📡 Response Status:', response.status);

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                    console.error('❌ Trendyol API Yanıtı:', errorText.substring(0, 1000));
                } catch (e) {
                    console.error('❌ Hata metni okunamadı');
                }

                if (response.status === 403) {
                    throw new Error(`Trendyol API erişimi reddedildi (403). 
                        
                        ÇÖZÜM:
                        1. Seller Panel -> Entegrasyonlar -> API Yönetimi
                        2. API erişimini aktif edin
                        3. Yeni API Key ve Secret oluşturun
                        4. Seller ID'yi kontrol edin
                        5. IP whitelist varsa ekleyin
                        
                        Geçici olarak .env dosyasına ekleyin:
                        TRENDYOL_USE_MOCK=true`);
                } else if (response.status === 401) {
                    throw new Error('API kimlik doğrulaması başarısız (401). API Key ve Secret yanlış.');
                } else if (response.status === 404) {
                    throw new Error('API endpoint bulunamadı (404). Seller ID yanlış olabilir.');
                } else {
                    throw new Error(`Trendyol API Hatası (${response.status}): ${errorText.substring(0, 200)}`);
                }
            }

            const data = await response.json();
            console.log('✅ Trendyol API yanıtı alındı');

            products = data.content || data.products || [];
            console.log('📦 Bulunan ürün sayısı:', products.length);
        }

        if (products.length === 0) {
            console.log('⚠️ Trendyol\'da hiç ürün bulunamadı');
            return {
                productCount: 0,
                synced: true,
                totalFound: 0,
                message: 'Trendyol\'da ürün bulunamadı'
            };
        }

        console.log(`📦 ${products.length} ürün bulundu, veritabanına kaydediliyor...`);

        // Vendor'ın varsayılan kategorisini al veya oluştur
        let defaultCategory = await prisma.category.findFirst({
            where: { slug: 'genel' }
        });

        if (!defaultCategory) {
            defaultCategory = await prisma.category.create({
                data: {
                    name: 'Genel',
                    slug: 'genel',
                    description: 'Genel kategori',
                    isActive: true,
                    sortOrder: 999,
                }
            });
        }

        let syncedCount = 0;
        let failedCount = 0;

        // Her ürünü veritabanına kaydet
        for (const product of products) {
            try {
                // Trendyol'daki ürün ID'si
                const externalId = product.barcode || product.productCode || product.id?.toString();

                if (!externalId) {
                    console.warn('⚠️ Ürün ID bulunamadı, atlanıyor');
                    failedCount++;
                    continue;
                }

                // Ürün adı ve slug
                const productName = product.title || product.name || 'İsimsiz Ürün';
                const baseSlug = productName.toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .substring(0, 150);

                // Benzersiz slug oluştur
                const uniqueSlug = `${baseSlug}-${externalId}`.substring(0, 191);

                // Fiyat bilgileri
                const price = parseFloat(product.salePrice || product.price || 0);
                const stock = parseInt(product.quantity || product.stock || 0);

                // Mevcut ürünü kontrol et
                const existingProduct = await prisma.product.findFirst({
                    where: {
                        vendorId: vendorId,
                        externalId: externalId,
                        marketplace: 'TRENDYOL'
                    }
                });

                if (existingProduct) {
                    // Güncelle
                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            name: productName,
                            price: price,
                            stock: stock,
                            description: product.description || existingProduct.description,
                            status: product.approved ? 'ACTIVE' : 'DRAFT',
                            isActive: product.approved || false,
                            lastSyncAt: new Date(),
                            syncStatus: SyncStatus.SUCCESS,
                            syncError: null,
                        }
                    });
                } else {
                    // Yeni ürün oluştur
                    await prisma.product.create({
                        data: {
                            vendorId: vendorId,
                            categoryId: defaultCategory.id,
                            name: productName,
                            slug: uniqueSlug,
                            description: product.description || productName,
                            price: price,
                            stock: stock,
                            sku: `TR-${externalId}`,
                            barcode: product.barcode,
                            status: product.approved ? 'ACTIVE' : 'DRAFT',
                            isActive: product.approved || false,
                            externalId: externalId,
                            marketplace: 'TRENDYOL',
                            lastSyncAt: new Date(),
                            syncStatus: SyncStatus.SUCCESS,
                        }
                    });
                }

                syncedCount++;

                if (syncedCount % 10 === 0) {
                    console.log(`⏳ ${syncedCount}/${products.length} ürün işlendi...`);
                }

            } catch (productError: any) {
                console.error('❌ Ürün kaydetme hatası:', productError.message);
                failedCount++;
                // Tek ürün hatası tüm senkronizasyonu durdurmasın
                continue;
            }
        }

        console.log(`✅ Senkronizasyon tamamlandı: ${syncedCount} başarılı, ${failedCount} başarısız`);

        return {
            productCount: syncedCount,
            synced: true,
            totalFound: products.length,
            failed: failedCount
        };

    } catch (error: any) {
        console.error('❌ Trendyol senkronizasyon hatası:', error);
        throw new Error(`Trendyol senkronizasyon hatası: ${error.message}`);
    }
}

// ====== HEPSIBURADA SYNC ======
async function syncHepsiburadaProducts(integration: any, vendorId: string) {
    console.log('⚠️ Hepsiburada senkronizasyonu henüz aktif değil');

    return {
        productCount: 0,
        synced: true,
        totalFound: 0,
        message: 'Hepsiburada entegrasyonu geliştirme aşamasında'
    };
}

// ====== AMAZON SYNC ======
async function syncAmazonProducts(integration: any, vendorId: string) {
    console.log('⚠️ Amazon senkronizasyonu henüz aktif değil');

    return {
        productCount: 0,
        synced: true,
        totalFound: 0,
        message: 'Amazon entegrasyonu geliştirme aşamasında'
    };
}