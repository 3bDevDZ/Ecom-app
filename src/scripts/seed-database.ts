import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CategoryEntity } from '../modules/product-catalog/infrastructure/persistence/entities/category.entity';
import { ProductEntity } from '../modules/product-catalog/infrastructure/persistence/entities/product.entity';
import { ProductVariantEntity } from '../modules/product-catalog/infrastructure/persistence/entities/product-variant.entity';

// Load environment variables
config();

/**
 * Database Seeding Script
 *
 * Seeds the database with sample categories and products for testing.
 *
 * Usage:
 *   ts-node src/scripts/seed-database.ts
 *   or
 *   npm run seed
 */
async function seedDatabase() {
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
    console.log('🌱 Starting database seeding...');

    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const categoryRepo = dataSource.getRepository(CategoryEntity);
    const productRepo = dataSource.getRepository(ProductEntity);
    const variantRepo = dataSource.getRepository(ProductVariantEntity);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    // Delete in order to respect foreign key constraints
    await variantRepo.query('TRUNCATE TABLE product_variants CASCADE');
    await productRepo.query('TRUNCATE TABLE products CASCADE');
    await categoryRepo.query('TRUNCATE TABLE categories CASCADE');
    console.log('✅ Existing data cleared');

    // Create Categories
    console.log('📁 Creating categories...');
    const categories = [
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

    const savedCategories = await categoryRepo.save(categories);
    console.log(`✅ Created ${savedCategories.length} categories`);

    const industrialComponentsId = savedCategories[0].id;
    const electronicsId = savedCategories[1].id;
    const actuatorsId = savedCategories[2].id;
    const powerSuppliesId = savedCategories[3].id;

    // Create Products
    console.log('📦 Creating products...');
    const products = [
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
          {
            userName: 'Emily Rodriguez',
            date: 'November 8, 2024',
            rating: 5,
            comment: 'Excellent investment for our manufacturing facility. Installation was straightforward with the detailed manual. The control system is very intuitive.',
          },
          {
            userName: 'David Thompson',
            date: 'October 30, 2024',
            rating: 4,
            comment: 'Very good product. Works as advertised. Only minor issue was that some mounting hardware was not included in the package. Customer service quickly resolved this.',
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
      },
      {
        id: uuidv4(),
        sku: 'SMX-1',
        name: 'Sensor Module SM-X1',
        description: 'High precision sensor module for industrial applications. Features multiple sensor types and digital output.',
        categoryId: electronicsId,
        brand: 'Stellar Corp',
        images: [
          {
            url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGyPMdLA9J4fenm_oeTlR1fcm7QCpaTlH8blIEPBk-IfcOWLfZS0rmwV97qLZfmhGOLeUg99PbgqHbIPrzcoQDkBbAIpwYU6M5Q2lOUBpdKdvcy6luBaGCS2Fl_evRT9FQdgUUP-qI0njwT4puLONEFSL_CnTwA-jt62-zpHLWZh7wTwaXrZgwKeuQeZNak_uf6YaXqSRJtZAFCOgTp0Looan06o23ntseVnwY0LY1iB1eRgbCBy2LD0VVX5tixL6kJ3eXRt6UmQ',
            altText: 'Sensor Module SM-X1',
            displayOrder: 0,
            isPrimary: true,
          },
        ],
        basePrice: 120.00,
        currency: 'USD',
        minOrderQuantity: 5,
        maxOrderQuantity: 500,
        isActive: false, // Out of stock
        tags: ['sensor', 'electronics', 'precision', 'digital'],
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
          {
            url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnfqqfP2300DmoaImmLt5CK51CCClmqdLz54pSSM1_2JsdsS-_c9-52ALe2oW1QZ_eRFbNHQagqghRSWkxFhkwclNS5gqSql4YxnUcslv1r1CVZNMxRVbiX_IvCo-nqGSbAe7HAR7cfqRUlDj-_LqPsoEIZ-_hDvVcPut0915fb-ySdfmbmaJOoP79ntmdxU6xZUQ-7w4QohhpqFGG8bd6iXnIXkimmqUnHbGoBONrT1e1QDxbNQSwJvk05Sd5AEcuRtx9zAAVSQ',
            altText: 'Side view of the Linear Actuator 3000',
            displayOrder: 1,
            isPrimary: false,
          },
        ],
        basePrice: 499.99,
        currency: 'USD',
        minOrderQuantity: 1,
        maxOrderQuantity: 100,
        isActive: true,
        tags: ['actuator', 'linear', 'precision', 'industrial'],
      },
      {
        id: uuidv4(),
        sku: 'MBK-01',
        name: 'Mounting Bracket Kit',
        description: 'Universal mounting bracket kit for linear actuators. Includes all necessary hardware and adapters.',
        categoryId: actuatorsId,
        brand: 'InnovateX',
        images: [
          {
            url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkcRBTvH4wL9Wd-O9SXj8UyCiUNFntB9-nLX9g7dVrjG5p65fQfqQe6jZZOnvFQjMIYIZm51VQ5XowJOj6W940-LgGFaAmroMW8GupvpImbkDP2byhqtKyVyrvho6yl1IP9y-aBJE3LPys7uZW9p_vLV-lZWqUwSbNsY2gy-IOnC8Qa_B24RRuSsIBix8I89I2ghmC248Ez3TT8PIVJ7W6EnhUjp98cAIJtaxg23AnT5hFldkLwNs5WscO30M0DSaUMkr-ij_UgA',
            altText: 'Mounting Bracket Kit',
            displayOrder: 0,
            isPrimary: true,
          },
        ],
        basePrice: 29.99,
        currency: 'USD',
        minOrderQuantity: 1,
        maxOrderQuantity: null,
        isActive: true,
        tags: ['mounting', 'bracket', 'accessory'],
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
      },
      {
        id: uuidv4(),
        sku: 'PSU-24V-10A',
        name: '24V Power Supply',
        description: 'Heavy-duty power supply for industrial components. 24V output with 10A capacity.',
        categoryId: powerSuppliesId,
        brand: 'Apex Solutions',
        images: [
          {
            url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXQiqSgEg3s77XvAviDrvY2bC3oMNnFNGpDT4L4C7Qr9cx1sKlzRIEEIyngL9lth6WCxAIuFV9x2trIdNyMJfwlw0ijhtczTNUZBqqt8tnGriS0snW1sXn4yJnAtNCvJDRpSucDHgCY4_jO-5oFVI5bOtGazTdZipo7kWPEC-sro3ZpZEHYBU76AAcymGthUgluaoxAJ1B4ey-lxz9JdVBC-oJh6wuEC3kEKbhOr-yZUczjEu6pu2TgDfurpJEawgdsf2he784eA',
            altText: '24V Power Supply',
            displayOrder: 0,
            isPrimary: true,
          },
        ],
        basePrice: 75.50,
        currency: 'USD',
        minOrderQuantity: 1,
        maxOrderQuantity: 200,
        isActive: true,
        tags: ['power-supply', '24v', '10a', 'industrial'],
      },
    ];

    const savedProducts = await productRepo.save(products);
    console.log(`✅ Created ${savedProducts.length} products`);

    // Create Product Variants for some products
    console.log('🔧 Creating product variants...');
    const variants = [
      // PGM-1000 Variants - Power options
      {
        id: uuidv4(),
        productId: savedProducts[0].id, // PGM-1000
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
        productId: savedProducts[0].id, // PGM-1000
        sku: 'PGM-1000-HP-24V',
        attributes: { power: 'High Power', voltage: '24V' },
        priceDelta: 150.00,
        currency: 'USD',
        availableQuantity: 25,
        reservedQuantity: 0,
        isActive: true,
      },
      {
        id: uuidv4(),
        productId: savedProducts[0].id, // PGM-1000
        sku: 'PGM-1000-HP-48V',
        attributes: { power: 'High Power', voltage: '48V' },
        priceDelta: 200.00,
        currency: 'USD',
        availableQuantity: 15,
        reservedQuantity: 0,
        isActive: true,
      },
      // LA-3000 Variants - Stroke lengths
      {
        id: uuidv4(),
        productId: savedProducts[4].id, // LA-3000
        sku: 'LA-3000-50MM',
        attributes: { stroke: '50mm' },
        priceDelta: 0,
        currency: 'USD',
        availableQuantity: 30,
        reservedQuantity: 0,
        isActive: true,
      },
      {
        id: uuidv4(),
        productId: savedProducts[4].id, // LA-3000
        sku: 'LA-3000-100MM',
        attributes: { stroke: '100mm' },
        priceDelta: 50.00,
        currency: 'USD',
        availableQuantity: 20,
        reservedQuantity: 0,
        isActive: true,
      },
      {
        id: uuidv4(),
        productId: savedProducts[4].id, // LA-3000
        sku: 'LA-3000-200MM',
        attributes: { stroke: '200mm' },
        priceDelta: 100.00,
        currency: 'USD',
        availableQuantity: 15,
        reservedQuantity: 0,
        isActive: true,
      },
      // RAU-5C Variants - Payload capacity
      {
        id: uuidv4(),
        productId: savedProducts[1].id, // RAU-5C
        sku: 'RAU-5C-5KG',
        attributes: { payload: '5kg', reach: '800mm' },
        priceDelta: 0,
        currency: 'USD',
        availableQuantity: 10,
        reservedQuantity: 0,
        isActive: true,
      },
      {
        id: uuidv4(),
        productId: savedProducts[1].id, // RAU-5C
        sku: 'RAU-5C-10KG',
        attributes: { payload: '10kg', reach: '800mm' },
        priceDelta: 800.00,
        currency: 'USD',
        availableQuantity: 8,
        reservedQuantity: 0,
        isActive: true,
      },
      {
        id: uuidv4(),
        productId: savedProducts[1].id, // RAU-5C
        sku: 'RAU-5C-10KG-EXT',
        attributes: { payload: '10kg', reach: '1200mm' },
        priceDelta: 1200.00,
        currency: 'USD',
        availableQuantity: 5,
        reservedQuantity: 0,
        isActive: true,
      },
      // HDP-24V Variants - Amperage
      {
        id: uuidv4(),
        productId: savedProducts[2].id, // HDP-24V
        sku: 'HDP-24V-5A',
        attributes: { amperage: '5A' },
        priceDelta: 0,
        currency: 'USD',
        availableQuantity: 100,
        reservedQuantity: 0,
        isActive: true,
      },
      {
        id: uuidv4(),
        productId: savedProducts[2].id, // HDP-24V
        sku: 'HDP-24V-10A',
        attributes: { amperage: '10A' },
        priceDelta: 75.00,
        currency: 'USD',
        availableQuantity: 80,
        reservedQuantity: 0,
        isActive: true,
      },
      {
        id: uuidv4(),
        productId: savedProducts[2].id, // HDP-24V
        sku: 'HDP-24V-15A',
        attributes: { amperage: '15A' },
        priceDelta: 125.00,
        currency: 'USD',
        availableQuantity: 60,
        reservedQuantity: 0,
        isActive: true,
      },
    ];

    await variantRepo.save(variants);
    console.log(`✅ Created ${variants.length} product variants`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Categories: ${savedCategories.length}`);
    console.log(`   - Products: ${savedProducts.length}`);
    console.log(`   - Variants: ${variants.length}`);
    console.log(`\n🌐 You can now test the views at:`);
    console.log(`   - Product Listing: http://localhost:3333/products`);
    console.log(`   - Product Detail: http://localhost:3333/products/${savedProducts[0].id}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seed script
seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding script failed:', error);
    process.exit(1);
  });

