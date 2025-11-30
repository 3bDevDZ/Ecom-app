import { ShowroomInfo } from '../../../src/modules/landing-cms/domain/value-objects/showroom-info';

describe('ShowroomInfo Value Object', () => {
  describe('create', () => {
    it('should create a valid ShowroomInfo', () => {
      const data = {
        address: '123 Main St, City, State 12345',
        businessHours: 'Mon-Fri: 9AM-5PM',
        mapImageUrl: 'https://example.com/map.jpg',
      };

      const info = ShowroomInfo.create(data);

      expect(info.isSuccess).toBe(true);
      expect(info.value.address).toBe(data.address);
    });

    it('should fail when address is empty', () => {
      const data = {
        address: '',
        businessHours: 'Mon-Fri: 9AM-5PM',
        mapImageUrl: 'https://example.com/map.jpg',
      };

      const info = ShowroomInfo.create(data);

      expect(info.isFailure).toBe(true);
    });

    it('should fail when mapImageUrl is invalid', () => {
      const data = {
        address: '123 Main St',
        businessHours: 'Mon-Fri: 9AM-5PM',
        mapImageUrl: 'invalid-url',
      };

      const info = ShowroomInfo.create(data);

      expect(info.isFailure).toBe(true);
    });
  });
});
