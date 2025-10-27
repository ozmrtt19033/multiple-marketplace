'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Aktif link kontrolü için
// DÜZELTME: Loader2 import edildi (loading state için)
import { LayoutDashboard, Package, PlugZap, RefreshCw, LogOut, XCircle, Loader2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

// Sidebar Bileşeni (Stil ve yapı iyileştirildi)
const VendorSidebar = () => {
    const pathname = usePathname();
    const navItems = [
        { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
        { name: 'Ürün Yönetimi', href: '/vendor/products', icon: Package },
        { name: 'Pazar Yeri Entegrasyonları', href: '/vendor/integrations', icon: PlugZap },
    ];

    return (
        // Sidebar stil güncellemeleri: Daha belirgin border, padding
        <nav className="flex flex-col w-64 h-screen bg-gray-900 text-gray-100 border-r border-gray-700 sticky top-0 shadow-lg flex-shrink-0">
            {/* Logo/Başlık Alanı */}
            <div className="h-16 flex items-center justify-center border-b border-gray-700 flex-shrink-0 px-4"> {/* Yükseklik, border ve padding eklendi */}
                <h2 className="text-xl font-semibold text-indigo-400 tracking-wide truncate">VENDOR HUB</h2> {/* Truncate eklendi */}
            </div>
            {/* Navigasyon (Kalan alanı doldur ve scroll ekle) */}
            <div className="flex-1 overflow-y-auto p-4"> {/* Padding ve scroll */}
                <ul className="space-y-1.5"> {/* Aralık ayarlandı */}
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/vendor/dashboard' && pathname.startsWith(item.href));

                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    // Aktif ve hover durumları için daha belirgin stiller
                                    className={`group flex items-center gap-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out ${
                                        isActive
                                            ? 'bg-indigo-600 text-white font-semibold shadow-md' // Aktif link stili
                                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white' // Normal/Hover stili (opacity eklendi)
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white transition-colors duration-150'}`} aria-hidden="true" />
                                    <span className="truncate">{item.name}</span> {/* Truncate eklendi */}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
            {/* Alt Kısım: Çıkış ve Footer */}
            <div className="p-4 border-t border-gray-700 flex-shrink-0"> {/* Padding ve border */}
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    // Çıkış butonu stili
                    className="group flex w-full items-center gap-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors duration-150"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0 text-red-500 group-hover:text-red-400 transition-colors duration-150" aria-hidden="true" />
                    <span>Çıkış Yap</span>
                </button>
                <div className="mt-3 text-xs text-gray-500 text-center">
                    © 2025 Marketplace
                </div>
            </div>
        </nav>
    );
};

// Ana Layout Component (Yapı basitleştirildi, stiller iyileştirildi)
export default function VendorLayout({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    // Oturum yükleniyor durumu
    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span>Oturum Yükleniyor...</span>
            </div>
        );
    }

    // Yetkisiz erişim durumu
    if (!session || session.user.role !== 'VENDOR' || !session.user.vendorId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-50 dark:bg-red-900/10 p-8 text-center">
                <XCircle className="w-12 h-12 mb-4 text-red-500" />
                <h1 className="text-2xl font-semibold text-red-800 dark:text-red-200 mb-3">Yetkisiz Erişim</h1>
                <p className="max-w-md text-red-700 dark:text-red-300 mb-6">Bu panele erişim için geçerli bir Satıcı (Vendor) hesabı ile giriş yapmanız gerekmektedir.</p>
                <Link href="/auth/login" className="px-5 py-2.5 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-red-900/10 transition-colors">
                    Giriş Sayfasına Git
                </Link>
            </div>
        );
    }

    // Ana layout yapısı: Sidebar + Main Content
    return (
        // En dış container: Tüm ekranı kapla, flex yapısı
        <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-zinc-900">
            <VendorSidebar />
            {/* Ana içerik alanı: Kalan alanı doldur, dikey scroll */}
            <main className="flex-1 overflow-y-auto focus:outline-none">
                {/* İçerik padding'i */}
                <div className="py-6 px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

