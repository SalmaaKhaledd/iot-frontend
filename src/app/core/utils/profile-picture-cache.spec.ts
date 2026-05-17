import {
  blobToDataUrl,
  clearProfilePictureCache,
  readProfilePictureCache,
  writeProfilePictureCache,
} from './profile-picture-cache';

describe('profile-picture-cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no cache entry exists', () => {
    expect(readProfilePictureCache('user-1', 'uploads/pic.jpeg')).toBeNull();
  });

  it('stores and reads a data URL for the matching user and path', () => {
    writeProfilePictureCache('user-1', 'uploads/pic.jpeg', 'data:image/jpeg;base64,abc');

    expect(readProfilePictureCache('user-1', 'uploads/pic.jpeg')).toBe(
      'data:image/jpeg;base64,abc',
    );
    expect(readProfilePictureCache('user-2', 'uploads/pic.jpeg')).toBeNull();
    expect(readProfilePictureCache('user-1', 'uploads/other.jpeg')).toBeNull();
  });

  it('clears the cache entry', () => {
    writeProfilePictureCache('user-1', 'uploads/pic.jpeg', 'data:image/jpeg;base64,abc');
    clearProfilePictureCache();
    expect(readProfilePictureCache('user-1', 'uploads/pic.jpeg')).toBeNull();
  });

  it('converts a blob to a data URL', async () => {
    const dataUrl = await blobToDataUrl(new Blob(['img'], { type: 'image/jpeg' }));
    expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true);
  });
});
