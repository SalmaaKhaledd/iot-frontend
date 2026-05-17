/**
 * Helpers for the profile-picture wire format.
 *
 * Per the updated API contract, `profilePicture` is exchanged as an API path
 * (e.g. `"/api/user/profile/picture"`).
 */

/**
 * Checks if the given profile picture value is valid.
 * Treats legacy base64 strings as invalid.
 */
export function hasProfilePicture(value: string | null | undefined): boolean {
  if (!value || !value.trim()) {
    return false;
  }
  // Ignore legacy base64 or empty strings
  if (value.startsWith('data:image') || value.length > 200) {
    return false;
  }
  return true;
}

/**
 * Constructs a full URL for the profile picture using the API base URL.
 */
export function buildProfilePictureUrl(
  profilePicture: string | null | undefined,
  apiBaseUrl: string,
): string {
  if (!hasProfilePicture(profilePicture)) return '';
  if (profilePicture!.startsWith('http')) return profilePicture!;
  const base = apiBaseUrl.replace(/\/$/, '');
  const pic = profilePicture!;
  let path = pic.startsWith('/') ? pic : `/${pic}`;
  
  if (base.endsWith('/api') && path.startsWith('/api/')) {
    path = path.substring(4);
  }
  
  return `${base}${path}`;
}
