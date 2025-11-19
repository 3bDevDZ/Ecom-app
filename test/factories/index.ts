/**
 * Test Data Factories
 *
 * Provides factory functions for creating test data.
 * Follows the Factory pattern to generate valid domain objects.
 *
 * Usage:
 * - Use these factories in your tests to create test data
 * - Each factory provides sensible defaults but allows customization
 * - Factories create domain objects, not persistence entities
 *
 * @example
 * import { ProductFactory } from './product.factory';
 *
 * const product = ProductFactory.create({
 *   name: 'Custom Product Name',
 *   price: 99.99,
 * });
 */

export * from './base.factory';
// Additional factories will be exported as they're created:
// export * from './product.factory';
// export * from './category.factory';
// export * from './order.factory';
// export * from './cart.factory';
