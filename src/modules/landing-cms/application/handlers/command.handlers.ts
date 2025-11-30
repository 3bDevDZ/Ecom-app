import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from '../../../../shared/domain/result';
import { ILandingContentRepository, LANDING_CONTENT_REPOSITORY } from '../../domain/repositories/ilanding-content-repository';
import { ContactSection } from '../../domain/value-objects/contact-section';
import { FooterContent } from '../../domain/value-objects/footer-content';
import { HeroSection } from '../../domain/value-objects/hero-section';
import { ProductShowcase } from '../../domain/value-objects/product-showcase';
import { ShowroomInfo } from '../../domain/value-objects/showroom-info';
import { TrustLogos } from '../../domain/value-objects/trust-logos';
import {
  PublishContentCommand,
  UpdateContactSectionCommand,
  UpdateFooterContentCommand,
  UpdateHeroCommand,
  UpdateProductShowcaseCommand,
  UpdateShowroomInfoCommand,
  UpdateTrustLogosCommand,
} from '../commands';

@CommandHandler(UpdateTrustLogosCommand)
export class UpdateTrustLogosHandler implements ICommandHandler<UpdateTrustLogosCommand> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) { }

  async execute(command: UpdateTrustLogosCommand): Promise<Result<void>> {
    const content = await this.repository.findCurrent();
    if (!content) {
      return Result.fail('Landing page content not found');
    }

    const logosResult = TrustLogos.create(command.logos);
    if (logosResult.isFailure) {
      return Result.fail(logosResult.errorValue);
    }

    const updateResult = content.updateTrustLogos(logosResult.value);
    if (updateResult.isFailure) {
      return updateResult;
    }

    await this.repository.save(content);
    return Result.ok();
  }
}

@CommandHandler(UpdateProductShowcaseCommand)
export class UpdateProductShowcaseHandler implements ICommandHandler<UpdateProductShowcaseCommand> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) { }

  async execute(command: UpdateProductShowcaseCommand): Promise<Result<void>> {
    const content = await this.repository.findCurrent();
    if (!content) {
      return Result.fail('Landing page content not found');
    }

    const showcaseResult = ProductShowcase.create(command.categories);
    if (showcaseResult.isFailure) {
      return Result.fail(showcaseResult.errorValue);
    }

    const updateResult = content.updateProductShowcase(showcaseResult.value);
    if (updateResult.isFailure) {
      return updateResult;
    }

    await this.repository.save(content);
    return Result.ok();
  }
}

@CommandHandler(UpdateShowroomInfoCommand)
export class UpdateShowroomInfoHandler implements ICommandHandler<UpdateShowroomInfoCommand> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) { }

  async execute(command: UpdateShowroomInfoCommand): Promise<Result<void>> {
    const content = await this.repository.findCurrent();
    if (!content) {
      return Result.fail('Landing page content not found');
    }

    const infoResult = ShowroomInfo.create({
      address: command.address,
      businessHours: command.businessHours,
      mapImageUrl: command.mapImageUrl,
    });
    if (infoResult.isFailure) {
      return Result.fail(infoResult.errorValue);
    }

    const updateResult = content.updateShowroomInfo(infoResult.value);
    if (updateResult.isFailure) {
      return updateResult;
    }

    await this.repository.save(content);
    return Result.ok();
  }
}

@CommandHandler(UpdateContactSectionCommand)
export class UpdateContactSectionHandler implements ICommandHandler<UpdateContactSectionCommand> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) { }

  async execute(command: UpdateContactSectionCommand): Promise<Result<void>> {
    const content = await this.repository.findCurrent();
    if (!content) {
      return Result.fail('Landing page content not found');
    }

    const sectionResult = ContactSection.create({
      heading: command.heading,
      description: command.description,
    });
    if (sectionResult.isFailure) {
      return Result.fail(sectionResult.errorValue);
    }

    const updateResult = content.updateContactSection(sectionResult.value);
    if (updateResult.isFailure) {
      return updateResult;
    }

    await this.repository.save(content);
    return Result.ok();
  }
}

@CommandHandler(UpdateFooterContentCommand)
export class UpdateFooterContentHandler implements ICommandHandler<UpdateFooterContentCommand> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) { }

  async execute(command: UpdateFooterContentCommand): Promise<Result<void>> {
    const content = await this.repository.findCurrent();
    if (!content) {
      return Result.fail('Landing page content not found');
    }

    const footerResult = FooterContent.create({
      companyDescription: command.companyDescription,
      navigationLinks: command.navigationLinks,
      copyrightText: command.copyrightText,
    });
    if (footerResult.isFailure) {
      return Result.fail(footerResult.errorValue);
    }

    const updateResult = content.updateFooterContent(footerResult.value);
    if (updateResult.isFailure) {
      return updateResult;
    }

    await this.repository.save(content);
    return Result.ok();
  }
}

@CommandHandler(PublishContentCommand)
export class PublishContentHandler implements ICommandHandler<PublishContentCommand> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) { }

  async execute(command: PublishContentCommand): Promise<Result<void>> {
    const content = await this.repository.findCurrent();
    if (!content) {
      return Result.fail('Landing page content not found');
    }

    content.publish();
    await this.repository.save(content);
    return Result.ok();
  }
}


@CommandHandler(UpdateHeroCommand)
export class UpdateHeroHandler implements ICommandHandler<UpdateHeroCommand> {
  constructor(
    @Inject(LANDING_CONTENT_REPOSITORY)
    private readonly repository: ILandingContentRepository,
  ) { }

  async execute(command: UpdateHeroCommand): Promise<Result<void>> {
    // Get current content or throw error
    const content = await this.repository.findCurrent();
    if (!content) {
      return Result.fail('Landing page content not found');
    }

    // Create new hero section value object
    const heroResult = HeroSection.create({
      heading: command.heading,
      subheading: command.subheading,
      backgroundImageUrl: command.backgroundImageUrl,
      ctaButtonText: command.ctaButtonText,
      ctaButtonLink: command.ctaButtonLink,
    });

    if (heroResult.isFailure) {
      return Result.fail(heroResult.errorValue);
    }

    // Update aggregate
    const updateResult = content.updateHero(heroResult.value);
    if (updateResult.isFailure) {
      return updateResult;
    }

    // Persist
    await this.repository.save(content);

    return Result.ok();
  }
}
