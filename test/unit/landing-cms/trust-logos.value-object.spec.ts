import { TrustLogos } from '../../../src/modules/landing-cms/domain/value-objects/trust-logos';

describe('TrustLogos Value Object', () => {
  describe('create', () => {
    it('should create a valid TrustLogos with empty array', () => {
      const trustLogos = TrustLogos.create([]);

      expect(trustLogos.isSuccess).toBe(true);
      expect(trustLogos.value.logos).toEqual([]);
    });

    it('should create a valid TrustLogos with logos', () => {
      const logos = [
        { id: '1', name: 'Company A', imageUrl: 'https://example.com/logo1.png', displayOrder: 1 },
        { id: '2', name: 'Company B', imageUrl: 'https://example.com/logo2.png', displayOrder: 2 },
      ];

      const trustLogos = TrustLogos.create(logos);

      expect(trustLogos.isSuccess).toBe(true);
      expect(trustLogos.value.logos).toHaveLength(2);
      expect(trustLogos.value.logos[0].name).toBe('Company A');
    });

    it('should fail when logo name is empty', () => {
      const logos = [
        { id: '1', name: '', imageUrl: 'https://example.com/logo1.png', displayOrder: 1 },
      ];

      const trustLogos = TrustLogos.create(logos);

      expect(trustLogos.isFailure).toBe(true);
      expect(trustLogos.errorValue).toContain('name');
    });

    it('should fail when logo imageUrl is invalid', () => {
      const logos = [
        { id: '1', name: 'Company A', imageUrl: 'not-a-url', displayOrder: 1 },
      ];

      const trustLogos = TrustLogos.create(logos);

      expect(trustLogos.isFailure).toBe(true);
      expect(trustLogos.errorValue).toContain('URL');
    });

    it('should fail when displayOrder is negative', () => {
      const logos = [
        { id: '1', name: 'Company A', imageUrl: 'https://example.com/logo1.png', displayOrder: -1 },
      ];

      const trustLogos = TrustLogos.create(logos);

      expect(trustLogos.isFailure).toBe(true);
      expect(trustLogos.errorValue).toContain('displayOrder');
    });

    it('should fail when there are more than 20 logos', () => {
      const logos = Array.from({ length: 21 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Company ${i + 1}`,
        imageUrl: `https://example.com/logo${i + 1}.png`,
        displayOrder: i + 1,
      }));

      const trustLogos = TrustLogos.create(logos);

      expect(trustLogos.isFailure).toBe(true);
      expect(trustLogos.errorValue).toContain('maximum');
    });
  });

  describe('addLogo', () => {
    it('should add a new logo', () => {
      const initialLogos = [
        { id: '1', name: 'Company A', imageUrl: 'https://example.com/logo1.png', displayOrder: 1 },
      ];

      const trustLogos = TrustLogos.create(initialLogos).value;
      const newLogo = { id: '2', name: 'Company B', imageUrl: 'https://example.com/logo2.png', displayOrder: 2 };

      const result = trustLogos.addLogo(newLogo);

      expect(result.isSuccess).toBe(true);
      expect(result.value.logos).toHaveLength(2);
    });
  });

  describe('removeLogo', () => {
    it('should remove a logo by id', () => {
      const initialLogos = [
        { id: '1', name: 'Company A', imageUrl: 'https://example.com/logo1.png', displayOrder: 1 },
        { id: '2', name: 'Company B', imageUrl: 'https://example.com/logo2.png', displayOrder: 2 },
      ];

      const trustLogos = TrustLogos.create(initialLogos).value;

      const result = trustLogos.removeLogo('1');

      expect(result.isSuccess).toBe(true);
      expect(result.value.logos).toHaveLength(1);
      expect(result.value.logos[0].id).toBe('2');
    });

    it('should fail when removing non-existent logo', () => {
      const initialLogos = [
        { id: '1', name: 'Company A', imageUrl: 'https://example.com/logo1.png', displayOrder: 1 },
      ];

      const trustLogos = TrustLogos.create(initialLogos).value;

      const result = trustLogos.removeLogo('999');

      expect(result.isFailure).toBe(true);
      expect(result.errorValue).toContain('not found');
    });
  });
});
