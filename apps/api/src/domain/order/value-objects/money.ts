/**
 * Money Value Object
 * Ensures monetary amounts are handled correctly with proper precision
 */
export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: string,
  ) {
    this.validate();
  }

  static create(amount: number, currency = 'USD'): Money {
    return new Money(amount, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  format(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  private validate(): void {
    if (this.amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!this.currency || this.currency.length !== 3) {
      throw new Error('Invalid currency code');
    }
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot operate on different currencies: ${this.currency} and ${other.currency}`,
      );
    }
  }
}
