import { InventoryInfo } from '../../../src/modules/product-catalog/domain/value-objects/inventory-info';

describe('InventoryInfo Value Object', () => {
  describe('create', () => {
    it('should create inventory with available quantity', () => {
      const inventory = new InventoryInfo(100);
      expect(inventory.availableQuantity).toBe(100);
      expect(inventory.reservedQuantity).toBe(0);
      expect(inventory.totalQuantity).toBe(100);
    });

    it('should create inventory with available and reserved quantities', () => {
      const inventory = new InventoryInfo(80, 20);
      expect(inventory.availableQuantity).toBe(80);
      expect(inventory.reservedQuantity).toBe(20);
      expect(inventory.totalQuantity).toBe(100);
    });

    it('should throw error for negative available quantity', () => {
      expect(() => new InventoryInfo(-10)).toThrow('Available quantity cannot be negative');
    });

    it('should throw error for negative reserved quantity', () => {
      expect(() => new InventoryInfo(10, -5)).toThrow('Reserved quantity cannot be negative');
    });

    it('should allow zero quantities', () => {
      const inventory = new InventoryInfo(0, 0);
      expect(inventory.totalQuantity).toBe(0);
    });
  });

  describe('reserve', () => {
    it('should reserve quantity from available stock', () => {
      const inventory = new InventoryInfo(100, 0);
      const result = inventory.reserve(30);

      expect(result.isSuccess).toBe(true);
      expect(result.value.availableQuantity).toBe(70);
      expect(result.value.reservedQuantity).toBe(30);
    });

    it('should fail to reserve when quantity exceeds available', () => {
      const inventory = new InventoryInfo(50, 0);
      const result = inventory.reserve(60);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Insufficient inventory');
    });

    it('should fail to reserve negative quantity', () => {
      const inventory = new InventoryInfo(100, 0);
      const result = inventory.reserve(-10);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Reservation quantity must be positive');
    });

    it('should fail to reserve zero quantity', () => {
      const inventory = new InventoryInfo(100, 0);
      const result = inventory.reserve(0);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Reservation quantity must be positive');
    });

    it('should handle multiple reservations', () => {
      const inventory = new InventoryInfo(100, 0);
      const result1 = inventory.reserve(30);
      const result2 = result1.value.reserve(20);

      expect(result2.isSuccess).toBe(true);
      expect(result2.value.availableQuantity).toBe(50);
      expect(result2.value.reservedQuantity).toBe(50);
    });
  });

  describe('release', () => {
    it('should release reserved quantity back to available', () => {
      const inventory = new InventoryInfo(70, 30);
      const result = inventory.release(20);

      expect(result.isSuccess).toBe(true);
      expect(result.value.availableQuantity).toBe(90);
      expect(result.value.reservedQuantity).toBe(10);
    });

    it('should fail to release more than reserved quantity', () => {
      const inventory = new InventoryInfo(70, 30);
      const result = inventory.release(40);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Cannot release more than reserved');
    });

    it('should fail to release negative quantity', () => {
      const inventory = new InventoryInfo(70, 30);
      const result = inventory.release(-10);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Release quantity must be positive');
    });

    it('should release all reserved quantity', () => {
      const inventory = new InventoryInfo(70, 30);
      const result = inventory.release(30);

      expect(result.isSuccess).toBe(true);
      expect(result.value.availableQuantity).toBe(100);
      expect(result.value.reservedQuantity).toBe(0);
    });
  });

  describe('restock', () => {
    it('should add quantity to available stock', () => {
      const inventory = new InventoryInfo(50, 10);
      const result = inventory.restock(40);

      expect(result.isSuccess).toBe(true);
      expect(result.value.availableQuantity).toBe(90);
      expect(result.value.reservedQuantity).toBe(10);
      expect(result.value.lastRestockedAt).toBeInstanceOf(Date);
    });

    it('should fail to restock negative quantity', () => {
      const inventory = new InventoryInfo(50, 10);
      const result = inventory.restock(-10);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Restock quantity must be positive');
    });

    it('should fail to restock zero quantity', () => {
      const inventory = new InventoryInfo(50, 10);
      const result = inventory.restock(0);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Restock quantity must be positive');
    });
  });

  describe('isAvailable', () => {
    it('should return true when requested quantity is available', () => {
      const inventory = new InventoryInfo(100, 0);
      expect(inventory.isAvailable(50)).toBe(true);
    });

    it('should return false when requested quantity exceeds available', () => {
      const inventory = new InventoryInfo(50, 0);
      expect(inventory.isAvailable(60)).toBe(false);
    });

    it('should return true for zero quantity', () => {
      const inventory = new InventoryInfo(0, 0);
      expect(inventory.isAvailable(0)).toBe(true);
    });

    it('should consider only available, not reserved', () => {
      const inventory = new InventoryInfo(50, 50);
      expect(inventory.isAvailable(60)).toBe(false);
      expect(inventory.isAvailable(50)).toBe(true);
    });
  });

  describe('isOutOfStock', () => {
    it('should return true when no available quantity', () => {
      const inventory = new InventoryInfo(0, 0);
      expect(inventory.isOutOfStock()).toBe(true);
    });

    it('should return false when available quantity exists', () => {
      const inventory = new InventoryInfo(1, 0);
      expect(inventory.isOutOfStock()).toBe(false);
    });

    it('should return true when all stock is reserved', () => {
      const inventory = new InventoryInfo(0, 100);
      expect(inventory.isOutOfStock()).toBe(true);
    });
  });
});
