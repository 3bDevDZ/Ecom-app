import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Result } from '../../../../shared/domain/result';

interface ShowroomInfoProps {
  address: string;
  businessHours: string;
  mapImageUrl: string;
}

export class ShowroomInfo extends ValueObject<ShowroomInfoProps> {
  get address(): string {
    return this.props.address;
  }

  get businessHours(): string {
    return this.props.businessHours;
  }

  get mapImageUrl(): string {
    return this.props.mapImageUrl;
  }

  private constructor(props: ShowroomInfoProps) {
    super(props);
  }

  public static create(props: ShowroomInfoProps): Result<ShowroomInfo> {
    const errors: string[] = [];

    if (!props.address || props.address.trim().length === 0) {
      errors.push('Showroom address cannot be empty');
    }

    if (!props.businessHours || props.businessHours.trim().length === 0) {
      errors.push('Showroom business hours cannot be empty');
    }

    if (!props.mapImageUrl || !this.isValidUrl(props.mapImageUrl)) {
      errors.push('Showroom map image must be a valid URL');
    }

    if (errors.length > 0) {
      return Result.fail<ShowroomInfo>(errors);
    }

    return Result.ok<ShowroomInfo>(new ShowroomInfo(props));
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
