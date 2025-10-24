// lib/modules/ModuleManager.ts
import { MarketplaceModule } from './base/ModuleInterface';
import { TrendyolModule } from './trendyol/TrendyolModule';
import { AmazonModule } from './amazon/AmazonModule';
import { HepsiBuradaModule } from './hepsiburada/HepsiBuradaModule';

export class ModuleManager {
    private modules: Map<string, MarketplaceModule> = new Map();

    constructor() {
        this.initializeModules();
    }

    private initializeModules() {
        // Trendyol
        if (process.env.TRENDYOL_ENABLED === 'true') {
            this.modules.set('trendyol', new TrendyolModule({
                apiKey: process.env.TRENDYOL_API_KEY!,
                apiSecret: process.env.TRENDYOL_API_SECRET!,
                sellerId: process.env.TRENDYOL_SELLER_ID!,
                baseUrl: process.env.TRENDYOL_BASE_URL,
                enabled: true,
            }));
        }

        // Amazon
        if (process.env.AMAZON_ENABLED === 'true') {
            this.modules.set('amazon', new AmazonModule({
                apiKey: process.env.AMAZON_ACCESS_KEY!,
                apiSecret: process.env.AMAZON_SECRET_KEY!,
                sellerId: process.env.AMAZON_SELLER_ID!,
                enabled: true,
            }));
        }

        // HepsiBurada
        if (process.env.HEPSIBURADA_ENABLED === 'true') {
            this.modules.set('hepsiburada', new HepsiBuradaModule({
                apiKey: process.env.HEPSIBURADA_API_KEY!,
                sellerId: process.env.HEPSIBURADA_SELLER_ID!,
                enabled: true,
            }));
        }

        console.log(`✅ Initialized ${this.modules.size} marketplace modules`);
    }

    getModule(name: string): MarketplaceModule | undefined {
        return this.modules.get(name.toLowerCase());
    }

    getAllModules(): MarketplaceModule[] {
        return Array.from(this.modules.values());
    }

    getEnabledModules(): MarketplaceModule[] {
        return this.getAllModules().filter(m => m.enabled);
    }

    async syncAllProducts(): Promise<void> {
        const modules = this.getEnabledModules();

        console.log(`📦 Syncing products from ${modules.length} marketplaces...`);

        await Promise.all(
            modules.map(module => module.syncProducts())
        );

        console.log('✅ All products synced');
    }

    async syncAllOrders(): Promise<void> {
        const modules = this.getEnabledModules();

        console.log(`📦 Syncing orders from ${modules.length} marketplaces...`);

        await Promise.all(
            modules.map(module => module.syncOrders())
        );

        console.log('✅ All orders synced');
    }
}

// Singleton instance
export const moduleManager = new ModuleManager();