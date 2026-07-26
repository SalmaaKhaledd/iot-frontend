/**
 * Helpers for the profile-picture wire format.
 *
 * `profilePicture` is now a public image URL from R2/CDN. Legacy local
 * filesystem paths and inline data URLs are intentionally ignored.
 */

export function hasProfilePicture(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
