/**
 * CartStatus Value Object
 *
 * Represents shopping cart status with valid state transitions
 */
export class CartStatus {
  // Static instances for each status
  static readonly ACTIVE = new CartStatus('active');
  static readonly ABANDONED = new CartStatus('abandoned');
  static readonly CONVERTED = new CartStatus('converted');

  private constructor(private readonly _value: string) {}

  /**
   * Create CartStatus from string value
   */
  static fromString(value: string): CartStatus {
    const statusMap: Record<string, CartStatus> = {
      active: CartStatus.ACTIVE,
      abandoned: CartStatus.ABANDONED,
      converted: CartStatus.CONVERTED,
    };

    const status = statusMap[value.toLowerCase()];
    if (!status) {
      throw new Error(`Invalid cart status: ${value}`);
    }

    return status;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Check if transition to another status is valid
   */
  canTransitionTo(newStatus: CartStatus): boolean {
    const transitions: Record<string, string[]> = {
      active: ['abandoned', 'converted'],
      abandoned: [],
      converted: [],
    };

    const allowedTransitions = transitions[this._value] || [];
    return allowedTransitions.includes(newStatus._value);
  }

  /**
   * Check if this is a terminal status (no further transitions possible)
   */
  isTerminal(): boolean {
    return this._value === 'abandoned' || this._value === 'converted';
  }

  isActive(): boolean {
    return this._value === 'active';
  }

  isAbandoned(): boolean {
    return this._value === 'abandoned';
  }

  isConverted(): boolean {
    return this._value === 'converted';
  }

  equals(other: CartStatus): boolean {
    if (!other) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}

