import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { MinioService } from '../shared/infrastructure/storage/minio.service';
import { ReceiptService } from '../modules/order-management/infrastructure/services/receipt.service';
import { OrderEntity } from '../modules/order-management/infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from '../modules/order-management/infrastructure/persistence/entities/order-item.entity';
import { OrderMapper } from '../modules/order-management/infrastructure/persistence/mappers/order.mapper';
import { OrderDto } from '../modules/order-management/application/dtos/order.dto';

// Load environment variables
config();

/**
 * Generate Receipts Script
 *
 * Generates PDF receipts for orders that don't have receipts yet.
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register src/scripts/generate-receipts.ts
 *   or
 *   npm run generate:receipts
 */

async function generateReceipts() {
  // Create DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
    username: process.env.DATABASE_USER || process.env.DB_USERNAME || 'ecommerce',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'ecommerce_password',
    database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'b2b_ecommerce',
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    synchronize: false,
    logging: false,
  });

  try {
    console.log('🧾 Starting receipt generation...');
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Initialize MinIO service manually
    // Create a simple ConfigService mock that reads from environment
    const mockConfigService = {
      get: (key: string) => {
        const envKey = key.replace('app.storage.', '').toUpperCase();
        const storageConfig: any = {
          endpoint: process.env.MINIO_ENDPOINT || 'localhost',
          port: parseInt(process.env.MINIO_PORT || '9000', 10),
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          bucket: process.env.MINIO_BUCKET || 'ecommerce-assets',
        };

        const nestedKeys = key.split('.');
        if (nestedKeys.length === 3 && nestedKeys[0] === 'app' && nestedKeys[1] === 'storage') {
          return storageConfig[nestedKeys[2]];
        }
        if (key === 'app.storage') {
          return storageConfig;
        }
        return process.env[envKey] || undefined;
      },
    };

    const minioService = new MinioService(mockConfigService as any);
    await minioService.onModuleInit();
    console.log('✅ MinIO service initialized');

    // Initialize Receipt service
    const receiptService = new ReceiptService(minioService);

    // Find all orders without receipts
    const orderRepo = dataSource.getRepository(OrderEntity);
    const orderItemRepo = dataSource.getRepository(OrderItemEntity);

    const ordersWithoutReceipts = await orderRepo.find({
      where: [
        { receiptUrl: null },
        { receiptUrl: '' },
      ],
      relations: ['items'],
      take: 100, // Process in batches
    });

    if (ordersWithoutReceipts.length === 0) {
      console.log('✅ All orders already have receipts!');
      return;
    }

    console.log(`📋 Found ${ordersWithoutReceipts.length} orders without receipts`);

    let successCount = 0;
    let errorCount = 0;

    for (const entity of ordersWithoutReceipts) {
      try {
        // Convert entity to domain model
        const order = OrderMapper.toDomain(entity);

        // Convert to DTO
        const orderDto: OrderDto = {
          id: order.id,
          orderNumber: order.orderNumber.value,
          userId: order.userId,
          status: order.status.value,
          items: order.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            lineTotal: item.lineTotal,
          })),
          shippingAddress: {
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country,
            contactName: order.shippingAddress.contactName || '',
            contactPhone: order.shippingAddress.contactPhone || '',
          },
          billingAddress: {
            street: order.billingAddress.street,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            postalCode: order.billingAddress.postalCode,
            country: order.billingAddress.country,
            contactName: order.billingAddress.contactName || '',
            contactPhone: order.billingAddress.contactPhone || '',
          },
          totalAmount: order.totalAmount,
          itemCount: order.itemCount,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };

        // Generate receipt
        const receiptUrl = await receiptService.generateReceipt(orderDto);

        // Update order with receipt URL
        await orderRepo.update(entity.id, { receiptUrl });

        successCount++;
        console.log(`   ✅ Generated receipt for order ${order.orderNumber}`);
      } catch (error: any) {
        errorCount++;
        console.error(`   ❌ Failed to generate receipt for order ${entity.orderNumber}:`, error.message);
        if (error.stack) {
          console.error(`      Stack: ${error.stack.split('\n')[1]}`);
        }
      }
    }

    console.log(`\n📊 Receipt Generation Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n🎉 Receipt generation completed!`);

  } catch (error) {
    console.error('❌ Error generating receipts:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  generateReceipts()
    .then(() => {
      console.log('\n✅ Receipt generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Receipt generation failed:', error);
      process.exit(1);
    });
}

export { generateReceipts };

