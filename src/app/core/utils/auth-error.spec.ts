import { HttpErrorResponse } from '@angular/common/http';

import { mapAuthError } from './auth-error';

describe('mapAuthError', () => {
  it('joins string[] message for 400', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: {
        status: 400,
        error: 'Bad Request',
        message: ['email is required', 'password is required'],
      },
    });

    expect(mapAuthError(err)).toBe('email is required\npassword is required');
  });

  it('uses string message for 401', () => {
    const err = new HttpErrorResponse({
      status: 401,
      error: {
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      },
    });

    expect(mapAuthError(err)).toBe('Invalid email or password.');
  });

  it('falls back for 400 when message is empty array', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { status: 400, error: 'Bad Request', message: [] },
    });

    expect(mapAuthError(err)).toBe('Please review the form and try again.');
  });

  it('returns network fallback for status 0', () => {
    const err = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

    expect(mapAuthError(err)).toBe(
      'Something went wrong with our server, try again later.',
    );
  });

  it('returns unknown for non-HttpError', () => {
    expect(mapAuthError(new Error('oops'))).toBe(
      'An unexpected error occurred. Please try again.',
    );
  });
});
