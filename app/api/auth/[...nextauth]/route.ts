import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
// DÜZELTME: lib/prisma.ts dosyasındaki 'export const prisma' yapısına uyumluluk için
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { UserRole } from '@prisma/client';

// Auth options yapılandırması
export const authOptions = {
    // 1. Adapter: Prisma'yı NextAuth'a bağlama
    adapter: PrismaAdapter(prisma),

    // 2. Secret: .env'den çekilir
    secret: process.env.AUTH_SECRET,

    // 3. Session Strategy: JWT kullanıyoruz
    session: {
        strategy: 'jwt' as const,
    },

    // 4. Providers: Kimlik doğrulama yöntemleri
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { vendor: true },
                });

                if (!user || !(await compare(credentials.password, user.password))) {
                    return null;
                }

                // Başarılı giriş durumunda user nesnesini döndür
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    vendorId: user.vendor ? user.vendor.id : null,
                };
            },
        }),
    ],

    // 5. Callbacks: Oturum ve JWT verilerini yönetme
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.vendorId = (user as any).vendorId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.vendorId = token.vendorId as string | null;
            }
            return session;
        },
    },

    // 6. Sayfalar
    pages: {
        signIn: '/auth/login',
    },
};

// Next.js App Router için rotaları export et
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
