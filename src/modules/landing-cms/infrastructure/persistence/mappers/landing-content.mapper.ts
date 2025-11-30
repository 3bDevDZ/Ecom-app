import { LandingPageContent } from '../../../domain/aggregates/landing-page-content';
import { LandingPageContentEntity } from '../entities/landing-page-content.entity';
import { HeroSection } from '../../../domain/value-objects/hero-section';
import { TrustLogos } from '../../../domain/value-objects/trust-logos';
import { ProductShowcase } from '../../../domain/value-objects/product-showcase';
import { ShowroomInfo } from '../../../domain/value-objects/showroom-info';
import { ContactSection } from '../../../domain/value-objects/contact-section';
import { FooterContent } from '../../../domain/value-objects/footer-content';

export class LandingContentMapper {
  /**
   * Map domain aggregate to persistence entity
   */
  static toPersistence(domain: LandingPageContent): LandingPageContentEntity {
    const entity = new LandingPageContentEntity();

    entity.id = domain.id;
    entity.heroHeading = domain.heroSection.heading;
    entity.heroSubheading = domain.heroSection.subheading;
    entity.heroBackgroundImageUrl = domain.heroSection.backgroundImageUrl;
    entity.heroCtaButtonText = domain.heroSection.ctaButtonText;
    entity.heroCtaButtonLink = domain.heroSection.ctaButtonLink;

    entity.trustLogos = domain.trustLogos.logos;
    entity.productShowcase = domain.productShowcase.categories;

    entity.showroomAddress = domain.showroomInfo.address;
    entity.showroomBusinessHours = domain.showroomInfo.businessHours;
    entity.showroomMapImageUrl = domain.showroomInfo.mapImageUrl;

    entity.contactHeading = domain.contactSection.heading;
    entity.contactDescription = domain.contactSection.description;

    entity.footerCompanyDescription = domain.footerContent.companyDescription;
    entity.footerNavigationLinks = domain.footerContent.navigationLinks;
    entity.footerCopyrightText = domain.footerContent.copyrightText;

    entity.isPublished = domain.isPublished;

    return entity;
  }

  /**
   * Map persistence entity to domain aggregate
   */
  static toDomain(entity: LandingPageContentEntity): LandingPageContent {
    const heroSection = HeroSection.create({
      heading: entity.heroHeading,
      subheading: entity.heroSubheading,
      backgroundImageUrl: entity.heroBackgroundImageUrl,
      ctaButtonText: entity.heroCtaButtonText,
      ctaButtonLink: entity.heroCtaButtonLink,
    }).value;

    const trustLogos = TrustLogos.create(entity.trustLogos).value;
    const productShowcase = ProductShowcase.create(entity.productShowcase).value;

    const showroomInfo = ShowroomInfo.create({
      address: entity.showroomAddress,
      businessHours: entity.showroomBusinessHours,
      mapImageUrl: entity.showroomMapImageUrl,
    }).value;

    const contactSection = ContactSection.create({
      heading: entity.contactHeading,
      description: entity.contactDescription,
    }).value;

    const footerContent = FooterContent.create({
      companyDescription: entity.footerCompanyDescription,
      navigationLinks: entity.footerNavigationLinks,
      copyrightText: entity.footerCopyrightText,
    }).value;

    return LandingPageContent.create(
      {
        heroSection,
        trustLogos,
        productShowcase,
        showroomInfo,
        contactSection,
        footerContent,
        isPublished: entity.isPublished,
      },
      entity.id,
    ).value;
  }
}
