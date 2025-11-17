/**
 * Customer Entity (simplified for order context)
 */
export interface CustomerProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {
    this.validate();
  }

  static create(props: CustomerProps): Customer {
    return new Customer(props);
  }

  getId(): string {
    return this.props.id;
  }

  getName(): string {
    return this.props.name;
  }

  getEmail(): string {
    return this.props.email;
  }

  getPhone(): string | undefined {
    return this.props.phone;
  }

  toJSON() {
    return { ...this.props };
  }

  private validate(): void {
    if (!this.props.id) {
      throw new Error('Customer ID is required');
    }
    if (!this.props.name?.trim()) {
      throw new Error('Customer name is required');
    }
    if (!this.props.email?.trim()) {
      throw new Error('Customer email is required');
    }
    // Basic email validation
    if (!this.props.email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }
}
