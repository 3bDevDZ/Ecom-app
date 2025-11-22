import { OrderNumber } from '../../../src/modules/order-management/domain/value-objects/order-number';

describe('OrderNumber Value Object', () => {
    describe('generate', () => {
        it('should generate order number with correct format ORD-YYYY-MM-XXXXXX', () => {
            const orderNumber = OrderNumber.generate();
            const pattern = /^ORD-\d{4}-\d{2}-\d{6}$/;

            expect(orderNumber.value).toMatch(pattern);
        });

        it('should generate unique order numbers', () => {
            const orderNumber1 = OrderNumber.generate();
            const orderNumber2 = OrderNumber.generate();

            expect(orderNumber1.value).not.toBe(orderNumber2.value);
        });

        it('should include current year and month', () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');

            const orderNumber = OrderNumber.generate();

            expect(orderNumber.value).toContain(`ORD-${year}-${month}`);
        });
    });

    describe('create', () => {
        it('should create order number from valid string', () => {
            const validOrderNumber = 'ORD-2025-11-123456';

            const orderNumber = OrderNumber.create(validOrderNumber);

            expect(orderNumber.value).toBe(validOrderNumber);
        });

        it('should throw error for invalid format', () => {
            const invalidFormats = [
                'INVALID',
                'ORD-2025',
                'ORD-2025-13-123456', // Invalid month
                'ORD-2025-11-12345',  // Too few digits
                'ORD-25-11-123456',   // Invalid year format
            ];

            invalidFormats.forEach(invalid => {
                expect(() => OrderNumber.create(invalid)).toThrow('Invalid order number format');
            });
        });

        it('should throw error for empty string', () => {
            expect(() => OrderNumber.create('')).toThrow('Order number cannot be empty');
        });
    });

    describe('equals', () => {
        it('should return true for equal order numbers', () => {
            const orderNumber1 = OrderNumber.create('ORD-2025-11-123456');
            const orderNumber2 = OrderNumber.create('ORD-2025-11-123456');

            expect(orderNumber1.equals(orderNumber2)).toBe(true);
        });

        it('should return false for different order numbers', () => {
            const orderNumber1 = OrderNumber.create('ORD-2025-11-123456');
            const orderNumber2 = OrderNumber.create('ORD-2025-11-654321');

            expect(orderNumber1.equals(orderNumber2)).toBe(false);
        });
    });

    describe('toString', () => {
        it('should return order number value', () => {
            const value = 'ORD-2025-11-123456';
            const orderNumber = OrderNumber.create(value);

            expect(orderNumber.toString()).toBe(value);
        });
    });
});

