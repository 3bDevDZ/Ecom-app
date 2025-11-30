export class LandingContentDto {
  id: string;
  heroSection: {
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
  showroomInfo: {
    address: string;
    businessHours: string;
    mapImageUrl: string;
  };
  contactSection: {
    heading: string;
    description: string;
  };
  footerContent: {
    companyDescription: string;
    navigationLinks: Array<{
      label: string;
      url: string;
    }>;
    copyrightText: string;
  };
  isPublished: boolean;
  updatedAt: Date;
}
