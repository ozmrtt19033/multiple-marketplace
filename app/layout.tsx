
import { AppProviders } from './providers'; // Client bileşenini import edin

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="tr">
        <body>
        {/* Hata alıyorsanız, QueryClientProvider'ın burada çağrıldığından emin olun. */}
        <AppProviders>
            {children}
        </AppProviders>
        </body>
        </html>
    );
}
