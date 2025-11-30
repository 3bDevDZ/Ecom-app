import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Result } from '../../../../shared/domain/result';

interface HeroSectionProps {
  heading: string;
  subheading: string;
  backgroundImageUrl: string;
  ctaButtonText: string;
  ctaButtonLink: string;
}

export class HeroSection extends ValueObject<HeroSectionProps> {
  get heading(): string {
    return this.props.heading;
  }

  get subheading(): string {
    return this.props.subheading;
  }

  get backgroundImageUrl(): string {
    return this.props.backgroundImageUrl;
  }

  get ctaButtonText(): string {
    return this.props.ctaButtonText;
  }

  get ctaButtonLink(): string {
    return this.props.ctaButtonLink;
  }

  private constructor(props: HeroSectionProps) {
    super(props);
  }

  public static create(props: HeroSectionProps): Result<HeroSection> {
    const errors: string[] = [];

    // Validate heading
    if (!props.heading || props.heading.trim().length === 0) {
      errors.push('Hero section heading cannot be empty');
    }
    if (props.heading && props.heading.length > 200) {
      errors.push('Hero section heading cannot exceed 200 characters');
    }

    // Validate subheading
    if (!props.subheading || props.subheading.trim().length === 0) {
      errors.push('Hero section subheading cannot be empty');
    }
    if (props.subheading && props.subheading.length > 300) {
      errors.push('Hero section subheading cannot exceed 300 characters');
    }

    // Validate background image URL
    if (!props.backgroundImageUrl || !this.isValidUrl(props.backgroundImageUrl)) {
      errors.push('Background image must be a valid URL');
    }

    // Validate CTA button text
    if (!props.ctaButtonText || props.ctaButtonText.trim().length === 0) {
      errors.push('CTA button text cannot be empty');
    }
    if (props.ctaButtonText && props.ctaButtonText.length > 50) {
      errors.push('CTA button text cannot exceed 50 characters');
    }

    // Validate CTA button link
    if (!props.ctaButtonLink || props.ctaButtonLink.trim().length === 0) {
      errors.push('CTA button link cannot be empty');
    }

    if (errors.length > 0) {
      return Result.fail<HeroSection>(errors);
    }

    return Result.ok<HeroSection>(new HeroSection(props));
  }

  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
