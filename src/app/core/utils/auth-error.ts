import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

import type { ApiErrorResponse } from '../models/auth.models';

/**
 * Shared fallback messages used when the backend does not return a usable
 * `message` field. Centralized so signup and login stay in sync.
 */
const FALLBACK_MESSAGES = {
  badRequest: 'Please review the form and try again.',
  unauthorized: 'Invalid email or password.',
  conflict: 'This email is already registered.',
  rateLimited: 'Too many requests. Please wait a moment and try again.',
  serverError: 'Something went wrong with our server, try again later.',
  network: 'Something went wrong with our server, try again later.',
  unknown: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Maps any error thrown from an auth-related HTTP call to a single,
 * user-facing message. Prefers the backend-provided `message` (per the
 * agreed `ApiErrorResponse` contract) and falls back to shared
 * defaults for 400 / 401 / 409 / 429 / 500, network failures, timeouts, and unknown errors.
 */
export function mapAuthError(error: unknown): string {
  // Handle timeout errors
  if (error instanceof TimeoutError) {
    return FALLBACK_MESSAGES.serverError;
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return FALLBACK_MESSAGES.network;
    }

    const apiMessage = extractApiMessage(error.error);

    switch (error.status) {
      case 400:
        return apiMessage ?? FALLBACK_MESSAGES.badRequest;
      case 401:
        return apiMessage ?? FALLBACK_MESSAGES.unauthorized;
      case 409:
        return apiMessage ?? FALLBACK_MESSAGES.conflict;
      case 429:
        return apiMessage ?? FALLBACK_MESSAGES.rateLimited;
      case 500:
      case 502:
      case 503:
      case 504:
        return FALLBACK_MESSAGES.serverError;
      default:
        return apiMessage ?? FALLBACK_MESSAGES.unknown;
    }
  }

  return FALLBACK_MESSAGES.unknown;
}

/**
 * Safely pulls the `message` field out of a backend error body without
 * trusting unknown shapes. Returns `null` when the body is missing,
 * empty, or does not look like our `ApiErrorResponse` contract.
 */
function extractApiMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const message = (body as Partial<ApiErrorResponse>).message;
  if (typeof message === 'string') {
    const trimmed = message.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(message)) {
    return null;
  }

  const normalized = message
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return normalized.length > 0 ? normalized.join('\n') : null;
}
