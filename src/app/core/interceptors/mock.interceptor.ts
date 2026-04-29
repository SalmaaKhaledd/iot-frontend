import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { AuthResponse, User } from '../models/user.model';

type MockUser = User & { password: string };

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

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock) {
    return next(req);
  }

  const path = getPathname(req.url);

  // TODO: remove when backend is ready
  if (req.method === 'POST' && path.endsWith('/api/auth/register')) {
    return of(
      new HttpResponse({
        status: 200,
        body: { message: 'User registered successfully' },
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
            error: { message: 'Invalid credentials' },
          }),
      ).pipe(delay(300));
    }

    const { password: _, ...userWithoutPassword } = matchedUser;
    currentUser = userWithoutPassword;

    const body: AuthResponse = {
      token: 'mock-jwt-token',
      user: userWithoutPassword,
    };
    return of(
      new HttpResponse({
        status: 200,
        body,
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && path.endsWith('/api/users/me')) {
    return of(
      new HttpResponse({
        status: 200,
        body: currentUser,
      }),
    ).pipe(delay(300));
  }

  return next(req);
};
