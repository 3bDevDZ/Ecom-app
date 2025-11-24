import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { OrderEntity } from '../modules/order-management/infrastructure/persistence/entities/order.entity';

// Load environment variables
config();

/**
 * Update Orders User ID Script
 *
 * Updates existing orders to use a specific Keycloak user ID.
 * Useful after seeding orders with placeholder user IDs.
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register src/scripts/update-orders-user-id.ts [username]
 *   or
 *   npm run update-orders-user-id [username]
 *
 * Example:
 *   npm run update-orders-user-id user
 *   npm run update-orders-user-id buyer@example.com
 */

async function updateOrdersUserId(username?: string) {
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
    console.log('🔄 Starting order user ID update...');

    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const orderRepo = dataSource.getRepository(OrderEntity);

    // Get Keycloak user ID
    let targetUserId: string | null = null;

    if (username) {
      console.log(`🔍 Fetching user ID for username: ${username}`);

      const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
      const realm = process.env.KEYCLOAK_REALM || 'b2b-ecommerce';
      const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
      const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

      // Initialize Keycloak Admin Client
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
        console.log('\nAvailable users (from Keycloak):');
        const allUsers = await keycloakAdmin.users.find({ max: 100 });
        allUsers.forEach(user => {
          console.log(`   - ${user.username} (${user.email}) - ID: ${user.id}`);
        });
        return;
      }

      targetUserId = users[0].id;
      console.log(`✅ Found user: ${users[0].username} (${users[0].email})`);
      console.log(`   User ID: ${targetUserId}`);
    } else {
      // Use environment variable or prompt
      targetUserId = process.env.TARGET_USER_ID || null;

      if (!targetUserId) {
        console.error('❌ No user ID specified. Please provide:');
        console.log('   1. Username/email as argument: npm run update-orders-user-id <username>');
        console.log('   2. Or set TARGET_USER_ID environment variable');
        console.log('\nExample: npm run update-orders-user-id user');
        return;
      }
    }

    // Get count of orders with placeholder user IDs
    const placeholderIds = [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
    ];

    const ordersToUpdate = await orderRepo.find({
      where: placeholderIds.map(id => ({ userId: id })),
    });

    if (ordersToUpdate.length === 0) {
      console.log('ℹ️  No orders found with placeholder user IDs.');
      console.log('   Orders may already be assigned to users, or no orders exist.');
      return;
    }

    console.log(`\n📦 Found ${ordersToUpdate.length} orders to update`);

    // Update orders
    for (const order of ordersToUpdate) {
      await orderRepo.update(order.id, { userId: targetUserId });
      console.log(`   ✅ Updated order ${order.orderNumber}`);
    }

    console.log(`\n✅ Successfully updated ${ordersToUpdate.length} orders to user ID: ${targetUserId}`);
    console.log(`\n🌐 You can now view orders at: http://localhost:3333/orders`);

  } catch (error) {
    console.error('❌ Error updating orders:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Get username from command line argument
const username = process.argv[2];

// Run the script
if (require.main === module) {
  updateOrdersUserId(username)
    .then(() => {
      console.log('\n🎉 Update completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Update failed:', error);
      process.exit(1);
    });
}

export { updateOrdersUserId };

