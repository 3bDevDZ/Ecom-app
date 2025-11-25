import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { OrderEntity } from '../modules/order-management/infrastructure/persistence/entities/order.entity';

// Load environment variables
config();

/**
 * Fix Orders Country Codes Script
 *
 * Updates existing orders to use 2-letter ISO country codes instead of 3-letter codes.
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register src/scripts/fix-orders-country-codes.ts
 *   or
 *   npm run fix-orders-country-codes
 */

async function fixOrdersCountryCodes() {
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
    console.log('🔧 Starting country code fix...');

    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const orderRepo = dataSource.getRepository(OrderEntity);

    // Get all orders
    const orders = await orderRepo.find();
    console.log(`📦 Found ${orders.length} orders to check`);

    let updatedCount = 0;

    // Country code mapping (3-letter to 2-letter ISO)
    const countryCodeMap: Record<string, string> = {
      'USA': 'US',
      'GBR': 'GB',
      'CAN': 'CA',
      'AUS': 'AU',
      'DEU': 'DE',
      'FRA': 'FR',
      'ITA': 'IT',
      'ESP': 'ES',
      'NLD': 'NL',
      'BEL': 'BE',
    };

    for (const order of orders) {
      let needsUpdate = false;
      const shippingAddress = { ...order.shippingAddress };
      const billingAddress = { ...order.billingAddress };

      // Fix shipping address country code
      if (shippingAddress.country && shippingAddress.country.length > 2) {
        const newCode = countryCodeMap[shippingAddress.country] || shippingAddress.country.substring(0, 2).toUpperCase();
        if (newCode !== shippingAddress.country) {
          shippingAddress.country = newCode;
          needsUpdate = true;
        }
      }

      // Fix billing address country code
      if (billingAddress.country && billingAddress.country.length > 2) {
        const newCode = countryCodeMap[billingAddress.country] || billingAddress.country.substring(0, 2).toUpperCase();
        if (newCode !== billingAddress.country) {
          billingAddress.country = newCode;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await orderRepo.update(order.id, {
          shippingAddress: shippingAddress as any,
          billingAddress: billingAddress as any,
        });
        updatedCount++;
        console.log(`   ✅ Updated order ${order.orderNumber}`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} orders`);
    console.log(`\n🌐 You can now view orders at: http://localhost:3333/orders`);

  } catch (error) {
    console.error('❌ Error fixing country codes:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  fixOrdersCountryCodes()
    .then(() => {
      console.log('\n🎉 Fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fix failed:', error);
      process.exit(1);
    });
}

export { fixOrdersCountryCodes };

