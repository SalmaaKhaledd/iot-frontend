/**
 * Helpers for the profile-picture wire format.
 *
 * Per the API contract, `profilePicture` is exchanged as a raw base64 string
 * (e.g. `"/9j/4AAQSkZJRg..."`) — without the `data:image/...;base64,` prefix
 * that `FileReader.readAsDataURL` produces and that `<img [src]>` requires.
 *
 * - `stripDataUrlPrefix` is used at the network boundary when sending.
 * - `toRenderablePicture` is used at the template boundary when displaying.
 */

const DATA_URL_PREFIX_PATTERN = /^data:image\/[a-z+.-]+;base64,/i;

/**
 * Removes the `data:image/...;base64,` prefix from a value produced by
 * `FileReader.readAsDataURL`. Returns the input unchanged if it does not
 * carry a data-URL prefix (already raw base64, empty string, etc.).
 */
export function stripDataUrlPrefix(value: string): string {
  return value.replace(DATA_URL_PREFIX_PATTERN, '');
}

/**
 * Converts a stored `profilePicture` (raw base64) into a value the browser
 * can render in `<img [src]>`. Already-prefixed values pass through, and
 * empty / missing values return an empty string so callers can fall back
 * to initials.
 *
 * A generic `image/jpeg` MIME is used for the prefix because the contract
 * does not preserve the original type; browsers sniff the actual format
 * from the bytes regardless of the prefix.
 */
export function toRenderablePicture(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  if (DATA_URL_PREFIX_PATTERN.test(value)) {
    return value;
  }
  return `data:image/jpeg;base64,${value}`;
}
