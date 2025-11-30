import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('landing_page_content')
export class LandingPageContentEntity {
  @PrimaryColumn('uuid')
  id: string;

  // Hero Section
  @Column({ type: 'varchar', length: 200, name: 'hero_heading' })
  heroHeading: string;

  @Column({ type: 'varchar', length: 300, name: 'hero_subheading' })
  heroSubheading: string;

  @Column({ type: 'varchar', length: 500, name: 'hero_background_image_url' })
  heroBackgroundImageUrl: string;

  @Column({ type: 'varchar', length: 50, name: 'hero_cta_button_text' })
  heroCtaButtonText: string;

  @Column({ type: 'varchar', length: 200, name: 'hero_cta_button_link' })
  heroCtaButtonLink: string;

  // Trust Logos (stored as JSON)
  @Column({ type: 'jsonb', name: 'trust_logos', default: '[]' })
  trustLogos: Array<{
    id: string;
    name: string;
    imageUrl: string;
    displayOrder: number;
  }>;

  // Product Showcase (stored as JSON)
  @Column({ type: 'jsonb', name: 'product_showcase', default: '[]' })
  productShowcase: Array<{
    id: string;
    name: string;
    imageUrl: string;
    displayOrder: number;
  }>;

  // Showroom Info
  @Column({ type: 'text', name: 'showroom_address' })
  showroomAddress: string;

  @Column({ type: 'varchar', length: 200, name: 'showroom_business_hours' })
  showroomBusinessHours: string;

  @Column({ type: 'varchar', length: 500, name: 'showroom_map_image_url' })
  showroomMapImageUrl: string;

  // Contact Section
  @Column({ type: 'varchar', length: 200, name: 'contact_heading' })
  contactHeading: string;

  @Column({ type: 'text', name: 'contact_description' })
  contactDescription: string;

  // Footer Content
  @Column({ type: 'text', name: 'footer_company_description' })
  footerCompanyDescription: string;

  @Column({ type: 'jsonb', name: 'footer_navigation_links', default: '[]' })
  footerNavigationLinks: Array<{
    label: string;
    url: string;
  }>;

  @Column({ type: 'varchar', length: 200, name: 'footer_copyright_text' })
  footerCopyrightText: string;

  // Publication status
  @Column({ type: 'boolean', name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
