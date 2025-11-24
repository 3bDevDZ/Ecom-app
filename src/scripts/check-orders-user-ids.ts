import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { OrderEntity } from '../modules/order-management/infrastructure/persistence/entities/order.entity';

// Load environment variables
config();

/**
 * Check Orders User IDs Script
 *
 * Shows which user IDs have orders in the database.
 */

async function checkOrdersUserIds() {
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
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    const orderRepo = dataSource.getRepository(OrderEntity);

    // Get all orders grouped by userId
    const orders = await orderRepo.find({
      select: ['id', 'orderNumber', 'userId', 'status', 'createdAt'],
      order: { createdAt: 'DESC' },
    });

    console.log(`📦 Total orders in database: ${orders.length}\n`);

    // Group by userId
    const ordersByUser = orders.reduce((acc, order) => {
      if (!acc[order.userId]) {
        acc[order.userId] = [];
      }
      acc[order.userId].push(order);
      return acc;
    }, {} as Record<string, OrderEntity[]>);

    console.log(`👥 Unique user IDs with orders: ${Object.keys(ordersByUser).length}\n`);
    console.log('📋 Orders by User ID:');
    console.log('=' .repeat(80));

    for (const [userId, userOrders] of Object.entries(ordersByUser)) {
      console.log(`\nUser ID: ${userId}`);
      console.log(`   Orders: ${userOrders.length}`);
      console.log(`   Sample orders:`);
      userOrders.slice(0, 3).forEach(order => {
        console.log(`     - ${order.orderNumber} (${order.status}) - Created: ${order.createdAt.toISOString().split('T')[0]}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 To assign orders to a specific user, run:');
    console.log('   npm run update-orders-user-id <username>');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

checkOrdersUserIds()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

