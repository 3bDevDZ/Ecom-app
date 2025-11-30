import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Result } from '../../../../shared/domain/result';

export interface NavigationLink {
  label: string;
  url: string;
}

interface FooterContentProps {
  companyDescription: string;
  navigationLinks: NavigationLink[];
  copyrightText: string;
}

export class FooterContent extends ValueObject<FooterContentProps> {
  get companyDescription(): string {
    return this.props.companyDescription;
  }

  get navigationLinks(): NavigationLink[] {
    return this.props.navigationLinks;
  }

  get copyrightText(): string {
    return this.props.copyrightText;
  }

  private constructor(props: FooterContentProps) {
    super(props);
  }

  public static create(props: FooterContentProps): Result<FooterContent> {
    const errors: string[] = [];

    if (!props.companyDescription || props.companyDescription.trim().length === 0) {
      errors.push('Footer company description cannot be empty');
    }

    if (!props.copyrightText || props.copyrightText.trim().length === 0) {
      errors.push('Footer copyright text cannot be empty');
    }

    if (errors.length > 0) {
      return Result.fail<FooterContent>(errors);
    }

    return Result.ok<FooterContent>(new FooterContent(props));
  }
}
