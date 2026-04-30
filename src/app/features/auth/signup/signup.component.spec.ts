import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth.service';
import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let router: Router;
  let authServiceSpy: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    saveToken: ReturnType<typeof vi.fn>;
    saveUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceSpy = {
      register: vi.fn(),
      login: vi.fn(),
      saveToken: vi.fn(),
      saveUser: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy as unknown as AuthService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('does not submit when form is invalid', () => {
    component.signupForm.patchValue({
      email: 'bad-email',
      firstName: 'A',
      lastName: '',
      password: 'weak',
      confirmPassword: 'weak',
    });

    component.onSubmit();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('rejects password confirmation mismatch', () => {
    component.signupForm.patchValue({
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'StrongPassword1!',
      confirmPassword: 'StrongPassword2!',
    });

    expect(component.signupForm.hasError('passwordMismatch')).toBe(true);
  });

  it('rejects weak passwords under the strong policy', () => {
    component.signupForm.patchValue({
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'NoSymbol1234',
      confirmPassword: 'NoSymbol1234',
    });

    expect(component.signupForm.controls.password.hasError('pattern')).toBe(true);
    expect(component.signupForm.valid).toBe(false);
  });

  it('normalizes signup payload and chains register -> login', () => {
    authServiceSpy.register.mockReturnValue(
      of({
        userId: '1',
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        message: 'created',
      }),
    );
    authServiceSpy.login.mockReturnValue(
      of({
        userId: '1',
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        token: 'token',
        message: 'ok',
      }),
    );
    component.signupForm.patchValue({
      email: '  USER@Example.com ',
      firstName: '  Jane  ',
      lastName: '  Doe  ',
      password: 'StrongPassword1!',
      confirmPassword: 'StrongPassword1!',
      profilePicture: '  data:image/png;base64,abc  ',
    });

    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith({
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      password: 'StrongPassword1!',
      profilePicture: 'data:image/png;base64,abc',
    });
    expect(authServiceSpy.login).toHaveBeenCalledWith(
      'user@example.com',
      'StrongPassword1!',
    );
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('rejects unsupported profile image types', () => {
    const file = new File(['hello'], 'avatar.txt', { type: 'text/plain' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.onFileChange({ target: input } as unknown as Event);

    expect(component.profilePictureError).toContain('Only JPG, PNG, or WEBP');
  });

  it('rejects profile images larger than 1MB', () => {
    const largeFile = new File([new Uint8Array(1_048_577)], 'avatar.png', {
      type: 'image/png',
    });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [largeFile] });

    component.onFileChange({ target: input } as unknown as Event);

    expect(component.profilePictureError).toBe(
      'Profile picture must be 1MB or smaller.',
    );
  });
});
