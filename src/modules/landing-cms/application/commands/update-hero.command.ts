import { ICommand } from '@nestjs/cqrs';

export class UpdateHeroCommand implements ICommand {
  constructor(
    public readonly heading: string,
    public readonly subheading: string,
    public readonly backgroundImageUrl: string,
    public readonly ctaButtonText: string,
    public readonly ctaButtonLink: string,
  ) {}
}
