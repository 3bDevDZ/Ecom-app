import { ValueObject } from '../../../../shared/domain/value-object.base';

interface SKUProps {
  value: string;
}

/**
 * SKU (Stock Keeping Unit) Value Object
 *
 * Represents a unique identifier for products and variants.
 * Format: Alphanumeric with hyphens, 3-50 characters
 *
 * @example
 * const sku = new SKU('PROD-001-L-BLUE');
 */
export class SKU extends ValueObject<SKUProps> {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 50;
  private static readonly VALID_PATTERN = /^[A-Za-z0-9-]+$/;

  constructor(value: string) {
    super({ value: SKU.validate(value) });
  }

  get value(): string {
    return this.props.value;
  }

  private static validate(value: string): string {
    if (!value || value.trim().length === 0) {
      throw new Error('SKU cannot be empty');
    }

    const trimmed = value.trim();

    if (trimmed.length < this.MIN_LENGTH || trimmed.length > this.MAX_LENGTH) {
      throw new Error(`SKU must be between ${this.MIN_LENGTH} and ${this.MAX_LENGTH} characters`);
    }

    if (!this.VALID_PATTERN.test(trimmed)) {
      throw new Error('SKU can only contain alphanumeric characters and hyphens');
    }

    return trimmed;
  }

  public toString(): string {
    return this.value;
  }
}
