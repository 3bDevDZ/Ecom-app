import { ProductShowcase } from '../../../src/modules/landing-cms/domain/value-objects/product-showcase';

describe('ProductShowcase Value Object', () => {
  describe('create', () => {
    it('should create a valid ProductShowcase', () => {
      const categories = [
        { id: '1', name: 'Electronics', imageUrl: 'https://example.com/electronics.jpg', displayOrder: 1 },
        { id: '2', name: 'Tools', imageUrl: 'https://example.com/tools.jpg', displayOrder: 2 },
      ];

      const showcase = ProductShowcase.create(categories);

      expect(showcase.isSuccess).toBe(true);
      expect(showcase.value.categories).toHaveLength(2);
    });

    it('should fail when category name is empty', () => {
      const categories = [
        { id: '1', name: '', imageUrl: 'https://example.com/electronics.jpg', displayOrder: 1 },
      ];

      const showcase = ProductShowcase.create(categories);

      expect(showcase.isFailure).toBe(true);
    });

    it('should fail when imageUrl is invalid', () => {
      const categories = [
        { id: '1', name: 'Electronics', imageUrl: 'invalid-url', displayOrder: 1 },
      ];

      const showcase = ProductShowcase.create(categories);

      expect(showcase.isFailure).toBe(true);
    });
  });
});
