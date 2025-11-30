import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Result } from '../../../../shared/domain/result';

export interface TrustLogo {
  id: string;
  name: string;
  imageUrl: string;
  displayOrder: number;
}

interface TrustLogosProps {
  logos: TrustLogo[];
}

export class TrustLogos extends ValueObject<TrustLogosProps> {
  private static readonly MAX_LOGOS = 20;

  get logos(): TrustLogo[] {
    return this.props.logos;
  }

  private constructor(props: TrustLogosProps) {
    super(props);
  }

  public static create(logos: TrustLogo[]): Result<TrustLogos> {
    const errors: string[] = [];

    // Validate max logos
    if (logos.length > this.MAX_LOGOS) {
      errors.push(`Cannot exceed maximum of ${this.MAX_LOGOS} trust logos`);
    }

    // Validate each logo
    for (const logo of logos) {
      if (!logo.name || logo.name.trim().length === 0) {
        errors.push(`Trust logo name cannot be empty`);
      }
      if (!logo.imageUrl || !this.isValidUrl(logo.imageUrl)) {
        errors.push(`Trust logo image must be a valid URL`);
      }
      if (logo.displayOrder < 0) {
        errors.push(`Trust logo displayOrder must be non-negative`);
      }
    }

    if (errors.length > 0) {
      return Result.fail<TrustLogos>(errors);
    }

    return Result.ok<TrustLogos>(new TrustLogos({ logos }));
  }

  public addLogo(logo: TrustLogo): Result<TrustLogos> {
    if (this.logos.length >= TrustLogos.MAX_LOGOS) {
      return Result.fail<TrustLogos>(`Cannot exceed maximum of ${TrustLogos.MAX_LOGOS} trust logos`);
    }

    const newLogos = [...this.logos, logo];
    return TrustLogos.create(newLogos);
  }

  public removeLogo(logoId: string): Result<TrustLogos> {
    const logoExists = this.logos.some((logo) => logo.id === logoId);
    if (!logoExists) {
      return Result.fail<TrustLogos>(`Trust logo with id ${logoId} not found`);
    }

    const newLogos = this.logos.filter((logo) => logo.id !== logoId);
    return TrustLogos.create(newLogos);
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
