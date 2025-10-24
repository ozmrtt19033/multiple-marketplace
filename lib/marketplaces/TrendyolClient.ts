// lib/marketplaces/TrendyolClient.ts

// Gerçek bir uygulamada, 'axios' veya 'fetch' kullanarak Trendyol API'sine HTTP istekleri burada yapılmalıdır.
import axios from 'axios';

interface TrendyolConfig {
    apiKey: string;
    apiSecret: string;
    sellerId: string;
    isTestMode?: boolean; // Yeni alan
}

// Trendyol'un List Product API yanıtının varsayılan yapısı
interface TrendyolProduct {
    productId: number;
    title: string;
    // Trendyol'dan gelen diğer önemli alanlar:
    barcode: string;
    productMainId: string;
    quantity: number;
    price: number;
}

// Trendyol API'sının yanıt yapısını temsil eden arayüz
interface TrendyolProductResponse {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    content: TrendyolProduct[]; // Ürün listesi bu alanda gelir
}

export class TrendyolClient {
    private config: TrendyolConfig;
    private baseURL: string; // Dinamik hale geldi

    constructor(config: TrendyolConfig) {
        this.config = config;

        // Test modu açıksa Sandbox URL'ini kullan
        this.baseURL = config.isTestMode
            ? 'https://stage.trendyol.com/sap/supplier/rest'
            : 'https://api.trendyol.com/sap/supplier/rest';

        console.log(`Trendyol Client Başlatıldı. URL: ${this.baseURL}`);
    }

    // Trendyol API'sına özel yetkilendirme başlıklarını hazırlar
    private getHeaders() {
        // API Key ve API Secret, Base64 encode edilerek HTTP Basic Auth başlığında kullanılır.
        const basicAuth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64');
        return {
            'Authorization': `Basic ${basicAuth}`,
            // Satıcı ID'si ve Satıcı Adı User-Agent içinde olmalıdır (Trendyol gereksinimi)
            // Satıcı Adı kısmına entegrasyon adını veya satıcının gerçek adını girebilirsiniz.
            'User-Agent': `${this.config.sellerId} - Satıcı Adı/V1`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Trendyol'dan ürünleri çeker. BU METOT ASIL API BAĞLANTISININ YAPILACAĞI YERDİR.
     * @param offset - Başlangıç noktası
     * @param limit - Ürün sınırı
     * @returns Trendyol ürün listesi
     */
    public async getProducts(offset: number, limit: number): Promise<TrendyolProduct[]> {

        // Trendyol'da ürün listeleme API yolu
        const url = `${this.baseURL}/products?offset=${offset}&size=${limit}`;

        console.log(`Trendyol API Çağrısı Başlatılıyor (Vendor ID: ${this.config.sellerId}, Test Modu: ${!!this.config.isTestMode}): ${url}`);

        try {
            // Eğer gerçek API'ye bağlanıyorsanız aşağıdaki mock kodu silin
            if (this.config.apiKey.includes('MOCK_KEY') || this.config.apiKey.includes('admin@qolanka.local')) {
                console.warn("DİKKAT: Mock API Key tespit edildi. Simülasyon verisi döndürülüyor.");
                return [
                    { productId: 1000, title: 'Sahte Ürün 1 (Test)', barcode: 'MOCK1', productMainId: 'PM1', quantity: 5, price: 50.0 },
                    { productId: 1001, title: 'Sahte Ürün 2 (Test)', barcode: 'MOCK2', productMainId: 'PM2', quantity: 10, price: 100.0 },
                ];
            }

            // --- GERÇEK API ÇAĞRISI ---
            const response = await axios.get<TrendyolProductResponse>(url, {
                headers: this.getHeaders(),
                maxRedirects: 0
            });

            // Trendyol API'si genellikle ürünleri 'content' alanı içinde döndürür.
            if (response.data && response.data.content) {
                console.log(`Trendyol API'den ${response.data.content.length} ürün başarıyla çekildi.`);
                return response.data.content;
            }

            // Yanıt yapısı beklenmedikse boş liste döndür
            return [];

        } catch (error) {
            // API'den gelen 401, 403 gibi hataları burada yakalayıp daha anlamlı bir hata fırlatabilirsiniz.
            if (axios.isAxiosError(error) && error.response) {
                const status = error.response.status;
                let message = `Trendyol API Hatası: ${status}`;

                if (status === 401) {
                    message = 'HATA: Trendyol Kimlik Doğrulama Başarısız (API Key/Secret yanlış).';
                } else if (status === 403) {
                    message = 'HATA: Trendyol Erişim Reddi (Satıcı ID veya izin hatası).';
                }

                // Rotadaki try/catch bloğunun yakalaması için hatayı tekrar fırlat
                throw new Error(`${message} - Yanıt: ${JSON.stringify(error.response.data)}`);
            }
            throw new Error(`Trendyol'a bağlanılamadı: ${(error as Error).message}`);
        }
    }
}
