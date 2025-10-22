import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Şifre hash'le
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Admin kullanıcısı oluştur
    const admin = await prisma.user.upsert({
        where: { email: 'admin@marketplace.com' },
        update: {},
        create: {
            email: 'admin@marketplace.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin oluşturuldu:', admin.email);

    // 2. Vendor kullanıcıları ve mağazalar oluştur
    const vendor1User = await prisma.user.upsert({
        where: { email: 'vendor1@marketplace.com' },
        update: {},
        create: {
            email: 'vendor1@marketplace.com',
            name: 'Ahmet Yılmaz',
            password: hashedPassword,
            role: 'VENDOR',
        },
    });

    const vendor1 = await prisma.vendor.upsert({
        where: { userId: vendor1User.id },
        update: {},
        create: {
            userId: vendor1User.id,
            shopName: 'TechStore',
            slug: 'techstore',
            description: 'Teknoloji ürünlerinde uzman mağaza. En yeni elektronik cihazlar ve aksesuarlar.',
            status: 'ACTIVE',
            commissionRate: 10,
            phone: '05551234567',
            rating: 4.5,
            reviewCount: 128,
        },
    });
    console.log('✅ Vendor 1 oluşturuldu:', vendor1.shopName);

    const vendor2User = await prisma.user.upsert({
        where: { email: 'vendor2@marketplace.com' },
        update: {},
        create: {
            email: 'vendor2@marketplace.com',
            name: 'Ayşe Kaya',
            password: hashedPassword,
            role: 'VENDOR',
        },
    });

    const vendor2 = await prisma.vendor.upsert({
        where: { userId: vendor2User.id },
        update: {},
        create: {
            userId: vendor2User.id,
            shopName: 'ModaGiyim',
            slug: 'modagiyim',
            description: 'Trend moda ürünleri ve aksesuar çeşitleri. Kaliteli ve uygun fiyatlı giyim.',
            status: 'ACTIVE',
            commissionRate: 12,
            phone: '05559876543',
            rating: 4.8,
            reviewCount: 256,
        },
    });
    console.log('✅ Vendor 2 oluşturuldu:', vendor2.shopName);

    // 3. Customer kullanıcıları oluştur
    const customer1 = await prisma.user.upsert({
        where: { email: 'customer@marketplace.com' },
        update: {},
        create: {
            email: 'customer@marketplace.com',
            name: 'Mehmet Demir',
            password: hashedPassword,
            role: 'CUSTOMER',
        },
    });
    console.log('✅ Customer oluşturuldu:', customer1.email);

    // 4. Kategoriler oluştur
    const electronics = await prisma.category.upsert({
        where: { slug: 'elektronik' },
        update: {},
        create: {
            name: 'Elektronik',
            slug: 'elektronik',
            description: 'Telefon, bilgisayar, tablet ve elektronik aksesuarlar',
            isActive: true,
            sortOrder: 1,
        },
    });

    const fashion = await prisma.category.upsert({
        where: { slug: 'moda' },
        update: {},
        create: {
            name: 'Moda & Giyim',
            slug: 'moda',
            description: 'Kadın, erkek ve çocuk giyim ürünleri',
            isActive: true,
            sortOrder: 2,
        },
    });

    const home = await prisma.category.upsert({
        where: { slug: 'ev-yasam' },
        update: {},
        create: {
            name: 'Ev & Yaşam',
            slug: 'ev-yasam',
            description: 'Ev dekorasyonu ve yaşam ürünleri',
            isActive: true,
            sortOrder: 3,
        },
    });

    const sports = await prisma.category.upsert({
        where: { slug: 'spor' },
        update: {},
        create: {
            name: 'Spor & Outdoor',
            slug: 'spor',
            description: 'Spor giyim ve ekipmanları',
            isActive: true,
            sortOrder: 4,
        },
    });

    console.log('✅ Kategoriler oluşturuldu');

    // 5. Elektronik ürünleri oluştur
    const electronicProducts = [
        {
            name: 'iPhone 15 Pro Max 256GB',
            slug: 'iphone-15-pro-max-256gb',
            description: 'Apple iPhone 15 Pro Max - Titanium tasarım, A17 Pro çip, 6.7" Super Retina XDR ekran',
            price: 54999,
            comparePrice: 59999,
            stock: 15,
            sku: 'APL-IP15PM-256-TIT',
            isFeatured: true,
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            slug: 'samsung-galaxy-s24-ultra',
            description: 'Samsung Galaxy S24 Ultra - 200MP kamera, S Pen desteği, 6.8" Dynamic AMOLED ekran',
            price: 49999,
            comparePrice: 54999,
            stock: 20,
            sku: 'SAM-S24U-512-BLK',
            isFeatured: true,
        },
        {
            name: 'MacBook Air M3 15"',
            slug: 'macbook-air-m3-15',
            description: 'Apple MacBook Air 15" - M3 çip, 16GB RAM, 512GB SSD, Liquid Retina ekran',
            price: 42999,
            comparePrice: 47999,
            stock: 8,
            sku: 'APL-MBA-M3-15-SLV',
            isFeatured: true,
        },
        {
            name: 'AirPods Pro 2. Nesil',
            slug: 'airpods-pro-2-nesil',
            description: 'Apple AirPods Pro (2. Nesil) - Aktif Gürültü Engelleme, USB-C şarj',
            price: 8999,
            comparePrice: 9999,
            stock: 50,
            sku: 'APL-APP-2ND-USBC',
            isFeatured: false,
        },
        {
            name: 'Sony WH-1000XM5 Kulaklık',
            slug: 'sony-wh-1000xm5-kulaklik',
            description: 'Sony WH-1000XM5 - Endüstri lideri gürültü engelleme, 30 saat pil ömrü',
            price: 10999,
            comparePrice: 12999,
            stock: 25,
            sku: 'SNY-WH1000XM5-BLK',
            isFeatured: false,
        },
    ];

    for (const product of electronicProducts) {
        await prisma.product.create({
            data: {
                ...product,
                vendorId: vendor1.id,
                categoryId: electronics.id,
                status: 'ACTIVE',
                isActive: true,
                viewCount: Math.floor(Math.random() * 1000) + 100,
                soldCount: Math.floor(Math.random() * 50) + 5,
                images: {
                    create: [
                        {
                            url: `https://placehold.co/800x600/3b82f6/white?text=${encodeURIComponent(product.name)}`,
                            altText: `${product.name} ön görünüm`,
                            sortOrder: 0,
                        },
                        {
                            url: `https://placehold.co/800x600/6366f1/white?text=Yan+Gorunum`,
                            altText: `${product.name} yan görünüm`,
                            sortOrder: 1,
                        },
                    ],
                },
            },
        });
    }
    console.log('✅ Elektronik ürünleri oluşturuldu');

    // 6. Moda ürünleri oluştur
    const fashionProducts = [
        {
            name: 'Erkek Slim Fit Kot Pantolon',
            slug: 'erkek-slim-fit-kot-pantolon',
            description: 'Rahat kesim, esnek kumaş, koyu mavi renk. %98 pamuk, %2 elastan.',
            price: 499,
            comparePrice: 699,
            stock: 100,
            sku: 'FSH-DNM-001-BLU',
            isFeatured: true,
        },
        {
            name: 'Kadın Oversize Sweatshirt',
            slug: 'kadin-oversize-sweatshirt',
            description: 'Rahat kesim, yumuşak kumaş, unisex model. %100 pamuk.',
            price: 399,
            comparePrice: 549,
            stock: 75,
            sku: 'FSH-SWT-002-GRY',
            isFeatured: true,
        },
        {
            name: 'Unisex Spor Ayakkabı',
            slug: 'unisex-spor-ayakkabi',
            description: 'Hafif ve rahat, günlük kullanım için ideal. Memory foam tabanlık.',
            price: 899,
            comparePrice: 1199,
            stock: 60,
            sku: 'FSH-SHO-003-WHT',
            isFeatured: false,
        },
        {
            name: 'Kadın Deri Cüzdan',
            slug: 'kadin-deri-cuzdan',
            description: 'Gerçek deri, çok bölmeli, RFID koruma. Şık ve fonksiyonel.',
            price: 299,
            comparePrice: 449,
            stock: 45,
            sku: 'FSH-WLT-004-BRN',
            isFeatured: false,
        },
        {
            name: 'Erkek Kışlık Mont',
            slug: 'erkek-kislik-mont',
            description: 'Su geçirmez, rüzgar geçirmez, kapşonlu. İç astarı termal.',
            price: 1499,
            comparePrice: 1999,
            stock: 30,
            sku: 'FSH-JKT-005-BLK',
            isFeatured: true,
        },
    ];

    for (const product of fashionProducts) {
        await prisma.product.create({
            data: {
                ...product,
                vendorId: vendor2.id,
                categoryId: fashion.id,
                status: 'ACTIVE',
                isActive: true,
                viewCount: Math.floor(Math.random() * 800) + 50,
                soldCount: Math.floor(Math.random() * 40) + 10,
                images: {
                    create: [
                        {
                            url: `https://placehold.co/800x600/ec4899/white?text=${encodeURIComponent(product.name)}`,
                            altText: `${product.name} ön görünüm`,
                            sortOrder: 0,
                        },
                    ],
                },
            },
        });
    }
    console.log('✅ Moda ürünleri oluşturuldu');

    // 7. Müşteri adresi oluştur
    await prisma.address.create({
        data: {
            userId: customer1.id,
            fullName: 'Mehmet Demir',
            phone: '05551112233',
            addressLine: 'Atatürk Caddesi No:123 Daire:5',
            city: 'İstanbul',
            state: 'Kadıköy',
            postalCode: '34710',
            country: 'TR',
            isDefault: true,
        },
    });
    console.log('✅ Müşteri adresi oluşturuldu');

    // 8. Örnek sipariş oluştur
    const product = await prisma.product.findFirst({
        where: { vendorId: vendor1.id },
    });

    if (product) {
        // Decimal tipini number'a çevir
        const price = Number(product.price);
        const shippingFee = 49.99;
        const tax = price * 0.18;
        const total = price + shippingFee + tax;
        const commission = price * 0.10;
        const vendorEarning = price * 0.90;

        const order = await prisma.order.create({
            data: {
                orderNumber: `ORD-${Date.now()}`,
                userId: customer1.id,
                vendorId: vendor1.id,
                status: 'DELIVERED',
                paymentStatus: 'PAID',
                subtotal: price,
                shippingFee: shippingFee,
                tax: tax,
                total: total,
                commission: commission,
                vendorEarning: vendorEarning,
                shippingAddress: 'Atatürk Caddesi No:123 Daire:5, Kadıköy, İstanbul, 34710',
                trackingNumber: 'TRK' + Math.floor(Math.random() * 1000000),
                shippedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 gün önce
                deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 gün önce
                items: {
                    create: {
                        productId: product.id,
                        quantity: 1,
                        price: price,
                        total: price,
                    },
                },
            },
        });
        console.log('✅ Örnek sipariş oluşturuldu:', order.orderNumber);
    }

    console.log('\n🎉 Seeding tamamlandı!\n');
    console.log('📧 Test Hesapları:');
    console.log('   Admin    : admin@marketplace.com / password123');
    console.log('   Vendor 1 : vendor1@marketplace.com / password123');
    console.log('   Vendor 2 : vendor2@marketplace.com / password123');
    console.log('   Customer : customer@marketplace.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Hata:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });