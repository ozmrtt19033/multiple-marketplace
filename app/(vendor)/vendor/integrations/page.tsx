'use client';

// TanStack Query, Axios ve React Hook'ları
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useEffect } from 'react'; // useEffect eklendi

// Prisma Tipi ve Lucide İkonları
import { MarketplaceName } from '@prisma/client';
import { CheckCircle, XCircle, Clock, Save, RefreshCw, KeyRound, Lock, Zap, Loader2 } from 'lucide-react'; // CornerRightUp kaldırıldı, Loader2 eklendi

// Tipler (SyncStatus null olabilir)
interface Integration {
    id: string;
    marketplace: MarketplaceName;
    isEnabled: boolean;
    autoSync: boolean; // Bu alan DB'de var mıydı? Şemada görünmüyor ama ekleyelim.
    lastSyncAt: string | null;
    // lastSyncStatus null olabilir (schema.prisma'ya göre)
    lastSyncStatus: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'IN_PROGRESS' | null;
    lastSyncError: string | null; // Hata mesajı için eklendi
    totalProducts: number;
    sellerId: string | null;
}

// Hooks (Aynı)
const useSyncProducts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (marketplace: MarketplaceName) => {
            const { data } = await axios.post('/api/vendor/integrations/sync-products', { marketplace });
            // API'den dönen data objesini doğrudan döndür
            return data;
        },
        // onSuccess ve onError alert yerine daha iyi bir bildirim sistemi kullanılabilir
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['vendor', 'integrations'] });
            alert(data.message || "Ürün senkronizasyonu başarıyla tamamlandı!");
            // Hata varsa onu da gösterelim
            if (data.errors) {
                console.error("Senkronizasyon Hataları:", data.errors);
                alert(`Bazı ürünlerde senkronizasyon hatası oluştu. Detaylar için konsolu kontrol edin.`);
            }
        },
        onError: (error: any) => {
            const message = error.response?.data?.errorDetail || error.response?.data?.message || error.message || 'Bilinmeyen Hata';
            alert(`Senkronizasyon başlatılamadı: ${message}`);
            console.error("Senkronizasyon Hatası Detayı:", error.response?.data || error);
        }
    });
};

const useVendorIntegrations = () => {
    return useQuery<Integration[]>({
        queryKey: ['vendor', 'integrations'],
        queryFn: async () => {
            const { data } = await axios.get('/api/vendor/integrations');
            return data;
        },
        initialData: [],
        // refetchInterval: 5000, // Otomatik yenilemeyi şimdilik kapatalım
    });
};

const useSaveIntegration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (integrationData: any) => {
            const { data } = await axios.post('/api/vendor/integrations', integrationData);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['vendor', 'integrations'] });
            alert(data.message || "Entegrasyon ayarları başarıyla kaydedildi!");
        },
        onError: (error: any) => {
            const message = error.response?.data?.errorDetail || error.response?.data?.message || error.message || 'Bilinmeyen Hata';
            alert(`Kaydetme hatası: ${message}`);
            console.error("Kaydetme Hatası Detayı:", error.response?.data || error);
        }
    });
};

// Sabitler (Aynı)
const marketplaceOptions: { name: string; key: MarketplaceName; logo: string }[] = [
    { name: 'Trendyol', key: 'TRENDYOL', logo: 'https://placehold.co/40x40/FF385C/FFFFFF?text=TR' },
    { name: 'Hepsiburada', key: 'HEPSIBURADA', logo: 'https://placehold.co/40x40/4A90E2/FFFFFF?text=HB' },
    { name: 'N11', key: 'N11', logo: 'https://placehold.co/40x40/01A65E/FFFFFF?text=N11' },
];

// Helperlar (Aynı)
const StatusIcon = ({ status }: { status: Integration['lastSyncStatus'] }) => {
    switch (status) {
        case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
        case 'IN_PROGRESS': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />; // Loader2 eklendi
        case 'PARTIAL': return <Clock className="w-4 h-4 text-yellow-500" />; // Partial için sarı saat
        default: return <Clock className="w-4 h-4 text-gray-400" />; // null veya IDLE için
    }
};

const getStatusText = (status: Integration['lastSyncStatus']) => {
    switch (status) {
        case 'SUCCESS': return 'Başarılı';
        case 'FAILED': return 'Başarısız';
        case 'IN_PROGRESS': return 'Devam Ediyor';
        case 'PARTIAL': return 'Kısmi Başarılı'; // Daha açıklayıcı
        default: return 'Beklemede'; // null veya IDLE için
    }
};

