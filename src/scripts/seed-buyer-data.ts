import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CategoryEntity } from '../modules/product-catalog/infrastructure/persistence/entities/category.entity';
import { ProductEntity } from '../modules/product-catalog/infrastructure/persistence/entities/product.entity';
import { ProductVariantEntity } from '../modules/product-catalog/infrastructure/persistence/entities/product-variant.entity';
import { OrderEntity } from '../modules/order-management/infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from '../modules/order-management/infrastructure/persistence/entities/order-item.entity';
import { OrderNumber } from '../modules/order-management/domain/value-objects/order-number';
import { OrderStatus } from '../modules/order-management/domain/value-objects/order-status';

// Load environment variables
config();

/**
 * Seed Products with Specs and Order History for buyer@example.com
 *
 * This script:
 * 1. Seeds products with specifications, documents, and reviews
 * 2. Creates order history for buyer@example.com
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register src/scripts/seed-buyer-data.ts
 *   or
 *   npm run seed:buyer
 */

async function seedBuyerData() {
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
    console.log('🌱 Starting buyer data seeding...');

    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const categoryRepo = dataSource.getRepository(CategoryEntity);
    const productRepo = dataSource.getRepository(ProductEntity);
    const variantRepo = dataSource.getRepository(ProductVariantEntity);
    const orderRepo = dataSource.getRepository(OrderEntity);
    const orderItemRepo = dataSource.getRepository(OrderItemEntity);

    // Get or create categories
    console.log('📁 Checking categories...');
    let categories = await categoryRepo.find();

    if (categories.length === 0) {
      console.log('📁 Creating categories...');
      const newCategories = [
        {
          id: uuidv4(),
          name: 'Industrial Components',
          slug: 'industrial-components',
          description: 'High-quality industrial components and parts',
          parentId: null,
          displayOrder: 1,
          isActive: true,
        },
        {
          id: uuidv4(),
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic devices and components',
          parentId: null,
          displayOrder: 2,
          isActive: true,
        },
        {
          id: uuidv4(),
          name: 'Actuators',
          slug: 'actuators',
          description: 'Linear and rotary actuators',
          parentId: null,
          displayOrder: 3,
          isActive: true,
        },
        {
          id: uuidv4(),
          name: 'Power Supplies',
          slug: 'power-supplies',
          description: 'Industrial power supply units',
          parentId: null,
          displayOrder: 4,
          isActive: true,
        },
      ];
      categories = await categoryRepo.save(newCategories);
      console.log(`✅ Created ${categories.length} categories`);
    } else {
      console.log(`✅ Found ${categories.length} existing categories`);
    }

    const industrialComponentsId = categories.find(c => c.slug === 'industrial-components')?.id || categories[0].id;
    const electronicsId = categories.find(c => c.slug === 'electronics')?.id || categories[1].id;
    const actuatorsId = categories.find(c => c.slug === 'actuators')?.id || categories[2].id;
    const powerSuppliesId = categories.find(c => c.slug === 'power-supplies')?.id || categories[3].id;

    // Check if products already exist
    console.log('📦 Checking products...');
    let products = await productRepo.find({ take: 10 });

    if (products.length === 0) {
      console.log('📦 Creating products with specifications...');
      const newProducts = [
        {
          id: uuidv4(),
          sku: 'PGM-1000',
          name: 'Precision Gear Motor PGM-1000',
          description: 'High-performance industrial gear motor designed for precision applications. Features a robust, corrosion-resistant housing and a high-torque motor for reliable operation under heavy loads.',
          categoryId: industrialComponentsId,
          brand: 'InnovateX',
          images: [
            {
              url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCB4t1aUzpHHUcvEqBntk0pbQsVEHYHL50zlr-8ndFH3pkS3IOk_-sQuLsW_RLzdCs0BE-Uby2IStEnjsiZiuKUfYtmZqWgRbGN5rFL-2KPXTdcqMEuC7kvJ_-Js9xXEeCsjnwFCU3Mg9R0peKKeLtCEfcwr_9sc7RCI98lzaaPim44JUmGB9MMrNeox5x_C-fibDDVgiKYJWCJLyuy7oie1EtKZJyDA8olTgfGh8Q3KUoogoHCk_QQ2kvM1MP0LwP-g5x8wbyY9Q',
              altText: 'Precision Gear Motor PGM-1000',
              displayOrder: 0,
              isPrimary: true,
            },
          ],
          basePrice: 850.00,
          currency: 'USD',
          minOrderQuantity: 1,
          maxOrderQuantity: 100,
          isActive: true,
          tags: ['industrial', 'gear-motor', 'precision', 'high-torque'],
          specifications: {
            'Motor Type': 'Brushless DC',
            'Rated Voltage': '24V / 48V',
            'Rated Power': '500W / 750W',
            'Rated Speed': '3000 RPM',
            'Rated Torque': '1.6 Nm / 2.4 Nm',
            'Gear Ratio': '10:1',
            'Efficiency': '85%',
            'Weight': '3.2 kg',
            'Dimensions': '120mm x 80mm x 100mm',
            'IP Rating': 'IP54',
            'Operating Temperature': '-10°C to 60°C',
            'Noise Level': '< 65 dB',
          },
          documents: [
            {
              title: 'Product Datasheet',
              type: 'PDF',
              size: '2.1 MB',
              url: '/documents/pgm-1000-datasheet.pdf',
            },
            {
              title: 'Installation Guide',
              type: 'PDF',
              size: '1.8 MB',
              url: '/documents/pgm-1000-installation.pdf',
            },
            {
              title: 'Wiring Diagram',
              type: 'PDF',
              size: '0.5 MB',
              url: '/documents/pgm-1000-wiring.pdf',
            },
            {
              title: 'CAD Model (STEP)',
              type: 'STEP',
              size: '8.3 MB',
              url: '/documents/pgm-1000-model.step',
            },
          ],
          reviews: [
            {
              userName: 'James Wilson',
              date: 'November 20, 2024',
              rating: 5,
              comment: 'Excellent gear motor! Very smooth operation and quiet. Perfect for our precision automation application. Highly recommend.',
            },
            {
              userName: 'Sarah Martinez',
              date: 'November 12, 2024',
              rating: 5,
              comment: 'Great quality and performance. The high-torque variant handles our heavy loads without any issues. Installation was straightforward.',
            },
          ],
        },
        {
          id: uuidv4(),
          sku: 'RAU-5C',
          name: 'Robotic Arm Unit RAU-5C',
          description: 'Advanced robotic arm for assembly lines. Features precision control, high payload capacity, and easy integration with existing systems.',
          categoryId: industrialComponentsId,
          brand: 'Quantum Systems',
          images: [
            {
              url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtaPRV5EtHvDLJdIGdCU0MQqAgmRA6bdK-xoEROktO5VWqNDWlyEHlocJwL27dhl4eKATdN_jFJInFiZ45CiV5r27KJBH96XimYqFPdvDwWnX2q_as1HsJ3kgO6X3ey6ELIwJqq6BdBzZ1T7rJvm7Fv7IchVR_B_lyq8qCzWOajq8mXONFliNE7_vgQLgXP4Ovhgm2lZkrkfQEtqlkLT7UmW6aC4FVy8iDDuPZbnJLJ65YxTpXJ7KJDbhjAP6ubna8URuLrmmZ_A',
              altText: 'Robotic Arm Unit RAU-5C',
              displayOrder: 0,
              isPrimary: true,
            },
          ],
          basePrice: 5200.00,
          currency: 'USD',
          minOrderQuantity: 1,
          maxOrderQuantity: 50,
          isActive: true,
          tags: ['robotic', 'automation', 'assembly', 'precision'],
          specifications: {
            'Operating Voltage': '110-240V AC, 50/60Hz',
            'Power Consumption': '850W max',
            'Weight': '65 kg',
            'Dimensions': '1200mm x 800mm x 400mm',
            'Reach': '1500mm',
            'Payload Capacity': '25 kg',
            'Repeatability': '±0.05mm',
            'IP Rating': 'IP54',
            'Operating Temperature': '5°C to 45°C',
            'Control System': 'Integrated PLC with HMI',
          },
          documents: [
            {
              title: 'Technical Specifications',
              type: 'PDF',
              size: '3.2 MB',
              url: '/documents/arm-5000-specs.pdf',
            },
            {
              title: 'Installation Manual',
              type: 'PDF',
              size: '8.5 MB',
              url: '/documents/arm-5000-install.pdf',
            },
            {
              title: 'Programming Guide',
              type: 'PDF',
              size: '12.1 MB',
              url: '/documents/arm-5000-programming.pdf',
            },
            {
              title: 'CAD Model (STEP)',
              type: 'STEP',
              size: '15.4 MB',
              url: '/documents/arm-5000-model.step',
            },
          ],
          reviews: [
            {
              userName: 'Michael Chen',
              date: 'November 15, 2024',
              rating: 5,
              comment: 'Outstanding robotic arm! We integrated it into our production line and it has exceeded all expectations. The precision is remarkable and the build quality is exceptional.',
            },
          ],
        },
        {
          id: uuidv4(),
          sku: 'LA-3000',
          name: 'Linear Actuator 3000',
          description: 'High-performance linear actuator designed for precision industrial applications. Features a robust, corrosion-resistant housing and a high-torque motor for reliable operation under heavy loads.',
          categoryId: actuatorsId,
          brand: 'InnovateX',
          images: [
            {
              url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgWP-xs4xE8fWCM9cZa3y2KOZwtuLzb_qCK1kAg4DiWBGBRdrQltbaDIfXeWX7tedRYCOi-PjOj4bHuz1Bqa3p7ukE6BV7qmJLO0EI5zsyJQCzBvnd44bh77qp9Ky1yCGOb4_k3-oyX3ecIV_rzMR1ilikEi-Oc-Z5fKeKkfUVwOu5TfKGBs9BaZymF5yh_wGckaee5d2X_dxuGXjlxra5x_zmcC_oO5u6bVXAuNo6LSKxtP3tFl32DwYVHnMoswQSjsk2UzQmqQ',
              altText: 'Linear Actuator 3000',
              displayOrder: 0,
              isPrimary: true,
            },
          ],
          basePrice: 499.99,
          currency: 'USD',
          minOrderQuantity: 1,
          maxOrderQuantity: 100,
          isActive: true,
          tags: ['actuator', 'linear', 'precision', 'industrial'],
          specifications: {
            'Stroke Length': '50mm / 100mm / 200mm',
            'Load Capacity': '500N',
            'Speed': '10mm/s (no load), 5mm/s (rated load)',
            'Voltage': '12V / 24V DC',
            'Current': '2A (rated), 4A (max)',
            'Duty Cycle': '25%',
            'Position Accuracy': '±0.1mm',
            'Weight': '1.2 kg',
            'Dimensions': '300mm x 50mm x 50mm (50mm stroke)',
            'IP Rating': 'IP54',
            'Operating Temperature': '-10°C to 60°C',
            'Lifespan': '> 1,000,000 cycles',
          },
          documents: [
            {
              title: 'Product Catalog',
              type: 'PDF',
              size: '3.5 MB',
              url: '/documents/la-3000-catalog.pdf',
            },
            {
              title: 'Installation Manual',
              type: 'PDF',
              size: '2.8 MB',
              url: '/documents/la-3000-installation.pdf',
            },
            {
              title: 'CAD Model (STEP)',
              type: 'STEP',
              size: '12.5 MB',
              url: '/documents/la-3000-model.step',
            },
          ],
          reviews: [
            {
              userName: 'Daniel Lee',
              date: 'November 22, 2024',
              rating: 5,
              comment: 'Perfect linear actuator for our automation project. Smooth operation, precise positioning, and excellent build quality. Highly satisfied!',
            },
          ],
        },
        {
          id: uuidv4(),
          sku: 'HDP-24V',
          name: 'Heavy-Duty PSU HD-24V',
          description: 'Industrial grade power supply unit with 24V output. Designed for harsh environments with IP65 rating.',
          categoryId: powerSuppliesId,
          brand: 'Apex Solutions',
          images: [
            {
              url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBokyC3r2Hrbh5aZDgQ_Ie0_-LvkHs5wfeMRrxHQfQGDppbJ1ZiKCCQgv-zHhfau3ZkHDB-TfdvjoSz7zjO7E0VqO5BRJfonzCOExxIzuVwdKo-MnK6TDM91D9fXXbdHOl6r4UEG8aHcUH0C0NB2d-934wH9CQrjyBpCfly4jrS8WaRuNhW7h6L7s9HhNK-00dIeIM_H93evH28_qY11i30RYOrmwZsawt2lVQc4MPpt2olRymaYbqzHi-mC0YYkw84gQEarMxSuQ',
              altText: 'Heavy-Duty PSU HD-24V',
              displayOrder: 0,
              isPrimary: true,
            },
          ],
          basePrice: 275.50,
          currency: 'USD',
          minOrderQuantity: 1,
          maxOrderQuantity: 200,
          isActive: true,
          tags: ['power-supply', '24v', 'industrial', 'ip65'],
          specifications: {
            'Input Voltage': '100-240V AC, 50/60Hz',
            'Output Voltage': '24V DC',
            'Output Current': '10A',
            'Output Power': '240W',
            'Efficiency': '88%',
            'Regulation': '±1%',
            'Ripple & Noise': '< 150mV',
            'Weight': '1.8 kg',
            'Dimensions': '200mm x 120mm x 80mm',
            'IP Rating': 'IP65',
            'Operating Temperature': '-20°C to 70°C',
            'Protection': 'Overload, Overvoltage, Short Circuit',
          },
          documents: [
            {
              title: 'Technical Specifications',
              type: 'PDF',
              size: '1.5 MB',
              url: '/documents/hdp-24v-specs.pdf',
            },
            {
              title: 'Installation Manual',
              type: 'PDF',
              size: '2.3 MB',
              url: '/documents/hdp-24v-install.pdf',
            },
          ],
          reviews: [
            {
              userName: 'Thomas Anderson',
              date: 'November 18, 2024',
              rating: 5,
              comment: 'Robust power supply that handles harsh industrial environments perfectly. IP65 rating is exactly what we needed. Very reliable.',
            },
          ],
        },
        {
          id: uuidv4(),
          sku: 'ACU-4B',
          name: 'Actuator Control Unit',
          description: 'Advanced control unit for managing multiple linear actuators. Features programmable sequences and safety interlocks.',
          categoryId: electronicsId,
          brand: 'Quantum Systems',
          images: [
            {
              url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjyi5s2x4R3BZp42DZYoMmpJ8hTMHdA6kWU9hf8qQnDBofTNHHOWU2-0ZQKXQSKAEg7SviE--6aIkztN7y_RP51IIHyCY54fWvCzlWyk7rjPO_61EvAuL918zOgwg94LCgsQt2fJIjJnLexLkKw60zzEp0by9bQNWRSEoeaZi0cH9qjwGBlPWic4FZa558I4vgizK8HJ0qqMK3PCosULGvbmGXdHQvf_ASFPZJm4alnSlO3pjutrtci6nG9t9ZKx38q0LeaW1-dw',
              altText: 'Actuator Control Unit',
              displayOrder: 0,
              isPrimary: true,
            },
          ],
          basePrice: 149.00,
          currency: 'USD',
          minOrderQuantity: 1,
          maxOrderQuantity: 100,
          isActive: true,
          tags: ['control-unit', 'electronics', 'programmable'],
          specifications: {
            'Input Voltage': '12V / 24V DC',
            'Power Consumption': '< 5W',
            'Control Channels': '4 independent channels',
            'Communication': 'RS-485, CAN bus, Ethernet',
            'Programming Interface': 'USB, Ethernet',
            'Memory': '512KB flash, 64KB RAM',
            'I/O Ports': '8 digital inputs, 8 digital outputs, 4 analog inputs',
            'Weight': '0.5 kg',
            'Dimensions': '150mm x 100mm x 50mm',
            'IP Rating': 'IP65',
            'Operating Temperature': '-10°C to 60°C',
            'Programming Software': 'Included (Windows/Linux)',
          },
          documents: [
            {
              title: 'User Manual',
              type: 'PDF',
              size: '5.2 MB',
              url: '/documents/acu-4b-manual.pdf',
            },
            {
              title: 'Programming Guide',
              type: 'PDF',
              size: '8.1 MB',
              url: '/documents/acu-4b-programming.pdf',
            },
          ],
          reviews: [
            {
              userName: 'Kevin Park',
              date: 'November 25, 2024',
              rating: 5,
              comment: 'Excellent control unit! Very flexible programming options and easy to integrate. The software is intuitive and well-documented.',
            },
          ],
        },
      ];

      products = await productRepo.save(newProducts);
      console.log(`✅ Created ${products.length} products with specifications`);

      // Create some variants
      console.log('🔧 Creating product variants...');
      const variants = [
        {
          id: uuidv4(),
          productId: products[0].id, // PGM-1000
          sku: 'PGM-1000-STD',
          attributes: { power: 'Standard', voltage: '24V' },
          priceDelta: 0,
          currency: 'USD',
          availableQuantity: 50,
          reservedQuantity: 0,
          isActive: true,
        },
        {
          id: uuidv4(),
          productId: products[0].id, // PGM-1000
          sku: 'PGM-1000-HP-48V',
          attributes: { power: 'High Power', voltage: '48V' },
          priceDelta: 200.00,
          currency: 'USD',
          availableQuantity: 15,
          reservedQuantity: 0,
          isActive: true,
        },
        {
          id: uuidv4(),
          productId: products[2].id, // LA-3000
          sku: 'LA-3000-100MM',
          attributes: { stroke: '100mm' },
          priceDelta: 50.00,
          currency: 'USD',
          availableQuantity: 20,
          reservedQuantity: 0,
          isActive: true,
        },
      ];
      await variantRepo.save(variants);
      console.log(`✅ Created ${variants.length} product variants`);
    } else {
      console.log(`✅ Found ${products.length} existing products`);
    }

    // Get buyer@example.com user ID from Keycloak
    console.log('👤 Fetching user ID for buyer@example.com...');
    let buyerUserId: string | null = null;

    try {
      const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
      const realm = process.env.KEYCLOAK_REALM || 'b2b-ecommerce';
      const adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
      const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

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

      // Find user by email
      const users = await keycloakAdmin.users.find({
        email: 'buyer@example.com',
        exact: true,
      });

      if (users.length > 0) {
        buyerUserId = users[0].id;
        console.log(`✅ Found user: ${users[0].email} - ID: ${buyerUserId}`);
      } else {
        console.log('⚠️  User buyer@example.com not found in Keycloak');
        console.log('   Using placeholder user ID. Orders will be created but may not be visible to the user.');
        buyerUserId = '00000000-0000-0000-0000-000000000001';
      }
    } catch (error: any) {
      console.log(`⚠️  Failed to fetch user from Keycloak: ${error.message}`);
      console.log('   Using placeholder user ID. Orders will be created but may not be visible to the user.');
      buyerUserId = '00000000-0000-0000-0000-000000000001';
    }

    // Create order history for buyer@example.com
    console.log('🛒 Creating order history for buyer@example.com...');

    // Sample address
    const buyerAddress = {
      street: '123 Industrial Avenue',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      contactName: 'Buyer User',
      contactPhone: '+1-555-0101',
    };

    // Order statuses to create
    const statuses = [
      OrderStatus.RECEIVED,
      OrderStatus.CONFIRMED,
      OrderStatus.IN_SHIPPING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    // Create 10 orders with various statuses
    const ordersToCreate = 10;
    const createdOrders: OrderEntity[] = [];

    for (let i = 0; i < ordersToCreate; i++) {
      const orderId = uuidv4();
      const cartId = uuidv4();
      const status = statuses[i % statuses.length];
      const orderNumber = OrderNumber.generate();

      // Select 1-3 random products for this order
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, numItems);

      // Calculate order totals
      let subtotal = 0;
      let currency = 'USD';

      // Create order items
      const items: any[] = [];
      for (const product of selectedProducts) {
        const itemId = uuidv4();
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const unitPrice = Number(product.basePrice);
        const itemSubtotal = unitPrice * quantity;

        subtotal += itemSubtotal;
        currency = product.currency || 'USD';

        items.push({
          id: itemId,
          orderId: orderId,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: quantity,
          unitPrice: unitPrice,
          currency: currency,
        });
      }

      // Calculate totals
      const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
      const shipping = subtotal > 500 ? 0 : 25.00; // Free shipping over $500
      const total = subtotal + tax + shipping;

      // Create order with random date within last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
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
        buyerUserId,
        cartId,
        status.value,
        JSON.stringify(buyerAddress),
        JSON.stringify(buyerAddress),
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

      // Save order items
      for (const item of items) {
        const itemSubtotal = item.unitPrice * item.quantity;
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
          itemSubtotal.toFixed(2),
          item.currency,
        ]);
      }

      // Fetch the saved order
      const order = await orderRepo.findOne({ where: { id: orderId } });
      if (order) {
        createdOrders.push(order);
        console.log(`   ✅ Created order ${order.orderNumber} with ${items.length} items (Status: ${status.value}, Total: $${total.toFixed(2)})`);
      }
    }

    console.log(`\n✅ Successfully created ${createdOrders.length} orders for buyer@example.com`);
    console.log(`\n📊 Order Statistics:`);

    // Count orders by status
    const statusCounts: Record<string, number> = {};
    createdOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });

    console.log(`\n🎉 Buyer data seeding completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length} (with specifications)`);
    console.log(`   - Orders: ${createdOrders.length} (for buyer@example.com)`);
    console.log(`\n🌐 You can now view:`);
    console.log(`   - Products: http://localhost:3333/products`);
    console.log(`   - Orders: http://localhost:3333/orders`);

  } catch (error) {
    console.error('❌ Error seeding buyer data:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed script
if (require.main === module) {
  seedBuyerData()
    .then(() => {
      console.log('\n✅ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export { seedBuyerData };

