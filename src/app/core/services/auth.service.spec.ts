import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('calls login endpoint with credentials', () => {
    service.login('user@example.com', 'Password123!').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'user@example.com',
      password: 'Password123!',
    });
    req.flush({
      userId: '1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Test',
      token: 'mock-token',
      message: 'Login successful.',
    });
  });

  it('calls register endpoint with payload', () => {
    service
      .register({
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'Password123!',
        profilePicture: 'data:image/png;base64,abc',
      })
      .subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('new@example.com');
    req.flush({
      userId: '2',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      token: 'mock-token',
      message: 'User registered successfully.',
    });
  });

  it('saves and retrieves token and user from localStorage', () => {
    service.saveToken('abc-token');
    service.saveUser({
      id: '1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Test',
      profilePicture: null,
    });

    expect(service.getToken()).toBe('abc-token');
    expect(service.getUser()).toEqual({
      id: '1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Test',
      profilePicture: null,
    });
  });

  it('logout clears token and user keys', () => {
    service.saveToken('abc-token');
    service.saveUser({
      id: '1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Test',
      profilePicture: null,
    });

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
  });
});
