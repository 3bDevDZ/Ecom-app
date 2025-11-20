import { Category } from '../../../src/modules/product-catalog/domain/aggregates/category';

describe('Category Aggregate', () => {
  describe('create', () => {
    it('should create a root category', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'Electronic devices and accessories',
      );

      expect(category.id).toBe('cat-id');
      expect(category.name).toBe('Electronics');
      expect(category.slug).toBe('electronics');
      expect(category.description).toBe('Electronic devices and accessories');
      expect(category.parentId).toBeNull();
      expect(category.isActive).toBe(true);
      expect(category.displayOrder).toBe(0);
    });

    it('should create a sub-category', () => {
      const category = Category.create(
        'cat-id',
        'Laptops',
        'laptops',
        'Laptop computers',
        'parent-id',
      );

      expect(category.parentId).toBe('parent-id');
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Category.create('cat-id', '', 'slug', 'description'),
      ).toThrow('Category name cannot be empty');
    });

    it('should throw error for empty slug', () => {
      expect(() =>
        Category.create('cat-id', 'Name', '', 'description'),
      ).toThrow('Category slug cannot be empty');
    });

    it('should throw error for invalid slug format', () => {
      expect(() =>
        Category.create('cat-id', 'Name', 'Invalid Slug!', 'description'),
      ).toThrow('Category slug must be URL-friendly');
    });

    it('should allow valid slug with hyphens', () => {
      const category = Category.create(
        'cat-id',
        'Computer Parts',
        'computer-parts',
        'description',
      );

      expect(category.slug).toBe('computer-parts');
    });
  });

  describe('updateDetails', () => {
    it('should update category name and description', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'Old description',
      );

      category.updateDetails('Consumer Electronics', 'New description');

      expect(category.name).toBe('Consumer Electronics');
      expect(category.description).toBe('New description');
      expect(category.slug).toBe('electronics'); // Slug should not change
    });

    it('should throw error for empty name', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'description',
      );

      expect(() => category.updateDetails('', 'description')).toThrow(
        'Category name cannot be empty',
      );
    });
  });

  describe('setDisplayOrder', () => {
    it('should set display order', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'description',
      );

      category.setDisplayOrder(5);
      expect(category.displayOrder).toBe(5);
    });

    it('should throw error for negative display order', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'description',
      );

      expect(() => category.setDisplayOrder(-1)).toThrow(
        'Display order cannot be negative',
      );
    });
  });

  describe('activate/deactivate', () => {
    it('should deactivate category', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'description',
      );

      category.deactivate();
      expect(category.isActive).toBe(false);
    });

    it('should activate category', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'description',
      );

      category.deactivate();
      category.activate();
      expect(category.isActive).toBe(true);
    });
  });

  describe('isRootCategory', () => {
    it('should return true for root category', () => {
      const category = Category.create(
        'cat-id',
        'Electronics',
        'electronics',
        'description',
      );

      expect(category.isRootCategory()).toBe(true);
    });

    it('should return false for sub-category', () => {
      const category = Category.create(
        'cat-id',
        'Laptops',
        'laptops',
        'description',
        'parent-id',
      );

      expect(category.isRootCategory()).toBe(false);
    });
  });
});
