import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetLandingContentQuery } from '../queries/get-landing-content.query';
import { LANDING_CONTENT_REPOSITORY, ILandingContentRepository } from '../../domain/repositories/ilanding-content-repository';
import { LandingContentDto } from '../dtos/landing-content.dto';

@QueryHandler(GetLandingContentQuery)
export class GetLandingContentHandler implements IQueryHandler<GetLandingContentQuery> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) {}

  async execute(query: GetLandingContentQuery): Promise<LandingContentDto | null> {
    const content = await this.repository.findCurrent();

    if (!content) {
      return null;
    }

    // If not including unpublished and content is not published, return null
    if (!query.includeUnpublished && !content.isPublished) {
      return null;
    }

    // Map aggregate to DTO
    return {
      id: content.id,
      heroSection: {
        heading: content.heroSection.heading,
        subheading: content.heroSection.subheading,
        backgroundImageUrl: content.heroSection.backgroundImageUrl,
        ctaButtonText: content.heroSection.ctaButtonText,
        ctaButtonLink: content.heroSection.ctaButtonLink,
      },
      trustLogos: content.trustLogos.logos.map((logo) => ({
        id: logo.id,
        name: logo.name,
        imageUrl: logo.imageUrl,
        displayOrder: logo.displayOrder,
      })),
      productShowcase: content.productShowcase.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
      })),
      showroomInfo: {
        address: content.showroomInfo.address,
        businessHours: content.showroomInfo.businessHours,
        mapImageUrl: content.showroomInfo.mapImageUrl,
      },
      contactSection: {
        heading: content.contactSection.heading,
        description: content.contactSection.description,
      },
      footerContent: {
        companyDescription: content.footerContent.companyDescription,
        navigationLinks: content.footerContent.navigationLinks.map((link) => ({
          label: link.label,
          url: link.url,
        })),
        copyrightText: content.footerContent.copyrightText,
      },
      isPublished: content.isPublished,
      updatedAt: content.updatedAt,
    };
  }
}
