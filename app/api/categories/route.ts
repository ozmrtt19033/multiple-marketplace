// app/api/categories/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCached } from '@/lib/redis'; // Kendi Redis helper'ınız
import { Category } from '@prisma/client'; // Prisma'dan Category tipini içe aktar

const prisma = new PrismaClient();

/**
 * Kategorileri hiyerarşik yapıda önbellekleyecek ve çekecek.
 * @constructor
 */
export async function GET() {
    // Önbellekleme süresi: 1 saat (3600 saniye)
    const CACHE_TTL = 3600;
    const CACHE_KEY = 'categories:all';

    // Kategorileri çekmek için fetcher fonksiyonu
    const fetchCategories = async (): Promise<Category[]> => {
        // Not: Next.js'in verimli çalışması için sadece gerekli alanları seçin
        const categories = await prisma.category.findMany({
            where: {
                isActive: true, // Sadece aktif kategorileri göster
            },
            select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                image: true,
                sortOrder: true,
                // Alt kategorileri doğrudan çekmiyoruz, hiyerarşi frontendde kurulacak
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });
        return categories;
    };

    try {
        const categories = await getCached<Category[]>(CACHE_KEY, fetchCategories, CACHE_TTL);

        return NextResponse.json(categories, { status: 200 });

    } catch (error) {
        console.error("Kategori çekme hatası:", error);
        return NextResponse.json(
            { message: 'Kategoriler yüklenirken bir hata oluştu.' },
            { status: 500 }
        );
    }
}

/**
 * app/api/categories/route.ts (GET metodunun altına ekleyin)
 */

import { z } from 'zod'; // package.json'da var

/**
 * --- Zod Şeması ---
 */
const CategorySchema = z.object({
    name: z.string().min(1, "Kategori adı gerekli."),
    slug: z.string().min(1, "Slug gerekli."),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    isActive: z.boolean().default(true).optional(),
    sortOrder: z.number().int().default(0).optional(),
});

/**
 * Bu rota, adminin yeni kategori eklemesini sağlayacak.
 * @param request
 * @constructor
 */
export async function POST(request: Request) {
    // Gerçek uygulamada BURADA YETKİLENDİRME (ADMIN ROLÜ) kontrolü yapılmalıdır.
    // Şimdilik varsayıyoruz: user.role === 'ADMIN'

    const CACHE_KEY = 'categories:all';

    try {
        const body = await request.json();
        const data = CategorySchema.parse(body);

        // Slug'ın benzersiz olup olmadığını kontrol et (Prisma unique kısıtlamasına rağmen manuel kontrol daha iyi hata mesajı sağlar)
        const existingCategory = await prisma.category.findUnique({
            where: { slug: data.slug },
        });

        if (existingCategory) {
            return NextResponse.json({ message: 'Bu slug zaten kullanılıyor.' }, { status: 409 });
        }

        const newCategory = await prisma.category.create({
            data: {
                ...data,
                // parentId null veya varsa string olmalı. Zod zaten bunu hallediyor.
            },
        });

        // Önbelleği temizle
        // Bu, GET isteği yapıldığında yeni verinin çekilmesini sağlayacak.
        await deleteCache(CACHE_KEY);

        return NextResponse.json(newCategory, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Doğrulama hatası', errors: error.issues }, { status: 400 });
        }
        console.error("Kategori oluşturma hatası:", error);
        return NextResponse.json({ message: 'Kategori oluşturulurken sunucu hatası oluştu.' }, { status: 500 });
    }
}