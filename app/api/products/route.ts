// import { NextResponse } from 'next/server';
// import { getCached, invalidateCache } from '@/lib/redis';
// import prisma from '@/lib/prisma';
//
// // GET - Ürünleri getir (cache'li)
// export async function GET() {
//     try {
//         const products = await getCached(
//             'products:featured',
//             async () => {
//                 console.log('📦 Fetching from database...');
//                 return await prisma.product.findMany({
//                     where: {
//                         isFeatured: true,
//                         status: 'ACTIVE',
//                         isActive: true,
//                     },
//                     include: {
//                         vendor: {
//                             select: {
//                                 shopName: true,
//                                 slug: true,
//                                 rating: true,
//                             },
//                         },
//                         category: {
//                             select: {
//                                 name: true,
//                                 slug: true,
//                             },
//                         },
//                         images: {
//                             take: 1,
//                             select: {
//                                 url: true,
//                                 altText: true,
//                             },
//                         },
//                     },
//                     take: 20,
//                     orderBy: {
//                         soldCount: 'desc',
//                     },
//                 });
//             },
//             300 // 5 dakika cache
//         );
//
//         return NextResponse.json({
//             success: true,
//             data: products,
//             cached: true,
//         });
//     } catch (error: any) {
//         console.error('Error fetching products:', error);
//         return NextResponse.json(
//             { success: false, error: error.message },
//             { status: 500 }
//         );
//     }
// }
//
// // POST - Yeni ürün ekle ve cache'i temizle
// export async function POST(request: Request) {
//     try {
//         const body = await request.json();
//
//         const product = await prisma.product.create({
//             data: body,
//         });
//
//         // Cache'i temizle
//         await invalidateCache('products:*');
//         console.log('🗑️  Product cache cleared');
//
//         return NextResponse.json({
//             success: true,
//             data: product,
//         });
//     } catch (error: any) {
//         return NextResponse.json(
//             { success: false, error: error.message },
//             { status: 500 }
//         );
//     }
// }

import { NextResponse } from 'next/server';
import { getCached, invalidateCache } from '@/lib/redis';
// DÜZELTME: lib/prisma.ts dosyasındaki 'export const prisma' yapısına uyumluluk için
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Auth Options'ı çekiyoruz

// Sabitler
const PRODUCT_CACHE_KEY = 'all_products';
const CACHE_TTL = 3600; // 1 saat

// GET - Ürünleri getir (cache'li)
export async function GET() {
    try {
        // 1. Kimlik Doğrulama Kontrolü (Opsiyonel: Eğer bu rota sadece giriş yapmış kullanıcılar içinse)
        // const session = await getServerSession(authOptions);
        // if (!session) {
        //     return new NextResponse('Yetkisiz Erişim', { status: 401 });
        // }

        // 2. Önbelleği Kontrol Et
        const cachedProducts = await getCached(PRODUCT_CACHE_KEY);
        if (cachedProducts) {
            console.log('Ürünler önbellekten getirildi.');
            return NextResponse.json(JSON.parse(cachedProducts));
        }

        // 3. Veritabanından Ürünleri Çek
        const products = await prisma.product.findMany({
            include: {
                // İhtiyacınız olan ilişkileri buraya ekleyin (örneğin: category, vendor)
                vendor: true,
                marketplaceMappings: true,
            },
            orderBy: {
                createdAt: 'desc',
            }
        });

        // 4. Önbelleğe Kaydet
        await invalidateCache(PRODUCT_CACHE_KEY, JSON.stringify(products), CACHE_TTL);
        console.log('Ürünler veritabanından çekildi ve önbelleğe kaydedildi.');


        return NextResponse.json(products);
    } catch (error) {
        console.error('Ürün Getirme Hatası:', error);
        return NextResponse.json(
            { success: false, message: 'Ürünler getirilirken bir hata oluştu.' },
            { status: 500 }
        );
    }
}

// POST, PUT, DELETE metotları da bu dosyaya eklenebilir.

