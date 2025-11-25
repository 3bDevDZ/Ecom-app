import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OrderEntity } from '../modules/order-management/infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from '../modules/order-management/infrastructure/persistence/entities/order-item.entity';
import { ProductEntity } from '../modules/product-catalog/infrastructure/persistence/entities/product.entity';
import { OrderNumber } from '../modules/order-management/domain/value-objects/order-number';
import { OrderStatus } from '../modules/order-management/domain/value-objects/order-status';

// Load environment variables
config();

/**
 * Order Seeding Script
 *
 * Seeds the database with sample orders for testing.
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register src/scripts/seed-orders.ts
 *   or
 *   npm run seed:orders
 */

async function seedOrders(username?: string) {
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
    console.log('🛒 Starting order seeding...');

    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const orderRepo = dataSource.getRepository(OrderEntity);
    const orderItemRepo = dataSource.getRepository(OrderItemEntity);
    const productRepo = dataSource.getRepository(ProductEntity);

    // Get existing products
    const products = await productRepo.find({ take: 10 });
    if (products.length === 0) {
      console.error('❌ No products found. Please seed products first using: npm run seed');
      return;
    }

    console.log(`📦 Found ${products.length} products to use in orders`);

    // Get user IDs - support username parameter, environment variable, or fetch from Keycloak
    let testUserIds: string[] = [];

    if (username) {
      console.log(`🔍 Fetching user ID for username: ${username}`);

      const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
      const realm = process.env.KEYCLOAK_REALM || 'b2b-ecommerce';
      const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
      const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

      try {
        // Initialize Keycloak Admin Client
        const KeycloakAdminClient = require('@keycloak/keycloak-admin-client').default;
        const keycloakAdmin = new KeycloakAdminClient({
          baseUrl: keycloakUrl,
          realmName: 'master',
        });

        // Authenticate
        await keycloakAdmin.auth({
          grantType: 'password',
          clientId: 'admin-cli',
          username: adminUser,
          password: adminPassword,
        });

        // Switch to target realm
        keycloakAdmin.setConfig({
          realmName: realm,
        });

        // Find user by username or email
        const users = await keycloakAdmin.users.find({
          username: username,
          email: username,
          exact: false,
        });

        if (users.length === 0) {
          console.error(`❌ User "${username}" not found in Keycloak`);
          return;
        }

        testUserIds = [users[0].id];
        console.log(`✅ Found user: ${users[0].username} (${users[0].email}) - ID: ${users[0].id}`);
      } catch (error: any) {
        console.error(`❌ Failed to fetch user from Keycloak: ${error.message}`);
        console.log('   Falling back to environment variable or placeholder IDs...');
      }
    }

    if (testUserIds.length === 0 && process.env.SEED_USER_IDS) {
      testUserIds = process.env.SEED_USER_IDS.split(',').map(id => id.trim());
      console.log(`👤 Using user IDs from environment: ${testUserIds.length} users`);
    }

    if (testUserIds.length === 0) {
      // Default test user IDs - these are placeholder UUIDs
      // In production, you should fetch actual Keycloak user IDs
      testUserIds = [
        '00000000-0000-0000-0000-000000000001', // Test user 1
        '00000000-0000-0000-0000-000000000002', // Test user 2
      ];
      console.log(`⚠️  Using placeholder user IDs. Provide username parameter or set SEED_USER_IDS env var.`);
    }

    // Sample addresses (using 2-letter ISO country codes)
    const sampleAddresses = [
      {
        street: '123 Industrial Avenue',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US', // 2-letter ISO code
        contactName: 'John Doe',
        contactPhone: '+1-555-0101',
      },
      {
        street: '456 Manufacturing Blvd',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US', // 2-letter ISO code
        contactName: 'Jane Smith',
        contactPhone: '+1-555-0202',
      },
      {
        street: '789 Commerce Street',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'US', // 2-letter ISO code
        contactName: 'Robert Johnson',
        contactPhone: '+1-555-0303',
      },
    ];

    // Order statuses to seed
    const statuses = [
      OrderStatus.RECEIVED,
      OrderStatus.IN_CONFIRMATION,
      OrderStatus.CONFIRMED,
      OrderStatus.IN_SHIPPING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // Create orders
    console.log('📝 Creating orders...');
    const ordersToCreate = 15;
    const orders: OrderEntity[] = [];

    for (let i = 0; i < ordersToCreate; i++) {
      const orderId = uuidv4();
      const cartId = uuidv4();
      const userId = testUserIds[i % testUserIds.length];
      const addressIndex = i % sampleAddresses.length;
      const status = statuses[i % statuses.length];
      const orderNumber = OrderNumber.generate();

      // Select 1-4 random products for this order
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, numItems);

      // Calculate order totals from items first
      let subtotal = 0;
      let currency = 'USD';

      // Create order items first to calculate totals
      const items: any[] = [];
      for (const product of selectedProducts) {
        const itemId = uuidv4();
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 items
        const unitPrice = Number(product.basePrice);
        const itemSubtotal = unitPrice * quantity;

        subtotal += itemSubtotal;
        currency = product.currency || 'USD';

        const item = {
          id: itemId,
          orderId: orderId,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: quantity,
          unitPrice: unitPrice,
          subtotal: itemSubtotal,
          currency: currency,
        };

        items.push(item);
      }

      // Calculate totals
      const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
      const shipping = subtotal > 500 ? 0 : 25.00; // Free shipping over $500
      const total = subtotal + tax + shipping;

      // Create order using raw query to include all database columns
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
      const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      let deliveredAt = null;

      // Set deliveredAt if order is delivered
      if (status === OrderStatus.DELIVERED) {
        deliveredAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      }

      // Insert order using raw query to handle all database columns
      await dataSource.query(`
        INSERT INTO "orders" (
          "id", "orderNumber", "userId", "cartId", "status",
          "shippingAddress", "billingAddress", "subtotal", "tax", "shipping", "total", "currency",
          "createdAt", "updatedAt", "deliveredAt", "receiptUrl"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        orderId,
        orderNumber.value,
        userId,
        cartId,
        status.value,
        JSON.stringify(sampleAddresses[addressIndex]),
        JSON.stringify(sampleAddresses[addressIndex]),
        subtotal.toFixed(2),
        tax.toFixed(2),
        shipping.toFixed(2),
        total.toFixed(2),
        currency,
        createdAt,
        updatedAt,
        deliveredAt,
        null, // receiptUrl
      ]);

      // Fetch the saved order to get timestamps
      const order = await orderRepo.findOne({ where: { id: orderId } });
      if (!order) {
        throw new Error(`Failed to retrieve saved order ${orderId}`);
      }

      // Save order items using raw query to include subtotal
      for (const item of items) {
        await dataSource.query(`
          INSERT INTO "order_items" (
            "id", "orderId", "productId", "productName", "sku",
            "quantity", "unitPrice", "subtotal", "currency"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          item.id,
          item.orderId,
          item.productId,
          item.productName,
          item.sku,
          item.quantity,
          item.unitPrice.toFixed(2),
          item.subtotal.toFixed(2),
          item.currency,
        ]);
      }

      if (order) {
        order.items = items;
        orders.push(order);
      }

      console.log(`   ✅ Created order ${order.orderNumber} with ${items.length} items (Status: ${status.value})`);
    }

    console.log(`\n✅ Successfully created ${orders.length} orders`);
    console.log(`\n📊 Order Statistics:`);

    // Count orders by status
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    console.log(`\n🌐 You can now view orders at:`);
    console.log(`   - Orders Listing: http://localhost:3333/orders`);

  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed script
if (require.main === module) {
  // Get username from command line argument
  const username = process.argv[2];

  seedOrders(username)
    .then(() => {
      console.log('\n🎉 Order seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Order seeding failed:', error);
      process.exit(1);
    });
}

export { seedOrders };

