import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { LandingPageContentEntity } from '../modules/landing-cms/infrastructure/persistence/entities/landing-page-content.entity';

// Load environment variables
config();

/**
 * Landing Page Database Seeding Script
 *
 * Seeds the database with default landing page content for the B2B E-Commerce Platform.
 *
 * Usage:
 *   ts-node -r tsconfig-paths/register src/scripts/seed-landing-page.ts
 *   or
 *   npm run seed:landing-page
 */
async function seedLandingPage() {
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
    console.log('🌱 Starting landing page seeding...');

    // Initialize connection
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const landingPageRepo = dataSource.getRepository(LandingPageContentEntity);

    // Check if landing page content already exists
    const existingContent = await landingPageRepo.findOne({ where: {} });

    if (existingContent) {
      console.log('⚠️  Landing page content already exists. Skipping seed.');
      console.log('💡 To re-seed, delete existing content first or modify the script.');
      await dataSource.destroy();
      return;
    }

    // Create default landing page content
    console.log('📝 Creating default landing page content...');

    const landingPageContent: Partial<LandingPageContentEntity> = {
      id: uuidv4(),

      // Hero Section
      heroHeading: 'Premium Industrial Solutions for Your Business',
      heroSubheading: 'Discover high-quality industrial components, electronics, and equipment. Trusted by leading manufacturers worldwide.',
      heroBackgroundImageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&h=1080&fit=crop',
      heroCtaButtonText: 'Browse Products',
      heroCtaButtonLink: '/products',

      // Trust Logos - Sample companies
      trustLogos: [
        {
          id: uuidv4(),
          name: 'TechCorp Industries',
          imageUrl: 'https://via.placeholder.com/200x80/4F46E5/FFFFFF?text=TechCorp',
          displayOrder: 1,
        },
        {
          id: uuidv4(),
          name: 'Global Manufacturing',
          imageUrl: 'https://via.placeholder.com/200x80/7C3AED/FFFFFF?text=Global+Mfg',
          displayOrder: 2,
        },
        {
          id: uuidv4(),
          name: 'AutoSystems Ltd',
          imageUrl: 'https://via.placeholder.com/200x80/2563EB/FFFFFF?text=AutoSystems',
          displayOrder: 3,
        },
        {
          id: uuidv4(),
          name: 'Industrial Solutions Inc',
          imageUrl: 'https://via.placeholder.com/200x80/059669/FFFFFF?text=Ind+Solutions',
          displayOrder: 4,
        },
      ],

      // Product Showcase - Featured categories
      productShowcase: [
        {
          id: uuidv4(),
          name: 'Industrial Components',
          imageUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&h=400&fit=crop',
          displayOrder: 1,
        },
        {
          id: uuidv4(),
          name: 'Electronics',
          imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
          displayOrder: 2,
        },
        {
          id: uuidv4(),
          name: 'Actuators',
          imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=400&fit=crop',
          displayOrder: 3,
        },
        {
          id: uuidv4(),
          name: 'Power Supplies',
          imageUrl: 'https://images.unsplash.com/photo-1558346547-4439467bd1d5?w=600&h=400&fit=crop',
          displayOrder: 4,
        },
      ],

      // Showroom Information
      showroomAddress: '123 Industrial Parkway, Suite 500, Manufacturing District, ST 12345, United States',
      showroomBusinessHours: 'Monday - Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 3:00 PM',
      showroomMapImageUrl: 'https://via.placeholder.com/800x400/E5E7EB/6B7280?text=Map+Location',

      // Contact Section
      contactHeading: 'Get in Touch with Our Team',
      contactDescription: 'Have questions about our products or services? Our experienced team is ready to help you find the perfect industrial solutions for your business needs.',

      // Footer Content
      footerCompanyDescription: 'Leading provider of industrial components and electronics. Serving businesses worldwide with premium quality products and exceptional customer service since 2010.',
      footerNavigationLinks: [
        { label: 'Products', url: '/products' },
        { label: 'Categories', url: '/categories' },
        { label: 'About Us', url: '/about' },
        { label: 'Contact', url: '/contact' },
        { label: 'Terms of Service', url: '/terms' },
        { label: 'Privacy Policy', url: '/privacy' },
      ],
      footerCopyrightText: '© 2025 B2B E-Commerce Platform. All rights reserved.',

      // Published status - set to true so it's immediately visible
      isPublished: true,
    };

    const savedContent = await landingPageRepo.save(landingPageContent);
    console.log(`✅ Landing page content created with ID: ${savedContent.id}`);
    console.log('📊 Content details:');
    console.log(`   - Hero heading: "${savedContent.heroHeading}"`);
    console.log(`   - Trust logos: ${savedContent.trustLogos.length} companies`);
    console.log(`   - Product showcase: ${savedContent.productShowcase.length} categories`);
    console.log(`   - Publication status: ${savedContent.isPublished ? 'Published ✓' : 'Draft'}`);

    console.log('\n🎉 Landing page seeding completed successfully!');
    console.log('🌐 You can now view the landing page at: http://localhost:3333/');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding landing page:', error);
    throw error;
  }
}

// Run the seeding function
seedLandingPage()
  .then(() => {
    console.log('✅ Seeding script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding script failed:', error);
    process.exit(1);
  });
