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
      profilePicture: null,
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
      profilePicture: null,
      token: 'mock-token',
      message: 'User registered successfully.',
    });
  });

  it('calls updateProfilePicture endpoint with FormData and returns the public URL', () => {
    const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
    let response: { message: string; profilePicture?: string | null } | undefined;
    service.updateProfilePicture(file).subscribe((value) => {
      response = value;
    });

    const req = httpMock.expectOne('http://localhost:8080/api/user/profile/picture');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush({
      message: 'Profile picture updated successfully.',
      profilePicture: 'https://cdn.example.com/profile-pictures/user/avatar.jpeg',
    });

    expect(response?.profilePicture).toBe(
      'https://cdn.example.com/profile-pictures/user/avatar.jpeg',
    );
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
    expect(service.currentUser()).toEqual({
      id: '1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Test',
      profilePicture: null,
    });
  });

  it('logout calls backend logout endpoint', () => {
    service.logout().subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ message: 'Logged out successfully.' });
  });

  it('clearSession clears token and user', () => {
    service.saveToken('abc-token');
    service.saveUser({
      id: '1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Test',
      profilePicture: null,
    });

    service.clearSession();

    expect(service.getToken()).toBeNull();
    expect(service.getUser()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});
