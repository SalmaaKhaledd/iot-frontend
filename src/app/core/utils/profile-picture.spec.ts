import { hasProfilePicture } from './profile-picture';

describe('profile-picture utils', () => {
  describe('hasProfilePicture', () => {
    it('returns false for null, undefined, and blank values', () => {
      expect(hasProfilePicture(null)).toBe(false);
      expect(hasProfilePicture(undefined)).toBe(false);
      expect(hasProfilePicture('')).toBe(false);
      expect(hasProfilePicture('   ')).toBe(false);
    });

    it('returns true for public HTTP(S) image URLs', () => {
      expect(
        hasProfilePicture('https://cdn.example.com/profile-pictures/user/avatar.jpeg'),
      ).toBe(true);
      expect(
        hasProfilePicture('http://localhost:8080/profile-pictures/user/avatar.jpeg'),
      ).toBe(true);
    });

    it('returns false for legacy local paths, inline data URLs, and other schemes', () => {
      expect(
        hasProfilePicture('uploads/profile-pictures/user_abc123_1715000000.jpeg'),
      ).toBe(false);
      expect(hasProfilePicture('data:image/png;base64,abc')).toBe(false);
      expect(hasProfilePicture('ftp://cdn.example.com/avatar.jpeg')).toBe(false);
    });
  });
});
