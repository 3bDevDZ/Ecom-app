import { Money } from '../../../src/modules/product-catalog/domain/value-objects/money';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create valid money with default USD currency', () => {
      const money = new Money(19.99);
      expect(money.amount).toBe(19.99);
      expect(money.currency).toBe('USD');
    });

    it('should create money with specified currency', () => {
      const money = new Money(19.99, 'EUR');
      expect(money.amount).toBe(19.99);
      expect(money.currency).toBe('EUR');
    });

    it('should round to 2 decimal places', () => {
      const money = new Money(19.999);
      expect(money.amount).toBe(20.00);
    });

    it('should throw error for negative amount', () => {
      expect(() => new Money(-10)).toThrow('Money amount cannot be negative');
    });

    it('should throw error for invalid currency code', () => {
      expect(() => new Money(10, 'INVALID')).toThrow('Invalid currency code');
    });

    it('should allow zero amount', () => {
      const money = new Money(0);
      expect(money.amount).toBe(0);
    });
  });

  describe('arithmetic operations', () => {
    it('should add two money amounts with same currency', () => {
      const money1 = new Money(10.50);
      const money2 = new Money(5.25);
      const result = money1.add(money2);
      expect(result.amount).toBe(15.75);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when adding different currencies', () => {
      const money1 = new Money(10, 'USD');
      const money2 = new Money(10, 'EUR');
      expect(() => money1.add(money2)).toThrow('Cannot perform operation on different currencies');
    });

    it('should subtract two money amounts with same currency', () => {
      const money1 = new Money(10.50);
      const money2 = new Money(5.25);
      const result = money1.subtract(money2);
      expect(result.amount).toBe(5.25);
    });

    it('should throw error when subtracting different currencies', () => {
      const money1 = new Money(10, 'USD');
      const money2 = new Money(5, 'EUR');
      expect(() => money1.subtract(money2)).toThrow('Cannot perform operation on different currencies');
    });

    it('should throw error when subtraction results in negative', () => {
      const money1 = new Money(5);
      const money2 = new Money(10);
      expect(() => money1.subtract(money2)).toThrow('Subtraction would result in negative amount');
    });

    it('should multiply by a factor', () => {
      const money = new Money(10);
      const result = money.multiply(3);
      expect(result.amount).toBe(30);
    });

    it('should throw error when multiplying by negative factor', () => {
      const money = new Money(10);
      expect(() => money.multiply(-2)).toThrow('Cannot multiply by negative factor');
    });

    it('should multiply by decimal factor', () => {
      const money = new Money(10);
      const result = money.multiply(1.5);
      expect(result.amount).toBe(15);
    });
  });

  describe('comparison', () => {
    it('should return true for equal amounts and currency', () => {
      const money1 = new Money(10, 'USD');
      const money2 = new Money(10, 'USD');
      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const money1 = new Money(10);
      const money2 = new Money(20);
      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const money1 = new Money(10, 'USD');
      const money2 = new Money(10, 'EUR');
      expect(money1.equals(money2)).toBe(false);
    });

    it('should check if greater than', () => {
      const money1 = new Money(20);
      const money2 = new Money(10);
      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should check if less than', () => {
      const money1 = new Money(10);
      const money2 = new Money(20);
      expect(money1.isLessThan(money2)).toBe(true);
      expect(money2.isLessThan(money1)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format as string', () => {
      const money = new Money(19.99);
      expect(money.toString()).toBe('$19.99');
    });

    it('should format EUR correctly', () => {
      const money = new Money(19.99, 'EUR');
      expect(money.toString()).toBe('€19.99');
    });

    it('should format with no decimals for whole numbers', () => {
      const money = new Money(20);
      expect(money.toStringSimple()).toBe('$20');
    });
  });
});
