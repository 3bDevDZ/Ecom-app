import { ICommand } from '@nestjs/cqrs';
import { TrustLogo } from '../../domain/value-objects/trust-logos';
import { ShowcaseCategory } from '../../domain/value-objects/product-showcase';
import { NavigationLink } from '../../domain/value-objects/footer-content';

export class UpdateHeroCommand implements ICommand {
  constructor(
    public readonly heading: string,
    public readonly subheading: string,
    public readonly backgroundImageUrl: string,
    public readonly ctaButtonText: string,
    public readonly ctaButtonLink: string,
  ) {}
}

export class UpdateTrustLogosCommand implements ICommand {
  constructor(public readonly logos: TrustLogo[]) {}
}

export class UpdateProductShowcaseCommand implements ICommand {
  constructor(public readonly categories: ShowcaseCategory[]) {}
}

export class UpdateShowroomInfoCommand implements ICommand {
  constructor(
    public readonly address: string,
    public readonly businessHours: string,
    public readonly mapImageUrl: string,
  ) {}
}

export class UpdateContactSectionCommand implements ICommand {
  constructor(
    public readonly heading: string,
    public readonly description: string,
  ) {}
}

export class UpdateFooterContentCommand implements ICommand {
  constructor(
    public readonly companyDescription: string,
    public readonly navigationLinks: NavigationLink[],
    public readonly copyrightText: string,
  ) {}
}

export class PublishContentCommand implements ICommand {
  constructor() {}
}
