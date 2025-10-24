'use client';

// TanStack Query ve Axios Importları
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

// Prisma ve Lucide İkon Importları
import { MarketplaceName } from '@prisma/client';
import { CheckCircle, XCircle, Clock, Save, RefreshCw, KeyRound, Lock, Zap, CornerRightUp } from 'lucide-react';

// API'den gelen verinin tipi (API anahtarları hariç!)
interface Integration {
    id: string;
    marketplace: MarketplaceName;
    isEnabled: boolean;
    autoSync: boolean;
    lastSyncAt: string | null;
    lastSyncStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'IDLE';
    totalProducts: number;
    // Satıcı ID'si de string olarak gelebilir (schema.prisma'ya göre)
    sellerId: string | null;
}

// Senkronizasyon Mutasyonu Hook'u
const useSyncProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (marketplace: MarketplaceName) => {
            const { data } = await axios.post('/api/vendor/integrations/sync-products', { marketplace });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', 'integrations'] });
            alert("Ürün senkronizasyonu başarıyla tetiklendi ve tamamlandı.");
        },
        onError: (error) => {
            alert(`Senkronizasyon başlatılamadı: ${(error as any).response?.data?.message || 'Bilinmeyen Hata'}`);
        }
    });
}

// Entegrasyon Verilerini Çekme Hook'u
const useVendorIntegrations = () => {
    return useQuery<Integration[]>({
        queryKey: ['vendor', 'integrations'],
        queryFn: async () => {
            const { data } = await axios.get('/api/vendor/integrations');
            return data;
        },
        initialData: [],
    });
};

// Entegrasyon Verilerini Kaydetme Hook'u
const useSaveIntegration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (integrationData: any) => {
            const { data } = await axios.post('/api/vendor/integrations', integrationData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor', 'integrations'] });
            alert("Entegrasyon ayarları başarıyla kaydedildi!");
        },
        onError: (error) => {
            // Hata mesajını daha anlaşılır hale getirelim.
            const message = (error as any).response?.data?.message || (error as Error).message || 'Bilinmeyen Hata';
            alert(`Kaydetme hatası: ${message}`);
        }
    });
};


// Pazar Yeri Seçenekleri
const marketplaceOptions: { name: string; key: MarketplaceName; logo: string }[] = [
    { name: 'Trendyol', key: 'TRENDYOL', logo: 'https://placehold.co/40x40/FF385C/FFFFFF?text=TR' },
    { name: 'Hepsiburada', key: 'HEPSIBURADA', logo: 'https://placehold.co/40x40/4A90E2/FFFFFF?text=HB' },
    { name: 'N11', key: 'N11', logo: 'https://placehold.co/40x40/01A65E/FFFFFF?text=N11' },
];

