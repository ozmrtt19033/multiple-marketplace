// lib/modules/trendyol/TrendyolModule.ts
import { MarketplaceModule, ModuleConfig, SyncResult } from '../base/ModuleInterface';
import { getCached, invalidateCache } from '@/lib/redis';
import prisma from '@/lib/prisma';
import axios from 'axios';

export class TrendyolModule implements MarketplaceModule {
    name = 'Trendyol';
    enabled: boolean;
    private config: ModuleConfig;
    private apiClient: any;

    constructor(config: ModuleConfig) {
        this.enabled = config.enabled;
        this.config = config;

        // Trendyol API Client
        this.apiClient = axios.create({
            baseURL: config.baseUrl || 'https://api.trendyol.com',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async syncProducts(): Promise<void> {
        console.log('📦 Syncing Trendyol products...');

        try {
            // Trendyol API'den ürünleri çek
            const response = await this.apiClient.get('/products', {
                params: {
                    supplierId: this.config.sellerId,
                },
            });

            const products = response.data.content;

            for (const product of products) {
                // Database'e kaydet veya güncelle
                await prisma.product.upsert({
                    where: {
                        externalId_marketplace: {
                            externalId: product.barcode,
                            marketplace: 'TRENDYOL'
                        }
                    },
                    update: {
                        name: product.title,
                        price: product.salePrice,
                        stock: product.quantity,
                        status: product.approved ? 'ACTIVE' : 'PENDING',
                        lastSyncAt: new Date(),
                    },
                    create: {
                        name: product.title,
                        description: product.description,
                        price: product.salePrice,
                        comparePrice: product.listPrice,
                        stock: product.quantity,
                        externalId: product.barcode,
                        marketplace: 'TRENDYOL',
                        vendorId: 1, // Your vendor ID
                        categoryId: 1, // Map category
                        status: 'ACTIVE',
                    },
                });
            }

            // Cache'i temizle
            await invalidateCache('products:*');

            console.log(`✅ Synced ${products.length} products from Trendyol`);
        } catch (error: any) {
            console.error('❌ Trendyol sync failed:', error.message);
            throw error;
        }
    }

    async getProduct(externalId: string): Promise<any> {
        return await getCached(
            `trendyol:product:${externalId}`,
            async () => {
                const response = await this.apiClient.get(`/products/${externalId}`);
                return response.data;
            },
            300
        );
    }

    async updateProduct(externalId: string, data: any): Promise<void> {
        await this.apiClient.put(`/products/${externalId}`, {
            barcode: externalId,
            title: data.name,
            salePrice: data.price,
            quantity: data.stock,
        });

        await invalidateCache(`trendyol:product:${externalId}`);
    }

    async syncOrders(): Promise<void> {
        console.log('📦 Syncing Trendyol orders...');

        const response = await this.apiClient.get('/orders', {
            params: {
                supplierId: this.config.sellerId,
                status: 'Created',
            },
        });

        const orders = response.data.content;

        for (const order of orders) {
            await prisma.order.upsert({
                where: {
                    externalId_marketplace: {
                        externalId: order.orderNumber,
                        marketplace: 'TRENDYOL'
                    }
                },
                update: {
                    status: this.mapOrderStatus(order.status),
                    lastSyncAt: new Date(),
                },
                create: {
                    orderNumber: order.orderNumber,
                    externalId: order.orderNumber,
                    marketplace: 'TRENDYOL',
                    userId: 1, // System user
                    vendorId: 1,
                    total: order.totalPrice,
                    status: this.mapOrderStatus(order.status),
                },
            });
        }

        console.log(`✅ Synced ${orders.length} orders from Trendyol`);
    }

    async getOrder(externalId: string): Promise<any> {
        const response = await this.apiClient.get(`/orders/${externalId}`);
        return response.data;
    }

    async updateOrderStatus(externalId: string, status: string): Promise<void> {
        await this.apiClient.put(`/orders/${externalId}/status`, {
            status: this.mapToTrendyolStatus(status),
        });
    }

    async updateStock(externalId: string, quantity: number): Promise<void> {
        await this.apiClient.put(`/products/${externalId}/stock`, {
            quantity,
        });
    }

    async updatePrice(externalId: string, price: number): Promise<void> {
        await this.apiClient.put(`/products/${externalId}/price`, {
            salePrice: price,
        });
    }

    private mapOrderStatus(trendyolStatus: string): string {
        const statusMap: Record<string, string> = {
            'Created': 'PENDING',
            'Approved': 'PROCESSING',
            'Shipped': 'SHIPPING',
            'Delivered': 'DELIVERED',
            'Cancelled': 'CANCELLED',
        };
        return statusMap[trendyolStatus] || 'PENDING';
    }

    private mapToTrendyolStatus(status: string): string {
        const statusMap: Record<string, string> = {
            'PENDING': 'Created',
            'PROCESSING': 'Approved',
            'SHIPPING': 'Shipped',
            'DELIVERED': 'Delivered',
            'CANCELLED': 'Cancelled',
        };
        return statusMap[status] || 'Created';
    }
}