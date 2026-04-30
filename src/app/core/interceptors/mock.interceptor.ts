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

type MockUser = User & { password: string };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

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

let currentUser: User = mockUsers[0];

function getPathname(url: string): string {
  try {
    return url.startsWith('http')
      ? new URL(url).pathname
      : new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

function isAuthorized(req: HttpRequest<unknown>): boolean {
  const authHeader = req.headers.get('Authorization');
  return typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
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
          'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
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
    currentUser = userWithoutPassword;

    const body = {
      userId: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      token: 'mock-jwt-token',
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
  if (req.method === 'GET' && path.endsWith('/api/users/profile')) {
    if (!isAuthorized(req)) {
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
          userId: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          profilePicture: currentUser.profilePicture,
        },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'PATCH' && path.endsWith('/api/users/profile/password')) {
    if (!isAuthorized(req)) {
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

    if (!currentPassword || !newPassword) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: 'All fields are required.',
            },
          }),
      ).pipe(delay(300));
    }

    const userIndex = mockUsers.findIndex((user) => user.id === currentUser.id);
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
  if (req.method === 'PATCH' && path.endsWith('/api/users/profile/picture')) {
    if (!isAuthorized(req)) {
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

    currentUser = { ...currentUser, profilePicture };
    const userIndex = mockUsers.findIndex((user) => user.id === currentUser.id);
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
