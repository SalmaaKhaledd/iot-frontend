import {
  hasProfilePicture,
  isImageBlob,
  profilePictureDownloadUrl,
} from './profile-picture';

describe('profile-picture utils', () => {
  describe('hasProfilePicture', () => {
    it('returns false for null, undefined, and blank values', () => {
      expect(hasProfilePicture(null)).toBe(false);
      expect(hasProfilePicture(undefined)).toBe(false);
      expect(hasProfilePicture('')).toBe(false);
      expect(hasProfilePicture('   ')).toBe(false);
    });

    it('returns true for a server filesystem path', () => {
      expect(
        hasProfilePicture('uploads/profile-pictures/user_abc123_1715000000.jpeg'),
      ).toBe(true);
    });

    it('returns false for legacy data URLs', () => {
      expect(hasProfilePicture('data:image/png;base64,abc')).toBe(false);
    });
  });

  describe('isImageBlob', () => {
    it('accepts image and octet-stream blobs', () => {
      expect(isImageBlob(new Blob(['x'], { type: 'image/jpeg' }))).toBe(true);
      expect(isImageBlob(new Blob(['x'], { type: 'application/octet-stream' }))).toBe(true);
    });

    it('rejects empty, JSON, and text blobs', () => {
      expect(isImageBlob(new Blob([], { type: 'image/jpeg' }))).toBe(false);
      expect(isImageBlob(new Blob(['{}'], { type: 'application/json' }))).toBe(false);
      expect(isImageBlob(new Blob(['err'], { type: 'text/plain' }))).toBe(false);
    });
  });

  describe('profilePictureDownloadUrl', () => {
    it('builds the picture download endpoint from the API base URL', () => {
      expect(profilePictureDownloadUrl('http://localhost:8080/api')).toBe(
        'http://localhost:8080/api/user/profile/picture',
      );
    });

    it('strips a trailing slash from the base URL', () => {
      expect(profilePictureDownloadUrl('http://localhost:8080/api/')).toBe(
        'http://localhost:8080/api/user/profile/picture',
      );
    });
  });
});
