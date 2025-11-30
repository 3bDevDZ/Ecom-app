import { HeroSection } from '../../../src/modules/landing-cms/domain/value-objects/hero-section';

describe('HeroSection Value Object', () => {
  describe('create', () => {
    it('should create a valid HeroSection', () => {
      const heroData = {
        heading: 'Welcome to B2B Platform',
        subheading: 'Your trusted supplier for industrial products',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/products',
      };

      const hero = HeroSection.create(heroData);

      expect(hero.isSuccess).toBe(true);
      expect(hero.value.heading).toBe(heroData.heading);
      expect(hero.value.subheading).toBe(heroData.subheading);
      expect(hero.value.backgroundImageUrl).toBe(heroData.backgroundImageUrl);
      expect(hero.value.ctaButtonText).toBe(heroData.ctaButtonText);
      expect(hero.value.ctaButtonLink).toBe(heroData.ctaButtonLink);
    });

    it('should fail when heading is empty', () => {
      const heroData = {
        heading: '',
        subheading: 'Your trusted supplier',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/products',
      };

      const hero = HeroSection.create(heroData);

      expect(hero.isFailure).toBe(true);
      expect(hero.errorValue).toContain('heading');
    });

    it('should fail when heading is too long', () => {
      const heroData = {
        heading: 'a'.repeat(201),
        subheading: 'Your trusted supplier',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/products',
      };

      const hero = HeroSection.create(heroData);

      expect(hero.isFailure).toBe(true);
      expect(hero.errorValue).toContain('heading');
    });

    it('should fail when subheading is empty', () => {
      const heroData = {
        heading: 'Welcome',
        subheading: '',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/products',
      };

      const hero = HeroSection.create(heroData);

      expect(hero.isFailure).toBe(true);
      expect(hero.errorValue).toContain('subheading');
    });

    it('should fail when background image URL is invalid', () => {
      const heroData = {
        heading: 'Welcome',
        subheading: 'Your trusted supplier',
        backgroundImageUrl: 'not-a-url',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/products',
      };

      const hero = HeroSection.create(heroData);

      expect(hero.isFailure).toBe(true);
      expect(hero.errorValue).toContain('URL');
    });

    it('should fail when CTA button text is empty', () => {
      const heroData = {
        heading: 'Welcome',
        subheading: 'Your trusted supplier',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: '',
        ctaButtonLink: '/products',
      };

      const hero = HeroSection.create(heroData);

      expect(hero.isFailure).toBe(true);
      expect(hero.errorValue).toContain('CTA button text');
    });

    it('should fail when CTA button link is empty', () => {
      const heroData = {
        heading: 'Welcome',
        subheading: 'Your trusted supplier',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '',
      };

      const hero = HeroSection.create(heroData);

      expect(hero.isFailure).toBe(true);
      expect(hero.errorValue).toContain('CTA button link');
    });
  });

  describe('equals', () => {
    it('should return true for identical hero sections', () => {
      const heroData = {
        heading: 'Welcome',
        subheading: 'Your trusted supplier',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/products',
      };

      const hero1 = HeroSection.create(heroData).value;
      const hero2 = HeroSection.create(heroData).value;

      expect(hero1.equals(hero2)).toBe(true);
    });

    it('should return false for different hero sections', () => {
      const heroData1 = {
        heading: 'Welcome',
        subheading: 'Your trusted supplier',
        backgroundImageUrl: 'https://example.com/hero-bg.jpg',
        ctaButtonText: 'Shop Now',
        ctaButtonLink: '/products',
      };

      const heroData2 = {
        ...heroData1,
        heading: 'Different Heading',
      };

      const hero1 = HeroSection.create(heroData1).value;
      const hero2 = HeroSection.create(heroData2).value;

      expect(hero1.equals(hero2)).toBe(false);
    });
  });
});