// Ana Component
export default function IntegrationsPage() {
    const { data: integrations, isLoading, isError } = useVendorIntegrations();
    const { mutate: saveIntegration, isPending: isSaving } = useSaveIntegration();
    const { mutate: startSync, isPending: isSyncing } = useSyncProducts();

    const [trendyolConfig, setTrendyolConfig] = useState({
        apiKey: '',
        apiSecret: '',
        isEnabled: false,
        sellerId: ''
    });

    // --- useEffect ile Formu Güvenli Doldurma ---
    useEffect(() => {
        if (integrations && integrations.length > 0) {
            const trConfig = integrations.find(i => i.marketplace === 'TRENDYOL');
            if (trConfig) {
                setTrendyolConfig(prev => ({
                    ...prev, // Önceki api/secret değerlerini koru
                    isEnabled: trConfig.isEnabled,
                    sellerId: trConfig.sellerId || '', // DB'den geleni ata
                }));
            }
        }
    }, [integrations]); // Sadece integrations değiştiğinde çalışır
    // --- useEffect Bitiş ---


    const handleSubmit = (e: React.FormEvent, marketplaceKey: MarketplaceName) => {
        e.preventDefault();
        const payload = {
            marketplace: marketplaceKey,
            // Sadece doluysa gönder, yoksa undefined kalsın (API tarafı boş string atar)
            apiKey: trendyolConfig.apiKey || undefined,
            apiSecret: trendyolConfig.apiSecret || undefined,
            sellerId: trendyolConfig.sellerId, // Zorunlu alan
            isEnabled: trendyolConfig.isEnabled,
        };
        saveIntegration(payload);
    };

    // Yüklenme ve Hata Durumları (Aynı)
    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]"> {/* Yüksekliği ayarla */}
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
    );
    if (isError) return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
            <XCircle className="w-12 h-12 text-red-600 mb-4" />
            <p className="text-lg text-red-600">Veri yüklenirken hata oluştu</p>
        </div>
    );

    // Ana JSX (Tailwind Sınıfları Güncellendi)
    return (
        <div className="space-y-8 max-w-7xl mx-auto"> {/* Sayfa genişliğini sınırladık */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                    Pazar Yeri Entegrasyonları
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Marketplace bağlantılarınızı yönetin ve ürünlerinizi senkronize edin.
                </p>
            </div>

            {/* Entegrasyon Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceOptions.map(market => {
                    const integrationData = integrations?.find(int => int.marketplace === market.key);
                    const isEnabled = integrationData?.isEnabled || false;
                    const isInProgress = integrationData?.lastSyncStatus === 'IN_PROGRESS';

                    return (
                        <div
                            key={market.key}
                            className={`bg-white dark:bg-zinc-800 rounded-lg shadow-md border ${
                                isEnabled
                                    ? 'border-green-300 dark:border-green-700'
                                    : 'border-gray-200 dark:border-zinc-700'
                            } overflow-hidden`} // Overflow hidden eklendi
                        >
                            <div className="p-5"> {/* Padding ayarlandı */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={market.logo}
                                            alt={market.name}
                                            className="w-8 h-8 rounded-md" // Boyut ve köşe ayarlandı
                                        />
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                            {market.name}
                                        </h3>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        isEnabled
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-gray-300'
                                    }`}>
                                        {isEnabled ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Ürün Sayısı:</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">
                                            {integrationData?.totalProducts || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 dark:text-gray-400">Son Durum:</span>
                                        <div className="flex items-center gap-1.5"> {/* Gap ayarlandı */}
                                            <StatusIcon status={integrationData?.lastSyncStatus} />
                                            <span className="font-medium text-gray-700 dark:text-gray-200">
                                                {getStatusText(integrationData?.lastSyncStatus)}
                                            </span>
                                        </div>
                                    </div>
                                    {integrationData?.lastSyncAt && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
                                            Son Eşitleme: {new Date(integrationData.lastSyncAt).toLocaleString('tr-TR')}
                                        </p>
                                    )}
                                    {/* Hata Mesajı Gösterimi */}
                                    {integrationData?.lastSyncStatus === 'FAILED' && integrationData.lastSyncError && (
                                        <p className="text-xs text-red-500 pt-1 truncate" title={integrationData.lastSyncError}>
                                            Hata: {integrationData.lastSyncError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Senkronizasyon Butonu (Trendyol için) */}
                            {market.key === 'TRENDYOL' && isEnabled && (
                                <div className="bg-gray-50 dark:bg-zinc-900 px-5 py-3 border-t dark:border-zinc-700"> {/* Footer alanı */}
                                    <button
                                        onClick={() => startSync('TRENDYOL')}
                                        disabled={isSyncing || isInProgress}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400/50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {isSyncing || isInProgress ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Senkronize Ediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                Ürünleri Senkronize Et
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Ayarlar Formu */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700 p-6">
                <div className="flex items-center gap-3 mb-5 border-b dark:border-zinc-700 pb-4">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Trendyol Ayarları
                    </h2>
                </div>

                <form onSubmit={(e) => handleSubmit(e, 'TRENDYOL')} className="space-y-5">
                    {/* Input Alanları */}
                    {(['sellerId', 'apiKey', 'apiSecret'] as const).map((key) => (
                        <div key={key}>
                            <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                {key === 'sellerId' ? 'Satıcı ID' : key === 'apiKey' ? 'API Key' : 'API Secret'}
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    {key === 'sellerId' ? <KeyRound className="h-5 w-5 text-gray-400" /> : <Lock className="h-5 w-5 text-gray-400" />}
                                </div>
                                <input
                                    type={key === 'apiSecret' ? 'password' : 'text'}
                                    id={key}
                                    name={key}
                                    value={trendyolConfig[key]}
                                    onChange={(e) => setTrendyolConfig(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="block w-full rounded-md border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white pl-10 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder={key === 'sellerId' ? '123456' : 'Gizli anahtarınızı girin'}
                                    required={key === 'sellerId'} // Sadece Seller ID zorunlu
                                />
                            </div>
                        </div>
                    ))}

                    {/* Checkbox */}
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            checked={trendyolConfig.isEnabled}
                            onChange={(e) => setTrendyolConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                            id="trendyol-enabled"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-700 dark:border-zinc-600"
                        />
                        <label htmlFor="trendyol-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Entegrasyonu Aktif Et
                        </label>
                    </div>

                    {/* Kaydet Butonu */}
                    <div className="pt-3"> {/* Buton için padding */}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400/50 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Ayarları Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

