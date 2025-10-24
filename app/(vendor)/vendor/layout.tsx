// app/(vendor)/vendor/layout.tsx
'use client'; // Client Component olarak işaretlendi
import { ReactNode } from 'react';
import Link from 'next/link';
// DÜZELTME: XCircle import edildi
import { LayoutDashboard, Package, PlugZap, RefreshCw, LogOut, XCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react'; // NextAuth hook'larını import et

// ... (VendorSidebar bileşeni aynı kalacak) ...
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
                const isActive = item.href === '/vendor/integrations';

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
            {/* Çıkış Butonu Eklendi */}
            <li>
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                    className="flex w-full items-center space-x-3 p-3 rounded-xl transition duration-200 text-sm font-medium text-red-400 hover:bg-zinc-800 hover:text-red-300"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Çıkış Yap</span>
                </button>
            </li>
        </ul>
        <div className="mt-12 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
            © 2025 Marketplace
        </div>
    </nav>
);
// ... (VendorSidebar bileşeni bitişi) ...

export default function VendorLayout({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="ml-3">Oturum Yükleniyor...</p>
            </div>
        );
    }

    // Satıcı (VENDOR) rolü ve Vendor ID kontrolü
    if (!session || session.user.role !== 'VENDOR' || !session.user.vendorId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-100 text-red-800 p-8">
                <XCircle className="w-12 h-12 mb-4" /> {/* <--- ARTIK TANIMLI */}
                <h1 className="text-2xl font-bold mb-3">Yetkisiz Erişim</h1>
                <p className="text-center">Bu panele erişim için bir Satıcı (Vendor) hesabı ile giriş yapmanız gerekmektedir.</p>
                <Link href="/auth/login" className="mt-5 text-indigo-600 font-semibold hover:underline">
                    Giriş Sayfasına Git
                </Link>
            </div>
        );
    }


    // Ana konteyner: Yan menü ve içerik alanı
    return (
        <div className="flex bg-gray-50 dark:bg-zinc-900">
            <VendorSidebar />
            <main className="flex-grow p-10 md:p-12 overflow-x-hidden min-h-screen">
                {children}
            </main>
        </div>
    );
}