// hooks/useProducts.ts

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// API'nizden beklediğimiz veri yapısının TypeScript tipi
interface ProductData {
    id: string;
    name: string;
    slug: string;
    price: number;
    // ... diğer alanlar
    vendor: { shopName: string; slug: string; rating: number };
    category: { name: string; slug: string };
    images: { url: string; altText: string }[];
}

interface ApiResponse {
    success: boolean;
    data: ProductData[];
    cached: boolean;
}

const fetchFeaturedProducts = async (): Promise<ProductData[]> => {
    const { data } = await axios.get<ApiResponse>('/api/products');
    // API'nin döndürdüğü 'data' dizisini döndürüyoruz.
    return data.data;
};

export const useFeaturedProducts = () => {
    return useQuery<ProductData[], Error>({
        // Benzersiz key: products ve featured
        queryKey: ['products', 'featured'],
        queryFn: fetchFeaturedProducts,
        staleTime: 1000 * 60 * 5, // 5 dakika boyunca 'stale' kabul edilmez.
        refetchOnWindowFocus: false,
    });
};