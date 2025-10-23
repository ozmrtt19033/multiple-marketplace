// app/page.tsx (Artık bu dosya Server Component olarak kalabilir)

import Image from "next/image";
import { FeaturedProductsSection } from "@/components/FeaturedProductsSection"; // Yeni Client Component'i içe aktar

export default function Home() {
  return (
      // Tailwind CSS container yapısı
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-7xl flex-col items-center justify-start py-12 px-8 bg-white dark:bg-black sm:items-start">

          {/* --- Başlık ve Çağrılar (Eski İçerik) --- */}
          <div className="w-full flex justify-between items-start mb-16">
            <Image
                className="dark:invert"
                src="/next.svg"
                alt="Next.js logo"
                width={100}
                height={20}
                priority
            />
            {/* Navigasyon veya Giriş/Kayıt butonları buraya eklenebilir */}
          </div>

          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left mb-12">
            <h1 className="max-w-xs text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
              Next.js Marketplace'e Hoş Geldiniz!
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Pazar yerinizin temellerini attınız. Şimdi güçlü entegrasyonlar ve yönetim panelleri kurma zamanı.
            </p>
          </div>
          {/* --- Öne Çıkan Ürünler (Yeni Client Component) --- */}
          <FeaturedProductsSection />

          {/* --- Alt Kısımdaki Butonlar vb. --- */}
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row mt-16">
            <a
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-white transition-colors hover:bg-indigo-700 md:w-[158px]"
                href="/vendor/dashboard"
            >
              Satıcı Paneline Git
            </a>
            <a
                className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                href="/products"
            >
              Tüm Ürünleri Gör
            </a>
          </div>
        </main>
      </div>
  );
}