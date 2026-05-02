export const AUTH_VALIDATION = {
  emailMaxLength: 254,
  nameMinLength: 2,
  nameMaxLength: 50,
  passwordMinLength: 8,
  passwordMaxLength: 64,
  maxProfileImageBytes: 1_048_576,
} as const;

export const NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

// Mirrors the backend's @Pattern on SignupRequest exactly:
// allowed body chars are letters, digits, and @ $ ! % * ? &
// (any other character is rejected client-side with a `pattern` error
// so the user sees the issue without a 400 round-trip).
export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;

export const ALLOWED_PROFILE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
