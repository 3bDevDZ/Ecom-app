/**
 * OrderNumber Value Object
 *
 * Represents a unique order number with format: ORD-YYYY-MM-XXXXXX
 * Example: ORD-2025-11-123456
 */
export class OrderNumber {
  private constructor(private readonly _value: string) {
    this.validate();
  }

  /**
   * Generate a new order number
   * Format: ORD-YYYY-MM-XXXXXX (sequential 6-digit number)
   */
  static generate(): OrderNumber {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    // Generate sequential 6-digit number (in production, this should come from database sequence)
    const sequential = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

    const orderNumber = `ORD-${year}-${month}-${sequential}`;
    return new OrderNumber(orderNumber);
  }

  /**
   * Create OrderNumber from existing value
   */
  static create(value: string): OrderNumber {
    if (!value || value.trim() === '') {
      throw new Error('Order number cannot be empty');
    }
    return new OrderNumber(value);
  }

  private validate(): void {
    const pattern = /^ORD-\d{4}-(0[1-9]|1[0-2])-\d{6}$/;

    if (!pattern.test(this._value)) {
      throw new Error('Invalid order number format. Expected: ORD-YYYY-MM-XXXXXX');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: OrderNumber): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

