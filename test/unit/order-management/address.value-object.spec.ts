import { Address } from '../../../src/modules/order-management/domain/value-objects/address';

describe('Address Value Object', () => {
    const validAddressData = {
        street: '123 Main Street',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
        contactName: 'John Doe',
        contactPhone: '+1-512-555-0123',
    };

    describe('create', () => {
        it('should create address with valid data', () => {
            const address = Address.create(validAddressData);

            expect(address.street).toBe(validAddressData.street);
            expect(address.city).toBe(validAddressData.city);
            expect(address.state).toBe(validAddressData.state);
            expect(address.postalCode).toBe(validAddressData.postalCode);
            expect(address.country).toBe(validAddressData.country);
            expect(address.contactName).toBe(validAddressData.contactName);
            expect(address.contactPhone).toBe(validAddressData.contactPhone);
        });

        it('should throw error if street is empty', () => {
            const invalidData = { ...validAddressData, street: '' };

            expect(() => Address.create(invalidData)).toThrow('Street is required');
        });

        it('should throw error if city is empty', () => {
            const invalidData = { ...validAddressData, city: '' };

            expect(() => Address.create(invalidData)).toThrow('City is required');
        });

        it('should throw error if state is empty', () => {
            const invalidData = { ...validAddressData, state: '' };

            expect(() => Address.create(invalidData)).toThrow('State is required');
        });

        it('should throw error if state is not 2 characters', () => {
            const invalidStates = ['T', 'TEX', 'TEXAS'];

            invalidStates.forEach(state => {
                const invalidData = { ...validAddressData, state };
                expect(() => Address.create(invalidData)).toThrow('State must be 2-letter code');
            });
        });

        it('should throw error if postal code is empty', () => {
            const invalidData = { ...validAddressData, postalCode: '' };

            expect(() => Address.create(invalidData)).toThrow('Postal code is required');
        });

        it('should throw error if country is empty', () => {
            const invalidData = { ...validAddressData, country: '' };

            expect(() => Address.create(invalidData)).toThrow('Country is required');
        });

        it('should throw error if country is not 2 characters', () => {
            const invalidCountries = ['U', 'USA', 'UNITED STATES'];

            invalidCountries.forEach(country => {
                const invalidData = { ...validAddressData, country };
                expect(() => Address.create(invalidData)).toThrow('Country must be 2-letter ISO code');
            });
        });

        it('should throw error if contact name is empty', () => {
            const invalidData = { ...validAddressData, contactName: '' };

            expect(() => Address.create(invalidData)).toThrow('Contact name is required');
        });

        it('should throw error if contact phone is empty', () => {
            const invalidData = { ...validAddressData, contactPhone: '' };

            expect(() => Address.create(invalidData)).toThrow('Contact phone is required');
        });
    });

    describe('equals', () => {
        it('should return true for identical addresses', () => {
            const address1 = Address.create(validAddressData);
            const address2 = Address.create(validAddressData);

            expect(address1.equals(address2)).toBe(true);
        });

        it('should return false for different streets', () => {
            const address1 = Address.create(validAddressData);
            const address2 = Address.create({ ...validAddressData, street: '456 Oak Avenue' });

            expect(address1.equals(address2)).toBe(false);
        });

        it('should return false for different cities', () => {
            const address1 = Address.create(validAddressData);
            const address2 = Address.create({ ...validAddressData, city: 'Dallas' });

            expect(address1.equals(address2)).toBe(false);
        });
    });

    describe('toString', () => {
        it('should return formatted address string', () => {
            const address = Address.create(validAddressData);
            const formatted = address.toString();

            expect(formatted).toContain(validAddressData.street);
            expect(formatted).toContain(validAddressData.city);
            expect(formatted).toContain(validAddressData.state);
            expect(formatted).toContain(validAddressData.postalCode);
        });
    });
});

