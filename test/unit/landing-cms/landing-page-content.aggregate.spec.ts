import { LandingPageContent } from '../../../src/modules/landing-cms/domain/aggregates/landing-page-content';
import { HeroSection } from '../../../src/modules/landing-cms/domain/value-objects/hero-section';
import { TrustLogos } from '../../../src/modules/landing-cms/domain/value-objects/trust-logos';
import { ProductShowcase } from '../../../src/modules/landing-cms/domain/value-objects/product-showcase';
import { ShowroomInfo } from '../../../src/modules/landing-cms/domain/value-objects/showroom-info';
import { ContactSection } from '../../../src/modules/landing-cms/domain/value-objects/contact-section';
import { FooterContent } from '../../../src/modules/landing-cms/domain/value-objects/footer-content';

describe('LandingPageContent Aggregate', () => {
  const createValidData = () => ({
    heroSection: HeroSection.create({
      heading: 'Welcome',
      subheading: 'Your trusted supplier',
      backgroundImageUrl: 'https://example.com/bg.jpg',
      ctaButtonText: 'Shop Now',
      ctaButtonLink: '/products',
    }).value,
    trustLogos: TrustLogos.create([]).value,
    productShowcase: ProductShowcase.create([]).value,
    showroomInfo: ShowroomInfo.create({
      address: '123 Main St',
      businessHours: 'Mon-Fri: 9AM-5PM',
      mapImageUrl: 'https://example.com/map.jpg',
    }).value,
    contactSection: ContactSection.create({
      heading: 'Contact Us',
      description: 'Get in touch',
    }).value,
    footerContent: FooterContent.create({
      companyDescription: 'Leading B2B supplier',
      navigationLinks: [],
      copyrightText: '© 2024',
    }).value,
  });

  describe('create', () => {
    it('should create a new LandingPageContent aggregate', () => {
      const data = createValidData();
      const content = LandingPageContent.create(data);

      expect(content.isSuccess).toBe(true);
      expect(content.value.isPublished).toBe(false);
    });
  });

  describe('updateHero', () => {
    it('should update hero section and mark as unpublished', () => {
      const data = createValidData();
      const content = LandingPageContent.create(data).value;

      content.publish();
      expect(content.isPublished).toBe(true);

      const newHero = HeroSection.create({
        heading: 'New Heading',
        subheading: 'New Subheading',
        backgroundImageUrl: 'https://example.com/new-bg.jpg',
        ctaButtonText: 'Learn More',
        ctaButtonLink: '/about',
      }).value;

      const result = content.updateHero(newHero);

      expect(result.isSuccess).toBe(true);
      expect(content.isPublished).toBe(false);
      expect(content.heroSection.heading).toBe('New Heading');
    });
  });

  describe('publish', () => {
    it('should mark content as published', () => {
      const data = createValidData();
      const content = LandingPageContent.create(data).value;

      content.publish();

      expect(content.isPublished).toBe(true);
      // Note: Domain events are raised internally but not publicly accessible for testing
      // The event handlers will be tested in integration tests
    });
  });

  describe('preview', () => {
    it('should return preview data without publishing', () => {
      const data = createValidData();
      const content = LandingPageContent.create(data).value;

      const preview = content.preview();

      expect(preview.heroSection).toBeDefined();
      expect(content.isPublished).toBe(false);
    });
  });
});
