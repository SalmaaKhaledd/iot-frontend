import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth.service';
import type { User, UserProfileResponse } from '../../core/models/user.model';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  const cachedUser: User = {
    id: '1',
    firstName: 'Cached',
    lastName: 'User',
    email: 'cached@example.com',
    profilePicture: null,
  };

  const profileResponse: UserProfileResponse = {
    userId: '2',
    firstName: 'Farida',
    lastName: 'Khaled',
    email: 'farida@example.com',
    profilePicture: '/api/user/profile/picture',
  };

  let authServiceSpy: {
    getUser: ReturnType<typeof vi.fn>;
    getMe: ReturnType<typeof vi.fn>;
    saveUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
    updatePassword: ReturnType<typeof vi.fn>;
    updateProfilePicture: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceSpy = {
      getUser: vi.fn(),
      getMe: vi.fn(),
      saveUser: vi.fn(),
      logout: vi.fn(),
      clearSession: vi.fn(),
      updatePassword: vi.fn(),
      updateProfilePicture: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    authServiceSpy.getUser.mockReturnValue(cachedUser);
    authServiceSpy.getMe.mockReturnValue(of(profileResponse));
    authServiceSpy.logout.mockReturnValue(of({ message: 'Logged out successfully.' }));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  it('creates the profile page from the refreshed user profile', () => {
    const component = TestBed.createComponent(ProfileComponent).componentInstance;

    expect(component.user).toEqual({
      id: '2',
      firstName: 'Farida',
      lastName: 'Khaled',
      email: 'farida@example.com',
      profilePicture: '/api/user/profile/picture',
    });
    expect(authServiceSpy.saveUser).toHaveBeenCalled();
    expect(component.initials).toBe('FK');
  });

  it('navigates back to the home page', () => {
    const component = TestBed.createComponent(ProfileComponent).componentInstance;

    component.goBack();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('logs out, clears the session, and navigates to login on success', () => {
    const component = TestBed.createComponent(ProfileComponent).componentInstance;

    component.logout();

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('still clears the session and navigates to login when logout fails', () => {
    authServiceSpy.logout.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    const component = TestBed.createComponent(ProfileComponent).componentInstance;
    component.logout();

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});