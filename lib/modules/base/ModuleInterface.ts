// lib/modules/base/ModuleInterface.ts
export interface MarketplaceModule {
    name: string;
    enabled: boolean;

    // Ürün işlemleri
    syncProducts(): Promise<void>;
    getProduct(externalId: string): Promise<any>;
    updateProduct(externalId: string, data: any): Promise<void>;

    // Sipariş işlemleri
    syncOrders(): Promise<void>;
    getOrder(externalId: string): Promise<any>;
    updateOrderStatus(externalId: string, status: string): Promise<void>;

    // Stok işlemleri
    updateStock(externalId: string, quantity: number): Promise<void>;

    // Fiyat işlemleri
    updatePrice(externalId: string, price: number): Promise<void>;
}

export interface ModuleConfig {
    apiKey?: string;
    apiSecret?: string;
    sellerId?: string;
    baseUrl?: string;
    webhookUrl?: string;
    enabled: boolean;
}

export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}