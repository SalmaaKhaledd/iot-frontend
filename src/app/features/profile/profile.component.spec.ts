import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth.service';
import { ProfilePictureService } from '../../core/services/profile-picture.service';
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
    profilePicture: 'https://cdn.example.com/profile-pictures/user/avatar.jpeg',
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
  let profilePictureServiceSpy: {
    pictureUrl: ReturnType<typeof signal<string | null>>;
    loadError: ReturnType<typeof signal<string | null>>;
    invalidatePictureUrl: ReturnType<typeof vi.fn>;
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
    profilePictureServiceSpy = {
      pictureUrl: signal<string | null>(null),
      loadError: signal<string | null>(null),
      invalidatePictureUrl: vi.fn(),
    };
    routerSpy = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    authServiceSpy.getUser.mockReturnValue(cachedUser);
    authServiceSpy.getMe.mockReturnValue(of(profileResponse));
    authServiceSpy.logout.mockReturnValue(of({ message: 'Logged out successfully.' }));
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy as unknown as AuthService },
        {
          provide: ProfilePictureService,
          useValue: profilePictureServiceSpy as unknown as ProfilePictureService,
        },
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
      profilePicture: 'https://cdn.example.com/profile-pictures/user/avatar.jpeg',
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

  it('applies returned profile picture URL after upload without refreshing profile', () => {
    const updatedUrl = 'https://cdn.example.com/profile-pictures/user/new-avatar.jpeg';
    authServiceSpy.updateProfilePicture.mockReturnValue(
      of({
        message: 'Profile picture updated successfully.',
        profilePicture: updatedUrl,
      }),
    );
    const component = TestBed.createComponent(ProfileComponent).componentInstance;
    const saveUserCallCount = authServiceSpy.saveUser.mock.calls.length;
    const file = new File(['image'], 'avatar.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.onProfilePictureSelected({ target: input } as unknown as Event);

    expect(authServiceSpy.updateProfilePicture).toHaveBeenCalledWith(file);
    expect(component.user?.profilePicture).toBe(updatedUrl);
    expect(authServiceSpy.getMe).toHaveBeenCalledTimes(1);
    expect(authServiceSpy.saveUser).toHaveBeenCalledTimes(saveUserCallCount + 1);
    expect(authServiceSpy.saveUser).toHaveBeenLastCalledWith(
      expect.objectContaining({ profilePicture: updatedUrl }),
    );
  });
});
