const STORAGE_KEY = 'iot_profile_picture_cache';

export interface ProfilePictureCacheEntry {
  userId: string;
  profilePicturePath: string;
  dataUrl: string;
}

/** Returns a cached data URL when it matches the current user and picture path. */
export function readProfilePictureCache(
  userId: string,
  profilePicturePath: string,
): string | null {
  const entry = readRawEntry();
  if (
    !entry ||
    entry.userId !== userId ||
    entry.profilePicturePath !== profilePicturePath ||
    !entry.dataUrl.startsWith('data:image/')
  ) {
    return null;
  }
  return entry.dataUrl;
}

export function writeProfilePictureCache(
  userId: string,
  profilePicturePath: string,
  dataUrl: string,
): void {
  if (!dataUrl.startsWith('data:image/')) {
    return;
  }

  const entry: ProfilePictureCacheEntry = {
    userId,
    profilePicturePath,
    dataUrl,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Quota exceeded or storage blocked — ignore and rely on network next time.
  }
}

export function clearProfilePictureCache(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read profile picture.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read profile picture.'));
    reader.readAsDataURL(blob);
  });
}

function readRawEntry(): ProfilePictureCacheEntry | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProfilePictureCacheEntry>;
    if (
      typeof parsed.userId !== 'string' ||
      typeof parsed.profilePicturePath !== 'string' ||
      typeof parsed.dataUrl !== 'string'
    ) {
      return null;
    }
    return parsed as ProfilePictureCacheEntry;
  } catch {
    return null;
  }
}
