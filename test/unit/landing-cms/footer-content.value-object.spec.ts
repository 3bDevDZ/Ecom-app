import { FooterContent } from '../../../src/modules/landing-cms/domain/value-objects/footer-content';

describe('FooterContent Value Object', () => {
  describe('create', () => {
    it('should create a valid FooterContent', () => {
      const data = {
        companyDescription: 'Leading B2B supplier since 2020',
        navigationLinks: [
          { label: 'About Us', url: '/about' },
          { label: 'Contact', url: '/contact' },
        ],
        copyrightText: '© 2024 Company Name. All rights reserved.',
      };

      const footer = FooterContent.create(data);

      expect(footer.isSuccess).toBe(true);
      expect(footer.value.companyDescription).toBe(data.companyDescription);
    });

    it('should fail when company description is empty', () => {
      const data = {
        companyDescription: '',
        navigationLinks: [],
        copyrightText: '© 2024',
      };

      const footer = FooterContent.create(data);

      expect(footer.isFailure).toBe(true);
    });

    it('should fail when copyright text is empty', () => {
      const data = {
        companyDescription: 'Company',
        navigationLinks: [],
        copyrightText: '',
      };

      const footer = FooterContent.create(data);

      expect(footer.isFailure).toBe(true);
    });
  });
});
