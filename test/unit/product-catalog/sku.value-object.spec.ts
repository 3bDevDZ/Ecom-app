import { SKU } from '../../../src/modules/product-catalog/domain/value-objects/sku';

describe('SKU Value Object', () => {
  describe('create', () => {
    it('should create a valid SKU', () => {
      const sku = new SKU('PROD-001');
      expect(sku.value).toBe('PROD-001');
    });

    it('should create SKU with alphanumeric and hyphens', () => {
      const sku = new SKU('ABC-123-XYZ');
      expect(sku.value).toBe('ABC-123-XYZ');
    });

    it('should throw error for empty SKU', () => {
      expect(() => new SKU('')).toThrow('SKU cannot be empty');
    });

    it('should throw error for SKU shorter than 3 characters', () => {
      expect(() => new SKU('AB')).toThrow('SKU must be between 3 and 50 characters');
    });

    it('should throw error for SKU longer than 50 characters', () => {
      const longSku = 'A'.repeat(51);
      expect(() => new SKU(longSku)).toThrow('SKU must be between 3 and 50 characters');
    });

    it('should throw error for SKU with invalid characters', () => {
      expect(() => new SKU('PROD@001')).toThrow('SKU can only contain alphanumeric characters and hyphens');
    });

    it('should throw error for SKU with spaces', () => {
      expect(() => new SKU('PROD 001')).toThrow('SKU can only contain alphanumeric characters and hyphens');
    });
  });

  describe('equals', () => {
    it('should return true for identical SKUs', () => {
      const sku1 = new SKU('PROD-001');
      const sku2 = new SKU('PROD-001');
      expect(sku1.equals(sku2)).toBe(true);
    });

    it('should return false for different SKUs', () => {
      const sku1 = new SKU('PROD-001');
      const sku2 = new SKU('PROD-002');
      expect(sku1.equals(sku2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const sku1 = new SKU('PROD-001');
      const sku2 = new SKU('prod-001');
      expect(sku1.equals(sku2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const sku = new SKU('PROD-001');
      expect(sku.toString()).toBe('PROD-001');
    });
  });
});
