import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Result } from '../../../../shared/domain/result';

interface ContactSectionProps {
  heading: string;
  description: string;
}

export class ContactSection extends ValueObject<ContactSectionProps> {
  get heading(): string {
    return this.props.heading;
  }

  get description(): string {
    return this.props.description;
  }

  private constructor(props: ContactSectionProps) {
    super(props);
  }

  public static create(props: ContactSectionProps): Result<ContactSection> {
    const errors: string[] = [];

    if (!props.heading || props.heading.trim().length === 0) {
      errors.push('Contact section heading cannot be empty');
    }

    if (!props.description || props.description.trim().length === 0) {
      errors.push('Contact section description cannot be empty');
    }

    if (errors.length > 0) {
      return Result.fail<ContactSection>(errors);
    }

    return Result.ok<ContactSection>(new ContactSection(props));
  }
}
