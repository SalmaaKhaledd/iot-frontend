/**
 * Helpers for the profile-picture wire format.
 *
 * `profilePicture` on GET /api/user/profile is a server filesystem path (or null).
 * It must not be used as an <img> src — fetch bytes from GET /api/user/profile/picture.
 */

/** True when the user has uploaded a picture (non-null, non-empty path). */
export function hasProfilePicture(value: string | null | undefined): boolean {
  if (!value || !value.trim()) {
    return false;
  }
  // Ignore legacy inline base64 stored in older clients.
  if (value.startsWith('data:image')) {
    return false;
  }
  return true;
}

/** Authenticated download endpoint for profile picture bytes. */
export function profilePictureDownloadUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}/user/profile/picture`;
}

/** True when GET /picture returned real image bytes (not a JSON error body). */
export function isImageBlob(blob: Blob): boolean {
  if (!blob.size) {
    return false;
  }
  const type = blob.type.toLowerCase();
  if (type.includes('json') || type.startsWith('text/')) {
    return false;
  }
  if (type.startsWith('image/')) {
    return true;
  }
  // Spring may serve valid files as application/octet-stream.
  return type === '' || type === 'application/octet-stream';
}
