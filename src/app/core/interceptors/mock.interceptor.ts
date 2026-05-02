import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { User } from '../models/user.model';
import { STRONG_PASSWORD_PATTERN } from '../validation/auth-validation.constants';

type MockUser = User & { password: string };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mockUsers: MockUser[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    profilePicture: null,
    password: 'Password123!',
  },
  {
    id: '2',
    firstName: 'Farida',
    lastName: 'Khaled',
    email: 'faridakhaled05@gmail.com',
    profilePicture: null,
    password: 'Farida123!',
  },
];

/** Dev tokens encode the user id so profile routes survive a full page reload. */
const MOCK_JWT_PREFIX = 'mock-jwt-';

function getPathname(url: string): string {
  try {
    return url.startsWith('http')
      ? new URL(url).pathname
      : new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

function bearerToken(req: HttpRequest<unknown>): string | null {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  const raw = header.slice('Bearer '.length).trim();
  return raw.length > 0 ? raw : null;
}

function sessionUserFromRequest(req: HttpRequest<unknown>): User | null {
  const token = bearerToken(req);
  if (!token?.startsWith(MOCK_JWT_PREFIX)) {
    return null;
  }
  const userId = token.slice(MOCK_JWT_PREFIX.length);
  const found = mockUsers.find((user) => user.id === userId);
  if (!found) {
    return null;
  }
  const { password: _, ...withoutPassword } = found;
  return withoutPassword;
}

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock) {
    return next(req);
  }

  const path = getPathname(req.url);

  // TODO: remove when backend is ready
  if (req.method === 'POST' && path.endsWith('/api/auth/register')) {
    const requestBody = req.body as
      | {
          firstName?: string;
          lastName?: string;
          email?: string;
          password?: string;
          profilePicture?: string;
        }
      | null;

    const firstName = String(requestBody?.firstName ?? '').trim();
    const lastName = String(requestBody?.lastName ?? '').trim();
    const email = String(requestBody?.email ?? '').trim().toLowerCase();
    const password = String(requestBody?.password ?? '');
    const profilePicture = requestBody?.profilePicture ?? null;

    const validationMessages: string[] = [];
    if (!email) {
      validationMessages.push('email is required');
    } else if (!EMAIL_PATTERN.test(email)) {
      validationMessages.push('invalid email format');
    }
    if (!firstName) {
      validationMessages.push('first name is required');
    } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {
      validationMessages.push('invalid first name');
    }
    if (!lastName) {
      validationMessages.push('last name is required');
    } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {
      validationMessages.push('invalid last name');
    }
    if (!password) {
      validationMessages.push('password is required');
    } else {
      if (password.length < 8) {
        validationMessages.push('password must be at least 8 characters long');
      } else if (password.length > 64) {
        validationMessages.push('password too long. 64 characters is the maximum');
      }
      if (!STRONG_PASSWORD_PATTERN.test(password)) {
        validationMessages.push(
          'password must contain at least one uppercase letter, one lowercase letter, one number, and one of @ $ ! % * ? &',
        );
      }
    }

    if (validationMessages.length > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: validationMessages,
            },
          }),
      ).pipe(delay(300));
    }

    const emailExists = mockUsers.some(
      (user) => user.email.toLowerCase() === email,
    );

    if (emailExists) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
            error: {
              status: 409,
              error: 'Conflict',
              message: 'Email already exists.',
            },
          }),
      ).pipe(delay(300));
    }

    const newUser: MockUser = {
      id: String(Date.now()),
      firstName,
      lastName,
      email,
      password,
      profilePicture: typeof profilePicture === 'string' ? profilePicture : null,
    };
    mockUsers.push(newUser);

    return of(
      new HttpResponse({
        status: 201,
        body: {
          userId: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          message: 'User registered successfully.',
        },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'POST' && path.endsWith('/api/auth/login')) {
    const requestBody = req.body as
      | { email?: string; password?: string }
      | null;
    const email = String(requestBody?.email ?? '').toLowerCase();
    const password = String(requestBody?.password ?? '');

    const validationMessages: string[] = [];
    if (!email) {
      validationMessages.push('email is required');
    } else if (!EMAIL_PATTERN.test(email)) {
      validationMessages.push('invalid email format');
    }
    if (!password) {
      validationMessages.push('password is required');
    } else if (password.length < 8) {
      validationMessages.push('password must be at least 8 characters long');
    } else if (password.length > 64) {
      validationMessages.push('password too long. 64 characters is the maximum');
    }

    if (validationMessages.length > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: validationMessages,
            },
          }),
      ).pipe(delay(300));
    }

    const matchedUser = mockUsers.find(
      (user) =>
        user.email.toLowerCase() === email && user.password === password,
    );

    if (!matchedUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Invalid email or password.',
            },
          }),
      ).pipe(delay(300));
    }

    const { password: _, ...userWithoutPassword } = matchedUser;

    const body = {
      userId: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      token: `${MOCK_JWT_PREFIX}${userWithoutPassword.id}`,
      message: 'Login successful.',
    };
    return of(
      new HttpResponse({
        status: 200,
        body,
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && path.endsWith('/api/user/profile')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    return of(
      new HttpResponse({
        status: 200,
        body: {
          userId: sessionUser.id,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
          email: sessionUser.email,
          profilePicture: sessionUser.profilePicture,
        },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'PATCH' && path.endsWith('/api/user/profile/password')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const requestBody = req.body as
      | { currentPassword?: string; newPassword?: string }
      | null;
    const currentPassword = String(requestBody?.currentPassword ?? '');
    const newPassword = String(requestBody?.newPassword ?? '');

    const validationMessages: string[] = [];
    if (!currentPassword) {
      validationMessages.push('current password is required');
    }
    if (!newPassword) {
      validationMessages.push('new password is required');
    } else {
      if (newPassword.length < 8) {
        validationMessages.push('password must at least 8 characters long');
      } else if (newPassword.length > 64) {
        validationMessages.push('password too long. 64 characters is the maximum');
      }
      if (!STRONG_PASSWORD_PATTERN.test(newPassword)) {
        validationMessages.push(
          'password must contain at least one uppercase letter, one lowercase letter, one number, and one of @ $ ! % * ? &',
        );
      }
    }

    if (validationMessages.length > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: validationMessages,
            },
          }),
      ).pipe(delay(300));
    }

    const userIndex = mockUsers.findIndex((user) => user.id === sessionUser.id);
    if (userIndex < 0 || mockUsers[userIndex].password !== currentPassword) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Current password is incorrect.',
            },
          }),
      ).pipe(delay(300));
    }

    mockUsers[userIndex].password = newPassword;
    return of(
      new HttpResponse({
        status: 200,
        body: { message: 'Password updated successfully.' },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'PATCH' && path.endsWith('/api/user/profile/picture')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const requestBody = req.body as { profilePicture?: string } | null;
    const profilePicture = String(requestBody?.profilePicture ?? '').trim();

    if (!profilePicture) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: 'Profile picture is required.',
            },
          }),
      ).pipe(delay(300));
    }

    // Per the API contract, the server stores the raw base64 string and does
    // not validate type or size — that is enforced client-side before the
    // file is read. The mock mirrors the contract so the UI behaves the same
    // against either backend.
    const userIndex = mockUsers.findIndex((user) => user.id === sessionUser.id);
    if (userIndex >= 0) {
      mockUsers[userIndex].profilePicture = profilePicture;
    }

    return of(
      new HttpResponse({
        status: 200,
        body: { message: 'Profile picture updated successfully.' },
      }),
    ).pipe(delay(300));
  }

  return next(req);
};
