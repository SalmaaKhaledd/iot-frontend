import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: Router;
  let authServiceStub: { getToken: () => string | null };

  beforeEach(() => {
    authServiceStub = {
      getToken: () => null,
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('returns true when token exists', () => {
    authServiceStub.getToken = () => 'token';

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('returns login UrlTree when token is missing', () => {
    authServiceStub.getToken = () => null;

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
