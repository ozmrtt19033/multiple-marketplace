// app/(vendor)/vendor/layout.tsx
// Vendor Paneli için Ana Düzen ve Navigasyon (Tailwind CSS)

import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, PlugZap } from 'lucide-react';

const VendorSidebar = () => (
    // Sabit, tam yükseklikte, koyu renkli yan menü (h-screen ve sticky kullanarak kaydırmaz hale getirildi)
    <nav className="w-64 flex-shrink-0 bg-zinc-900 text-white h-screen sticky top-0 border-r border-zinc-800 p-6 shadow-2xl overflow-y-auto">
        <h2 className="text-2xl font-extrabold mb-8 text-indigo-400 tracking-wider">
            VENDOR HUB
        </h2>
        <ul className="space-y-2">
            {[
                { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
                { name: 'Ürün Yönetimi', href: '/vendor/products', icon: Package },
                { name: 'Pazar Yeri Entegrasyonları', href: '/vendor/integrations', icon: PlugZap },
            ].map(item => {
                const Icon = item.icon;
                const isActive = item.href === '/vendor/integrations'; // Aktif kontrolü

                return (
                    <li key={item.name}>
                        <Link
                            href={item.href}
                            className={`flex items-center space-x-3 p-3 rounded-xl transition duration-200 text-sm font-medium 
                                ${isActive
                                ? 'bg-indigo-700 text-white shadow-xl shadow-indigo-700/30'
                                : 'text-zinc-300 hover:bg-zinc-800 hover:text-indigo-400'
                            }
                            `}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
        <div className="mt-12 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
            © 2025 Marketplace
        </div>
    </nav>
);

export default function VendorLayout({ children }: { children: ReactNode }) {
    // Ana konteyner: Yan menü ve içerik alanı
    return (
        <div className="flex bg-gray-50 dark:bg-zinc-900">
            {/* Yan Menü */}
            <VendorSidebar />

            {/* Ana İçerik Alanı */}
            <main className="flex-grow p-10 md:p-12 overflow-x-hidden min-h-screen">
                {children}
            </main>
        </div>
    );
}
