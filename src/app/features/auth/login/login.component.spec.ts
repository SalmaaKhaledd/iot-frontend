import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<LoginComponent>>;
  let router: Router;
  let authServiceSpy: {
    login: ReturnType<typeof vi.fn>;
    saveToken: ReturnType<typeof vi.fn>;
    saveUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceSpy = {
      login: vi.fn(),
      saveToken: vi.fn(),
      saveUser: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy as unknown as AuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('does not submit when form is invalid', () => {
    component.loginForm.patchValue({
      email: 'bad-email',
      password: 'short',
    });

    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('normalizes email and calls login for a valid form', () => {
    authServiceSpy.login.mockReturnValue(
      of({
        userId: '1',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        token: 'token',
        message: 'ok',
      }),
    );
    component.loginForm.patchValue({
      email: '  USER@Example.com ',
      password: 'StrongPassword1!',
    });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith(
      'user@example.com',
      'StrongPassword1!',
    );
    expect(authServiceSpy.saveToken).toHaveBeenCalledWith('token');
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('accepts a login password that does not match signup complexity rules', () => {
    component.loginForm.patchValue({
      email: 'user@example.com',
      password: 'simplepass',
    });

    expect(component.loginForm.controls.password.hasError('required')).toBe(false);
    expect(component.loginForm.controls.password.hasError('maxlength')).toBe(false);
    expect(component.loginForm.valid).toBe(true);
  });

  it('maps backend errors to a user-facing message', () => {
    authServiceSpy.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { message: 'Invalid email or password.' },
          }),
      ),
    );

    component.loginForm.patchValue({
      email: 'user@example.com',
      password: 'StrongPassword1!',
    });

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid email or password.');
  });

  it('toggles password visibility state', () => {
    expect(component.showPassword).toBe(false);

    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);

    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(false);
  });

  it('updates password input type in the rendered template', () => {
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '#password',
    ) as HTMLInputElement | null;
    const toggle = fixture.nativeElement.querySelector(
      '.password-toggle',
    ) as HTMLButtonElement | null;

    expect(input).not.toBeNull();
    expect(toggle).not.toBeNull();
    expect(input?.type).toBe('password');

    toggle?.click();
    fixture.detectChanges();
    expect(input?.type).toBe('text');

    toggle?.click();
    fixture.detectChanges();
    expect(input?.type).toBe('password');
  });
});
