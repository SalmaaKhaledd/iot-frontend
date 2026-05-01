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
    token && isApiRequest(req)
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
