import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth.service';
import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<SignupComponent>>;
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

    fixture = TestBed.createComponent(SignupComponent);
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

  it('clears profile picture state when removeProfilePicture is called', () => {
    component.profilePictureError = 'Some error';
    component.selectedProfilePictureName = 'avatar.png';
    component.profilePicturePreviewUrl = 'blob:preview';
    component.signupForm.patchValue({ profilePicture: 'data:image/png;base64,abc' });

    component.removeProfilePicture();

    expect(component.profilePictureError).toBe('');
    expect(component.selectedProfilePictureName).toBe('');
    expect(component.profilePicturePreviewUrl).toBe('');
    expect(component.signupForm.controls.profilePicture.value).toBe('');
  });

  it('shows friendly message when FileReader fails', () => {
    const originalFileReader = globalThis.FileReader;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    class MockFailingFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

      readAsDataURL(): void {
        this.onerror?.call(
          this as unknown as FileReader,
          new ProgressEvent('error') as unknown as ProgressEvent<FileReader>,
        );
      }
    }

    Object.defineProperty(globalThis, 'FileReader', {
      configurable: true,
      writable: true,
      value: MockFailingFileReader,
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(() => 'blob:preview'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });

    const file = new File(['hello'], 'avatar.png', { type: 'image/png' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [file] });

    component.onFileChange({ target: input } as unknown as Event);

    expect(component.profilePictureError).toBe(
      'Could not read this image. Please try a different file.',
    );
    expect(component.selectedProfilePictureName).toBe('');
    expect(component.profilePicturePreviewUrl).toBe('');
    expect(component.signupForm.controls.profilePicture.value).toBe('');
    expect(component.isReadingProfilePicture).toBe(false);

    Object.defineProperty(globalThis, 'FileReader', {
      configurable: true,
      writable: true,
      value: originalFileReader,
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL,
    });
  });

  it('shows remove button when preview exists and resets UI after removing', () => {
    component.profilePicturePreviewUrl = 'blob:preview';
    component.selectedProfilePictureName = 'avatar.png';
    component.signupForm.patchValue({ profilePicture: 'data:image/png;base64,abc' });
    fixture.detectChanges();

    const removeButton = fixture.nativeElement.querySelector(
      '.upload-remove',
    ) as HTMLButtonElement | null;
    expect(removeButton).not.toBeNull();

    removeButton?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Click to upload');
    expect(fixture.nativeElement.querySelector('.upload-remove')).toBeNull();
  });

  it('toggles password and confirm password visibility states', () => {
    expect(component.showPassword).toBe(false);
    expect(component.showConfirmPassword).toBe(false);

    component.togglePasswordVisibility();
    component.toggleConfirmPasswordVisibility();

    expect(component.showPassword).toBe(true);
    expect(component.showConfirmPassword).toBe(true);
  });

  it('updates password input types in the rendered template', () => {
    fixture.detectChanges();

    const passwordInput = fixture.nativeElement.querySelector(
      '#password',
    ) as HTMLInputElement | null;
    const confirmPasswordInput = fixture.nativeElement.querySelector(
      '#confirmPassword',
    ) as HTMLInputElement | null;
    const toggles = fixture.nativeElement.querySelectorAll(
      '.password-toggle',
    ) as NodeListOf<HTMLButtonElement>;

    expect(passwordInput).not.toBeNull();
    expect(confirmPasswordInput).not.toBeNull();
    expect(toggles.length).toBeGreaterThanOrEqual(2);

    expect(passwordInput?.type).toBe('password');
    expect(confirmPasswordInput?.type).toBe('password');

    toggles[0]?.click();
    toggles[1]?.click();
    fixture.detectChanges();

    expect(passwordInput?.type).toBe('text');
    expect(confirmPasswordInput?.type).toBe('text');
  });
});
