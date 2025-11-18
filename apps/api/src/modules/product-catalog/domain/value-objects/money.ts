import { ValueObject } from '../../../../shared/domain/value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

/**
 * Money Value Object
 *
 * Represents a monetary amount with currency.
 * Ensures type safety and proper arithmetic operations.
 *
 * @example
 * const price = new Money(19.99, 'USD');
 * const total = price.add(new Money(5.00, 'USD'));
 */
export class Money extends ValueObject<MoneyProps> {
  private static readonly VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  private static readonly DECIMAL_PLACES = 2;

  constructor(amount: number, currency: string = 'USD') {
    super({
      amount: Money.roundToDecimalPlaces(amount),
      currency: Money.validateCurrency(currency),
    });
    Money.validateAmount(this.props.amount);
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  private static validateAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  private static validateCurrency(currency: string): string {
    if (!this.VALID_CURRENCIES.includes(currency)) {
      throw new Error(`Invalid currency code. Supported: ${this.VALID_CURRENCIES.join(', ')}`);
    }
    return currency;
  }

  private static roundToDecimalPlaces(amount: number): number {
    return Math.round(amount * Math.pow(10, this.DECIMAL_PLACES)) / Math.pow(10, this.DECIMAL_PLACES);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error('Cannot perform operation on different currencies');
    }
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;

    if (result < 0) {
      throw new Error('Subtraction would result in negative amount');
    }

    return new Money(result, this.currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Cannot multiply by negative factor');
    }
    return new Money(this.amount * factor, this.currency);
  }

  public isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  public isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  public toString(): string {
    const symbol = this.getCurrencySymbol();
    return `${symbol}${this.amount.toFixed(Money.DECIMAL_PLACES)}`;
  }

  public toStringSimple(): string {
    const symbol = this.getCurrencySymbol();
    return this.amount % 1 === 0 ? `${symbol}${this.amount}` : this.toString();
  }

  private getCurrencySymbol(): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
    };
    return symbols[this.currency] || this.currency;
  }
}
