import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Backend message returned for missing/invalid/expired tokens (per API contract).
 * Used to distinguish auth-failure 401s from domain 401s (e.g. wrong current password)
 * that share the same status code but should not log the user out.
 */
const TOKEN_AUTH_FAILURE_MESSAGE = 'Access denied. Invalid or missing token.';

function isApiRequest(request: HttpRequest<unknown>): boolean {
  return request.url.startsWith(environment.apiUrl);
}

function getPathname(url: string): string {
  try {
    return url.startsWith('http')
      ? new URL(url).pathname
      : new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

/**
 * Login and register must not send a Bearer token. A leftover token in
 * localStorage (e.g. from a prior session) would otherwise be attached and many
 * backends reject signup/login with 400/401.
 */
function isPublicAuthEndpoint(request: HttpRequest<unknown>): boolean {
  if (request.method !== 'POST') {
    return false;
  }
  const path = getPathname(request.url);
  return path.endsWith('/auth/register') || path.endsWith('/auth/login');
}

function isTokenAuthFailure(error: HttpErrorResponse): boolean {
  if (error.status !== 401) {
    return false;
  }
  const body = error.error as { message?: unknown } | null;
  return body?.message === TOKEN_AUTH_FAILURE_MESSAGE;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const request =
    token && isApiRequest(req) && !isPublicAuthEndpoint(req)
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && isTokenAuthFailure(error)) {
        authService.logout();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
