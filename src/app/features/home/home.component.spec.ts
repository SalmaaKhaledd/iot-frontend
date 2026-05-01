import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth.service';
import type { User, UserProfileResponse } from '../../core/models/user.model';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
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
    profilePicture: 'data:image/png;base64,abc',
  };

  let router: Router;
  let authServiceSpy: {
    getUser: ReturnType<typeof vi.fn>;
    getMe: ReturnType<typeof vi.fn>;
    saveUser: ReturnType<typeof vi.fn>;
  };

  function createComponent(): HomeComponent {
    const fixture = TestBed.createComponent(HomeComponent);
    return fixture.componentInstance;
  }

  beforeEach(async () => {
    authServiceSpy = {
      getUser: vi.fn(),
      getMe: vi.fn(),
      saveUser: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy as unknown as AuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('refreshes user from getMe() and saves mapped user', () => {
    authServiceSpy.getUser.mockReturnValue(cachedUser);
    authServiceSpy.getMe.mockReturnValue(of(profileResponse));

    const component = createComponent();

    expect(component.displayName).toBe('Farida');
    expect(component.userInitials).toBe('FK');
    expect(component.profilePictureUrl).toBe('data:image/png;base64,abc');
    expect(component.refreshNotice).toBe('');
    expect(authServiceSpy.saveUser).toHaveBeenCalledWith({
      id: '2',
      firstName: 'Farida',
      lastName: 'Khaled',
      email: 'farida@example.com',
      profilePicture: 'data:image/png;base64,abc',
    });
  });

  it('keeps cached user and shows notice when getMe() fails with non-401', () => {
    authServiceSpy.getUser.mockReturnValue(cachedUser);
    authServiceSpy.getMe.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    const component = createComponent();

    expect(component.displayName).toBe('Cached');
    expect(component.userInitials).toBe('CU');
    expect(component.refreshNotice).toBe(
      'Could not refresh profile. Showing saved data.',
    );
    expect(authServiceSpy.saveUser).not.toHaveBeenCalled();
  });

  it('shows empty-state notice when getMe() fails and no cached user exists', () => {
    authServiceSpy.getUser.mockReturnValue(null);
    authServiceSpy.getMe.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    const component = createComponent();

    expect(component.displayName).toBe('User');
    expect(component.userInitials).toBe('U');
    expect(component.refreshNotice).toBe(
      'Could not load profile right now. Please try again.',
    );
  });

  it('does not show local notice for 401 errors', () => {
    authServiceSpy.getUser.mockReturnValue(cachedUser);
    authServiceSpy.getMe.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 })),
    );

    const component = createComponent();

    expect(component.refreshNotice).toBe('');
  });

  it('navigates to profile on goToProfile()', () => {
    authServiceSpy.getUser.mockReturnValue(cachedUser);
    authServiceSpy.getMe.mockReturnValue(of(profileResponse));
    const component = createComponent();

    component.goToProfile();

    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });
});
