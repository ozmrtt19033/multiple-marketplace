-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(30) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'VENDOR', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    `emailVerified` DATETIME(3) NULL,
    `image` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendors` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `shopName` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `logo` VARCHAR(500) NULL,
    `banner` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `commissionRate` DECIMAL(5, 2) NOT NULL DEFAULT 10,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `totalSales` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `rating` DECIMAL(3, 2) NOT NULL DEFAULT 0,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vendors_userId_key`(`userId`),
    UNIQUE INDEX `vendors_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_integrations` (
    `id` VARCHAR(30) NOT NULL,
    `vendorId` VARCHAR(30) NOT NULL,
    `marketplace` ENUM('TRENDYOL', 'HEPSIBURADA', 'AMAZON', 'N11', 'CICEKSEPETI', 'GITTIGIDIYOR', 'PTTAVM', 'PAZARAMA', 'IDFIX', 'CRON', 'TEKNOSA', 'BEYMEN', 'KOTON', 'VODAFONE', 'COMPANY') NOT NULL,
    `apiKey` TEXT NULL,
    `apiSecret` TEXT NULL,
    `sellerId` VARCHAR(100) NULL,
    `merchantId` VARCHAR(100) NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `autoSync` BOOLEAN NOT NULL DEFAULT false,
    `syncInterval` INTEGER NOT NULL DEFAULT 60,
    `lastSyncAt` DATETIME(3) NULL,
    `lastSyncStatus` ENUM('SUCCESS', 'FAILED', 'PARTIAL', 'IN_PROGRESS') NULL,
    `lastSyncError` TEXT NULL,
    `totalProducts` INTEGER NOT NULL DEFAULT 0,
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `totalSales` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `marketplace_integrations_marketplace_idx`(`marketplace`),
    INDEX `marketplace_integrations_isEnabled_idx`(`isEnabled`),
    UNIQUE INDEX `marketplace_integrations_vendorId_marketplace_key`(`vendorId`, `marketplace`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_logs` (
    `id` VARCHAR(30) NOT NULL,
    `marketplaceIntegrationId` VARCHAR(30) NOT NULL,
    `syncType` ENUM('PRODUCTS', 'ORDERS', 'STOCK', 'PRICES', 'FULL') NOT NULL,
    `status` ENUM('SUCCESS', 'FAILED', 'PARTIAL', 'IN_PROGRESS') NOT NULL,
    `itemsProcessed` INTEGER NOT NULL DEFAULT 0,
    `itemsSucceeded` INTEGER NOT NULL DEFAULT 0,
    `itemsFailed` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `errorMessage` TEXT NULL,
    `errorDetails` JSON NULL,

    INDEX `sync_logs_marketplaceIntegrationId_idx`(`marketplaceIntegrationId`),
    INDEX `sync_logs_syncType_idx`(`syncType`),
    INDEX `sync_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `image` VARCHAR(500) NULL,
    `parentId` VARCHAR(30) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(30) NOT NULL,
    `vendorId` VARCHAR(30) NOT NULL,
    `categoryId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `comparePrice` DECIMAL(10, 2) NULL,
    `cost` DECIMAL(10, 2) NULL,
    `sku` VARCHAR(100) NULL,
    `barcode` VARCHAR(100) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `lowStockAlert` INTEGER NOT NULL DEFAULT 5,
    `weight` DECIMAL(10, 2) NULL,
    `dimensions` VARCHAR(100) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `soldCount` INTEGER NOT NULL DEFAULT 0,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` TEXT NULL,
    `externalId` VARCHAR(100) NULL,
    `marketplace` ENUM('TRENDYOL', 'HEPSIBURADA', 'AMAZON', 'N11', 'CICEKSEPETI', 'GITTIGIDIYOR', 'PTTAVM', 'PAZARAMA', 'IDFIX', 'CRON', 'TEKNOSA', 'BEYMEN', 'KOTON', 'VODAFONE', 'COMPANY') NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `syncStatus` ENUM('SUCCESS', 'FAILED', 'PARTIAL', 'IN_PROGRESS') NULL,
    `syncError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    UNIQUE INDEX `products_sku_key`(`sku`),
    INDEX `products_vendorId_idx`(`vendorId`),
    INDEX `products_categoryId_idx`(`categoryId`),
    INDEX `products_status_idx`(`status`),
    INDEX `products_marketplace_idx`(`marketplace`),
    INDEX `products_externalId_idx`(`externalId`),
    UNIQUE INDEX `products_externalId_marketplace_key`(`externalId`, `marketplace`),
    FULLTEXT INDEX `products_name_description_idx`(`name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_marketplace_mappings` (
    `id` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `marketplace` ENUM('TRENDYOL', 'HEPSIBURADA', 'AMAZON', 'N11', 'CICEKSEPETI', 'GITTIGIDIYOR', 'PTTAVM', 'PAZARAMA', 'IDFIX', 'CRON', 'TEKNOSA', 'BEYMEN', 'KOTON', 'VODAFONE', 'COMPANY') NOT NULL,
    `externalId` VARCHAR(100) NOT NULL,
    `externalSku` VARCHAR(100) NULL,
    `price` DECIMAL(10, 2) NULL,
    `stock` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `lastSyncAt` DATETIME(3) NULL,
    `syncStatus` ENUM('SUCCESS', 'FAILED', 'PARTIAL', 'IN_PROGRESS') NULL,
    `syncError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_marketplace_mappings_marketplace_idx`(`marketplace`),
    INDEX `product_marketplace_mappings_productId_idx`(`productId`),
    UNIQUE INDEX `product_marketplace_mappings_productId_marketplace_key`(`productId`, `marketplace`),
    UNIQUE INDEX `product_marketplace_mappings_externalId_marketplace_key`(`externalId`, `marketplace`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_images` (
    `id` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `altText` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_images_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(30) NOT NULL,
    `orderNumber` VARCHAR(100) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `vendorId` VARCHAR(30) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `shippingFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `commission` DECIMAL(10, 2) NOT NULL,
    `vendorEarning` DECIMAL(10, 2) NOT NULL,
    `shippingAddress` TEXT NOT NULL,
    `billingAddress` TEXT NULL,
    `customerNote` TEXT NULL,
    `vendorNote` TEXT NULL,
    `trackingNumber` VARCHAR(100) NULL,
    `shippedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `externalId` VARCHAR(100) NULL,
    `marketplace` ENUM('TRENDYOL', 'HEPSIBURADA', 'AMAZON', 'N11', 'CICEKSEPETI', 'GITTIGIDIYOR', 'PTTAVM', 'PAZARAMA', 'IDFIX', 'CRON', 'TEKNOSA', 'BEYMEN', 'KOTON', 'VODAFONE', 'COMPANY') NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `syncStatus` ENUM('SUCCESS', 'FAILED', 'PARTIAL', 'IN_PROGRESS') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    INDEX `orders_userId_idx`(`userId`),
    INDEX `orders_vendorId_idx`(`vendorId`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_marketplace_idx`(`marketplace`),
    INDEX `orders_externalId_idx`(`externalId`),
    UNIQUE INDEX `orders_externalId_marketplace_key`(`externalId`, `marketplace`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` VARCHAR(30) NOT NULL,
    `orderId` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,

    INDEX `order_items_orderId_idx`(`orderId`),
    INDEX `order_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `addresses` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `addressLine` VARCHAR(500) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `postalCode` VARCHAR(20) NOT NULL,
    `country` VARCHAR(5) NOT NULL DEFAULT 'TR',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `addresses_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reviews_userId_idx`(`userId`),
    INDEX `reviews_productId_idx`(`productId`),
    UNIQUE INDEX `reviews_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wishlist_items` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `productId` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `wishlist_items_userId_idx`(`userId`),
    INDEX `wishlist_items_productId_idx`(`productId`),
    UNIQUE INDEX `wishlist_items_userId_productId_key`(`userId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payouts` (
    `id` VARCHAR(30) NOT NULL,
    `vendorId` VARCHAR(30) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `method` VARCHAR(50) NULL,
    `reference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `payouts_vendorId_idx`(`vendorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_integrations` ADD CONSTRAINT `marketplace_integrations_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sync_logs` ADD CONSTRAINT `sync_logs_marketplaceIntegrationId_fkey` FOREIGN KEY (`marketplaceIntegrationId`) REFERENCES `marketplace_integrations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_marketplace_mappings` ADD CONSTRAINT `product_marketplace_mappings_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wishlist_items` ADD CONSTRAINT `wishlist_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
