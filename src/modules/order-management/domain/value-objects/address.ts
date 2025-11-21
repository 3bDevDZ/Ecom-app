/**
 * Address Value Object
 *
 * Represents a shipping or billing address with validation
 */
export interface AddressProps {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
}

export class Address {
  private constructor(
    private readonly _street: string,
    private readonly _city: string,
    private readonly _state: string,
    private readonly _postalCode: string,
    private readonly _country: string,
    private readonly _contactName: string,
    private readonly _contactPhone: string,
  ) {}

  static create(props: AddressProps): Address {
    // Validate all required fields
    if (!props.street || props.street.trim() === '') {
      throw new Error('Street is required');
    }

    if (!props.city || props.city.trim() === '') {
      throw new Error('City is required');
    }

    if (!props.state || props.state.trim() === '') {
      throw new Error('State is required');
    }

    if (props.state.length !== 2) {
      throw new Error('State must be 2-letter code');
    }

    if (!props.postalCode || props.postalCode.trim() === '') {
      throw new Error('Postal code is required');
    }

    if (!props.country || props.country.trim() === '') {
      throw new Error('Country is required');
    }

    if (props.country.length !== 2) {
      throw new Error('Country must be 2-letter ISO code');
    }

    if (!props.contactName || props.contactName.trim() === '') {
      throw new Error('Contact name is required');
    }

    if (!props.contactPhone || props.contactPhone.trim() === '') {
      throw new Error('Contact phone is required');
    }

    return new Address(
      props.street,
      props.city,
      props.state.toUpperCase(),
      props.postalCode,
      props.country.toUpperCase(),
      props.contactName,
      props.contactPhone,
    );
  }

  get street(): string {
    return this._street;
  }

  get city(): string {
    return this._city;
  }

  get state(): string {
    return this._state;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  get country(): string {
    return this._country;
  }

  get contactName(): string {
    return this._contactName;
  }

  get contactPhone(): string {
    return this._contactPhone;
  }

  equals(other: Address): boolean {
    if (!other) {
      return false;
    }

    return (
      this._street === other._street &&
      this._city === other._city &&
      this._state === other._state &&
      this._postalCode === other._postalCode &&
      this._country === other._country &&
      this._contactName === other._contactName &&
      this._contactPhone === other._contactPhone
    );
  }

  toString(): string {
    return `${this._street}, ${this._city}, ${this._state} ${this._postalCode}, ${this._country}`;
  }

  toJSON(): AddressProps {
    return {
      street: this._street,
      city: this._city,
      state: this._state,
      postalCode: this._postalCode,
      country: this._country,
      contactName: this._contactName,
      contactPhone: this._contactPhone,
    };
  }
}

