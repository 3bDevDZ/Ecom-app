import { ContactSection } from '../../../src/modules/landing-cms/domain/value-objects/contact-section';

describe('ContactSection Value Object', () => {
  describe('create', () => {
    it('should create a valid ContactSection', () => {
      const data = {
        heading: 'Get in Touch',
        description: 'Contact us for inquiries about products and services',
      };

      const section = ContactSection.create(data);

      expect(section.isSuccess).toBe(true);
      expect(section.value.heading).toBe(data.heading);
    });

    it('should fail when heading is empty', () => {
      const data = {
        heading: '',
        description: 'Contact us',
      };

      const section = ContactSection.create(data);

      expect(section.isFailure).toBe(true);
    });

    it('should fail when description is empty', () => {
      const data = {
        heading: 'Get in Touch',
        description: '',
      };

      const section = ContactSection.create(data);

      expect(section.isFailure).toBe(true);
    });
  });
});
