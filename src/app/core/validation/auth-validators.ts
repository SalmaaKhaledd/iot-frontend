import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import {
  ALLOWED_PROFILE_IMAGE_TYPES,
  AUTH_VALIDATION,
  NAME_PATTERN,
  STRONG_PASSWORD_PATTERN,
} from './auth-validation.constants';

export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (!password || !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}

export function profileImageError(file: File): string | null {
  if (!isAllowedImageType(file)) {
    return 'Only JPG, PNG, or WEBP images are allowed.';
  }

  if (file.size > AUTH_VALIDATION.maxProfileImageBytes) {
    return 'Profile picture must be 1MB or smaller.';
  }

  return null;
}

function isAllowedImageType(file: File): boolean {
  return ALLOWED_PROFILE_IMAGE_TYPES.includes(
    file.type as (typeof ALLOWED_PROFILE_IMAGE_TYPES)[number],
  );
}

export const authRules = {
  namePattern: NAME_PATTERN,
  strongPasswordPattern: STRONG_PASSWORD_PATTERN,
  limits: AUTH_VALIDATION,
} as const;
