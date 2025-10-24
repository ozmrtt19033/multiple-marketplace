// components/FeaturedProductsSection.tsx
'use client'; // <-- KRİTİK: Hook'ları kullanabilmek için Client Component olmalı

import { useFeaturedProducts } from '@/hooks/useProducts'; // Kendi hook'unuz
import Link from 'next/link';

// Tailwind CSS ile hazırlanmış temel ürün kartı bileşeni
const ProductCard = ({ product }: { product: any }) => {
    // Fiyat ve puanın gösterilmesi
    const price = product.price ? parseFloat(product.price).toFixed(2) : 'N/A';
    const rating = product.vendor.rating ? parseFloat(product.vendor.rating).toFixed(2) : '0.00';
    const imageUrl = product.images[0]?.url || '/placeholder.png'; // İlk resmi al

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
            <Link href={`/products/${product.slug}`}>
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                </div>

                <div className="p-4">
                    <h3 className="text-lg font-semibold truncate text-gray-800">{product.name}</h3>
                    <p className="text-xl font-bold text-indigo-600 mt-1">
                        ₺{price}
                    </p>

                    <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                        <span className="truncate">Satıcı: {product.vendor.shopName}</span>
                        <span className="flex items-center">
                            ⭐ {rating}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
};

// Ana Client Component: Veriyi burada çekiyoruz
export function FeaturedProductsSection() {
    const { data, isLoading, isError, error } = useFeaturedProducts();

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Öne Çıkan Ürünler Yükleniyor...</div>;
    }

    if (isError) {
        return <div className="p-8 text-red-600 text-center">Ürünler yüklenirken hata oluştu: {error.message}</div>;
    }

    return (
        <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-zinc-50">Öne Çıkan Ürünler</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {data?.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {data?.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    Henüz öne çıkan ürün bulunmamaktadır.
                </div>
            )}
        </section>
    );
}