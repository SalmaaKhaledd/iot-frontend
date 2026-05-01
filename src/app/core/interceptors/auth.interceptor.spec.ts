import { HttpErrorResponse, HttpEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let authServiceStub: {
    getToken: () => string | null;
    logout: () => void;
  };
  let router: Router;

  beforeEach(() => {
    authServiceStub = {
      getToken: () => null,
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    });

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('adds bearer header for API requests when token exists', () => {
    authServiceStub.getToken = () => 'abc-token';
    const request = new HttpRequest('GET', 'http://localhost:8080/api/user/profile');
    let outgoing: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, (req): Observable<HttpEvent<unknown>> => {
        outgoing = req;
        return of(new HttpResponse({ status: 200, body: {} }));
      }).subscribe(),
    );

    expect(outgoing?.headers.get('Authorization')).toBe('Bearer abc-token');
  });

  it('does not add bearer header when token is missing', () => {
    authServiceStub.getToken = () => null;
    const request = new HttpRequest('GET', 'http://localhost:8080/api/user/profile');
    let outgoing: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, (req): Observable<HttpEvent<unknown>> => {
        outgoing = req;
        return of(new HttpResponse({ status: 200, body: {} }));
      }).subscribe(),
    );

    expect(outgoing?.headers.has('Authorization')).toBe(false);
  });

  it('does not add bearer header for non-API requests', () => {
    authServiceStub.getToken = () => 'abc-token';
    const request = new HttpRequest('GET', 'http://localhost:4200/assets/logo.svg');
    let outgoing: HttpRequest<unknown> | undefined;

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, (req): Observable<HttpEvent<unknown>> => {
        outgoing = req;
        return of(new HttpResponse({ status: 200, body: {} }));
      }).subscribe(),
    );

    expect(outgoing?.headers.has('Authorization')).toBe(false);
  });

  it('logs out and redirects on 401 token auth-failure responses', () => {
    authServiceStub.getToken = () => 'abc-token';
    const request = new HttpRequest('GET', 'http://localhost:8080/api/user/profile');

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, () =>
        throwError(
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
        ),
      ).subscribe({
        error: () => undefined,
      }),
    );

    expect(authServiceStub.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not log out on 401 domain errors (e.g. wrong current password)', () => {
    authServiceStub.getToken = () => 'abc-token';
    const request = new HttpRequest(
      'PATCH',
      'http://localhost:8080/api/user/profile/password',
      {},
    );

    TestBed.runInInjectionContext(() =>
      authInterceptor(request, () =>
        throwError(
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
        ),
      ).subscribe({
        error: () => undefined,
      }),
    );

    expect(authServiceStub.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