// Helper: Durum ikonlarını döndürür
const StatusIcon = ({ status }: { status: Integration['lastSyncStatus'] }) => {
    switch (status) {
        case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
        case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
        default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
};

export default function IntegrationsPage() {
    // Hook'lardan verileri çekme
    const { data: integrations, isLoading, isError } = useVendorIntegrations();
    const { mutate: saveIntegration, isPending: isSaving } = useSaveIntegration();
    const { mutate: startSync, isPending: isSyncing } = useSyncProducts();

    // Varsayılan Trendyol yapılandırması (Form State)
    const defaultTrendyolConfig = {
        apiKey: '',
        apiSecret: '',
        isEnabled: false,
        sellerId: ''
    };

    // Form durumu
    const [trendyolConfig, setTrendyolConfig] = useState(defaultTrendyolConfig);

    // Veriler yüklendiğinde formu doldur
    if (integrations && trendyolConfig.apiKey === defaultTrendyolConfig.apiKey) {
        const trConfig = integrations.find(i => i.marketplace === 'TRENDYOL');
        if (trConfig) {
            // Sadece isEnabled ve sellerId'yi DB'den alıyoruz, API/Secret alanları güvenlik nedeniyle boş kalır.
            // DB'den gelen sellerId null olabilir, bu yüzden string'e çeviriyoruz.
            setTrendyolConfig(prev => ({
                ...prev, // TÜM ÖNCEKİ ALANLARI KORU
                isEnabled: trConfig.isEnabled,
                sellerId: trConfig.sellerId || '',
            }));
        }
    }


    // Form gönderme işlevi
    // Satır 314 civarı hatayı önlemek için fonksiyon tanımını dışarı taşıyoruz veya arrow function'ı daha güvenli hale getiriyoruz.
    const handleSubmit = (e: React.FormEvent, marketplaceKey: MarketplaceName) => {
        e.preventDefault();

        const payload = {
            marketplace: marketplaceKey,
            apiKey: trendyolConfig.apiKey,
            apiSecret: trendyolConfig.apiSecret,
            sellerId: trendyolConfig.sellerId,
            isEnabled: trendyolConfig.isEnabled,
        };

        saveIntegration(payload);
    };

    // Yüklenme ve Hata Durumları (Tailwind ile stilize edilmiş)
    if (isLoading) return <div className="text-center p-16 text-lg text-indigo-600 dark:text-indigo-400 animate-pulse">
        <RefreshCw className="w-8 h-8 mx-auto mb-3" />
        Pazar Yeri entegrasyon ayarları yükleniyor...
    </div>;
    if (isError) return <div className="text-center p-16 text-lg text-red-600 dark:text-red-400">
        <XCircle className="w-8 h-8 mx-auto mb-3" />
        Veri yüklenirken kritik bir hata oluştu.
    </div>;

    // Ana bileşen
    return (
        <div className="space-y-12 p-6 md:p-10">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-zinc-100 border-b pb-4 border-zinc-200 dark:border-zinc-700">
                Pazar Yeri Entegrasyonları
            </h1>

            {/* Mevcut Entegrasyon Durumu Kartları */}
            <section>
                <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-zinc-300">Mevcut Durum</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketplaceOptions.map(market => {
                        const i = integrations?.find(int => int.marketplace === market.key);
                        const isEnabled = i?.isEnabled || false;
                        const lastSyncSuccess = i?.lastSyncStatus === 'SUCCESS';

                        return (
                            <div key={market.key} className={`p-6 rounded-2xl shadow-xl transition-all duration-300 transform hover:shadow-2xl hover:-translate-y-1 
                                ${isEnabled ? 'bg-white border-4 border-green-500/50 dark:bg-zinc-800' : 'bg-gray-100 border-2 border-gray-300 dark:bg-zinc-800 dark:border-zinc-700'}`
                            }>
                                <div className="flex items-center space-x-4 mb-4 border-b border-gray-200 dark:border-zinc-700 pb-3">
                                    <img src={market.logo} alt={`${market.name} Logo`} className={`rounded-full w-12 h-12 object-cover ${isEnabled ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-400'}`} />
                                    <h3 className="font-bold text-2xl text-gray-800 dark:text-zinc-100">{market.name}</h3>
                                </div>

                                <p className={`text-sm font-medium ${isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'} flex items-center space-x-1`}>
                                    {isEnabled ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                                    <span>{isEnabled ? 'Aktif ve Bağlı' : 'Pasif / Yapılandırılmadı'}</span>
                                </p>

                                <div className="mt-4 pt-4 border-t border-dashed border-gray-300 dark:border-zinc-700 text-sm text-gray-500 dark:text-zinc-400 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span>Ürün Sayısı:</span>
                                        <span className="font-bold text-gray-700 dark:text-zinc-200">{i?.totalProducts || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Son Senkronizasyon:</span>
                                        <div className={`flex items-center space-x-1 font-medium ${lastSyncSuccess ? 'text-green-600' : i?.lastSyncStatus === 'FAILED' ? 'text-red-600' : ''}`}>
                                            <StatusIcon status={i?.lastSyncStatus || 'IDLE'} />
                                            <span>{i?.lastSyncAt ? new Date(i.lastSyncAt).toLocaleString() : 'Hiç Yok'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Senkronizasyon Butonu (Trendyol için) */}
                                {market.key === 'TRENDYOL' && isEnabled && (
                                    <button
                                        className="mt-5 w-full bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition duration-200 shadow-md shadow-indigo-500/50 flex items-center justify-center space-x-2 disabled:bg-indigo-400"
                                        onClick={() => startSync('TRENDYOL')}
                                        disabled={isSyncing}
                                    >
                                        {isSyncing ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin"/>
                                                <span>Senkronize Ediliyor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CornerRightUp className="w-4 h-4"/>
                                                <span>Ürünleri Şimdi Senkronize Et</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Trendyol Ayar Formu */}
            <section className="max-w-xl mx-auto p-10 border rounded-3xl shadow-2xl shadow-indigo-500/10 bg-white dark:bg-zinc-800 dark:border-zinc-700">
                <h2 className="text-3xl font-bold mb-8 text-indigo-700 dark:text-indigo-400 flex items-center space-x-3 border-b pb-4 border-indigo-100 dark:border-zinc-700">
                    <Zap className="w-8 h-8" />
                    <span>Trendyol Bağlantı Ayarları</span>
                </h2>

                {/* Satır 314 civarında bulunan form tag'indeki onSubmit handler'ı */}
                <form onSubmit={(e) => handleSubmit(e, 'TRENDYOL')} className="space-y-6">
                    {/* Satıcı ID */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-zinc-300">Trendyol Satıcı ID (Vendor ID)</label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={trendyolConfig.sellerId}
                                onChange={(e) => setTrendyolConfig(prev => ({ ...prev, sellerId: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white transition shadow-inner"
                                placeholder="Örn: 123456"
                                required
                            />
                        </div>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-zinc-300">API Anahtarı</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={trendyolConfig.apiKey}
                                onChange={(e) => setTrendyolConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white transition shadow-inner"
                                placeholder="Yeni API Key'i giriniz"
                            />
                        </div>
                    </div>

                    {/* API Secret */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-zinc-300">API Secret</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={trendyolConfig.apiSecret}
                                onChange={(e) => setTrendyolConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-zinc-700 dark:border-zinc-600 dark:text-white transition shadow-inner"
                                placeholder="Yeni API Secret'ı giriniz"
                            />
                        </div>
                    </div>

                    {/* Durum Anahtarı (Checkbox) */}
                    <div className="flex items-center space-x-3 pt-3">
                        <input
                            type="checkbox"
                            checked={trendyolConfig.isEnabled}
                            onChange={(e) => setTrendyolConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                            id="trendyol-enabled"
                            className="h-5 w-5 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500 dark:bg-zinc-600 dark:border-zinc-500"
                        />
                        <label htmlFor="trendyol-enabled" className="text-base font-medium text-gray-700 dark:text-zinc-300">Entegrasyonu Aktif Et (Hatalı kimlik bilgisi girilmediğinden emin olun)</label>
                    </div>

                    {/* Kaydet Butonu */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3 px-4 flex items-center justify-center space-x-2 rounded-xl shadow-lg text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-indigo-400 transform hover:-translate-y-0.5"
                    >
                        <Save className="w-5 h-5" />
                        <span>{isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet ve Bağlan'}</span>
                    </button>
                </form>
            </section>
        </div>
    );
}
