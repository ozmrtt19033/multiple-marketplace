// app/api/modules/sync/route.ts
import { NextResponse } from 'next/server';
import { moduleManager } from '@/lib/modules/ModuleManager';

export async function POST(request: Request) {
    try {
        const { module, type } = await request.json();

        if (module === 'all') {
            // Tüm modülleri sync et
            if (type === 'products') {
                await moduleManager.syncAllProducts();
            } else if (type === 'orders') {
                await moduleManager.syncAllOrders();
            } else {
                await moduleManager.syncAllProducts();
                await moduleManager.syncAllOrders();
            }
        } else {
            // Belirli bir modülü sync et
            const moduleInstance = moduleManager.getModule(module);

            if (!moduleInstance) {
                return NextResponse.json(
                    { success: false, error: 'Module not found' },
                    { status: 404 }
                );
            }

            if (type === 'products') {
                await moduleInstance.syncProducts();
            } else if (type === 'orders') {
                await moduleInstance.syncOrders();
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Sync completed',
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// GET - Modül durumları
export async function GET() {
    const modules = moduleManager.getAllModules();

    return NextResponse.json({
        success: true,
        data: modules.map(m => ({
            name: m.name,
            enabled: m.enabled,
        })),
    });
}