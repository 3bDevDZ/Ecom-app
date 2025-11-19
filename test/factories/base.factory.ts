import { v4 as uuid } from 'uuid';

/**
 * Base Factory Interface
 *
 * Defines the contract for all test data factories.
 */
export interface IFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
}

/**
 * Base Factory Class
 *
 * Provides common functionality for all factories.
 *
 * @example
 * export class ProductFactory extends BaseFactory<Product> {
 *   protected createDefault(): Product {
 *     return new Product(
 *       this.generateId(),
 *       new SKU('PROD-001'),
 *       'Default Product',
 *       new Money(19.99, 'USD')
 *     );
 *   }
 * }
 */
export abstract class BaseFactory<T> implements IFactory<T> {
  /**
   * Create a single instance with optional overrides
   */
  create(overrides?: Partial<T>): T {
    const defaultInstance = this.createDefault();
    return { ...defaultInstance, ...overrides };
  }

  /**
   * Create multiple instances
   */
  createMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Generate a unique ID (UUID v4)
   */
  protected generateId(): string {
    return uuid();
  }

  /**
   * Generate a timestamp
   */
  protected generateTimestamp(): Date {
    return new Date();
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  protected randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random number between min and max
   */
  protected randomNumber(min: number, max: number, decimals: number = 2): number {
    const random = Math.random() * (max - min) + min;
    return parseFloat(random.toFixed(decimals));
  }

  /**
   * Pick a random element from an array
   */
  protected randomElement<E>(array: E[]): E {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate a random string of given length
   */
  protected randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  /**
   * Subclasses must implement this to provide default instance
   */
  protected abstract createDefault(): T;
}
