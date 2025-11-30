import { Injectable } from '@nestjs/common';
import { LandingContentDto } from '../../application/dtos/landing-content.dto';

export interface LandingPageViewModel {
  pageTitle: string;
  isPreview: boolean;
  hero: {
    heading: string;
    subheading: string;
    backgroundImageUrl: string;
    ctaButtonText: string;
    ctaButtonLink: string;
  };
  trustLogos: Array<{
    id: string;
    name: string;
    imageUrl: string;
    displayOrder: number;
  }>;
  productShowcase: Array<{
    id: string;
    name: string;
    imageUrl: string;
    displayOrder: number;
  }>;
  showroom: {
    address: string;
    businessHours: string;
    mapImageUrl: string;
  };
  contact: {
    heading: string;
    description: string;
  };
  footer: {
    companyDescription: string;
    navigationLinks: Array<{
      label: string;
      url: string;
    }>;
    copyrightText: string;
  };
}

@Injectable()
export class LandingPresenter {
  toLandingPageView(content: LandingContentDto, isPreview: boolean): LandingPageViewModel {
    return {
      pageTitle: isPreview ? 'Landing Page Preview' : 'Welcome to Our B2B Platform',
      isPreview,
      hero: {
        heading: content.heroSection.heading,
        subheading: content.heroSection.subheading,
        backgroundImageUrl: content.heroSection.backgroundImageUrl,
        ctaButtonText: content.heroSection.ctaButtonText,
        ctaButtonLink: content.heroSection.ctaButtonLink,
      },
      trustLogos: content.trustLogos.sort((a, b) => a.displayOrder - b.displayOrder),
      productShowcase: content.productShowcase.sort((a, b) => a.displayOrder - b.displayOrder),
      showroom: {
        address: content.showroomInfo.address,
        businessHours: content.showroomInfo.businessHours,
        mapImageUrl: content.showroomInfo.mapImageUrl,
      },
      contact: {
        heading: content.contactSection.heading,
        description: content.contactSection.description,
      },
      footer: {
        companyDescription: content.footerContent.companyDescription,
        navigationLinks: content.footerContent.navigationLinks,
        copyrightText: content.footerContent.copyrightText,
      },
    };
  }

  getDefaultLandingPage(): LandingPageViewModel {
    return {
      pageTitle: 'Welcome to Our B2B Platform',
      isPreview: false,
      hero: {
        heading: 'Welcome to Our B2B Platform',
        subheading: 'Your trusted partner for industrial supplies',
        backgroundImageUrl: '/images/default-hero-bg.jpg',
        ctaButtonText: 'Get Started',
        ctaButtonLink: '/products',
      },
      trustLogos: [],
      productShowcase: [],
      showroom: {
        address: 'Visit us at our showroom',
        businessHours: 'Mon-Fri: 9AM-5PM',
        mapImageUrl: '/images/default-map.jpg',
      },
      contact: {
        heading: 'Get in Touch',
        description: 'Contact us for inquiries about our products and services',
      },
      footer: {
        companyDescription: 'Leading B2B supplier since 2020',
        navigationLinks: [
          { label: 'Products', url: '/products' },
          { label: 'About Us', url: '/about' },
          { label: 'Contact', url: '/contact' },
        ],
        copyrightText: '© 2024 B2B Platform. All rights reserved.',
      },
    };
  }
}
