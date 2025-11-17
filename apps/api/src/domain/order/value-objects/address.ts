/**
 * Address Value Object
 * Represents a physical address with validation
 */
export interface AddressProps {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class Address {
  private constructor(private readonly props: AddressProps) {
    this.validate();
  }

  static create(props: AddressProps): Address {
    return new Address(props);
  }

  getStreet(): string {
    return this.props.street;
  }

  getCity(): string {
    return this.props.city;
  }

  getState(): string {
    return this.props.state;
  }

  getPostalCode(): string {
    return this.props.postalCode;
  }

  getCountry(): string {
    return this.props.country;
  }

  getFullAddress(): string {
    return `${this.props.street}, ${this.props.city}, ${this.props.state} ${this.props.postalCode}, ${this.props.country}`;
  }

  toJSON(): AddressProps {
    return { ...this.props };
  }

  private validate(): void {
    if (!this.props.street?.trim()) {
      throw new Error('Street is required');
    }
    if (!this.props.city?.trim()) {
      throw new Error('City is required');
    }
    if (!this.props.state?.trim()) {
      throw new Error('State is required');
    }
    if (!this.props.postalCode?.trim()) {
      throw new Error('Postal code is required');
    }
    if (!this.props.country?.trim()) {
      throw new Error('Country is required');
    }
  }
}
