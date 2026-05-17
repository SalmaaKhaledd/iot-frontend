import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { AUTH_VALIDATION } from '../../../core/validation/auth-validation.constants';
import {
  authRules,
  passwordMatchValidator,
  profileImageError,
} from '../../../core/validation/auth-validators';
import { mapAuthError } from '../../../core/utils/auth-error';
import { toUserFromAuthResponse, toUserFromProfileResponse } from '../../../core/utils/auth-user.mapper';

import { SensorixLogoComponent } from '../../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SensorixLogoComponent,
    MatIconModule,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  @ViewChild('profilePictureInput')
  private profilePictureInput?: ElementRef<HTMLInputElement>;

  errorMessage = '';
  profilePictureError = '';
  selectedProfilePictureName = '';
  profilePicturePreviewUrl = '';
  isReadingProfilePicture = false;
  showPassword = false;
  showConfirmPassword = false;
  private selectedFile: File | null = null;
  private objectPreviewUrl: string | null = null;
  isLoading = signal(false);
  submitted = false;

  readonly signupForm = this.formBuilder.group(
    {
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(AUTH_VALIDATION.emailMaxLength),
        ],
      ],
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(AUTH_VALIDATION.nameMinLength),
          Validators.maxLength(AUTH_VALIDATION.nameMaxLength),
          Validators.pattern(authRules.namePattern),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(AUTH_VALIDATION.nameMinLength),
          Validators.maxLength(AUTH_VALIDATION.nameMaxLength),
          Validators.pattern(authRules.namePattern),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(AUTH_VALIDATION.passwordMinLength),
          Validators.maxLength(AUTH_VALIDATION.passwordMaxLength),
          Validators.pattern(authRules.strongPasswordPattern),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
      profilePicture: [''],
    },
    {
      validators: passwordMatchValidator(),
    },
  );

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.processProfileImageFile(file);
  }

  removeProfilePicture(): void {
    this.profilePictureError = '';
    this.selectedProfilePictureName = '';
    this.clearPreviewUrl();
    this.signupForm.patchValue({ profilePicture: '' });
    this.resetProfilePictureInput();
    this.changeDetectorRef.markForCheck();
  }

  private processProfileImageFile(file: File | undefined): void {
    this.profilePictureError = '';
    this.isReadingProfilePicture = false;
    if (!file) {
      this.selectedFile = null;
      this.selectedProfilePictureName = '';
      this.clearPreviewUrl();
      this.resetProfilePictureInput();
      this.signupForm.patchValue({ profilePicture: '' });
      this.changeDetectorRef.markForCheck();
      return;
    }

    const imageError = profileImageError(file);
    if (imageError) {
      this.profilePictureError = imageError;
      this.selectedFile = null;
      this.selectedProfilePictureName = '';
      this.clearPreviewUrl();
      this.signupForm.patchValue({ profilePicture: '' });
      this.resetProfilePictureInput();
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.selectedFile = file;

    this.selectedProfilePictureName = file.name;
    this.clearPreviewUrl();
    this.objectPreviewUrl = URL.createObjectURL(file);
    this.profilePicturePreviewUrl = this.objectPreviewUrl;
    // We do not need to convert to base64 anymore
    this.signupForm.patchValue({ profilePicture: file.name });
    this.changeDetectorRef.markForCheck();
  }

  ngOnDestroy(): void {
    this.clearPreviewUrl();
  }

  private clearPreviewUrl(): void {
    if (this.objectPreviewUrl) {
      URL.revokeObjectURL(this.objectPreviewUrl);
      this.objectPreviewUrl = null;
    }
    this.profilePicturePreviewUrl = '';
  }

  private resetProfilePictureInput(): void {
    if (this.profilePictureInput?.nativeElement) {
      this.profilePictureInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    const normalizedEmail = (this.signupForm.controls.email.value ?? '').trim().toLowerCase();
    const normalizedFirstName = (this.signupForm.controls.firstName.value ?? '').trim();
    const normalizedLastName = (this.signupForm.controls.lastName.value ?? '').trim();
    const normalizedPicture = (this.signupForm.controls.profilePicture.value ?? '').trim();

    this.signupForm.patchValue({
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      profilePicture: normalizedPicture,
    });

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading.set(true);

    const formValue = this.signupForm.getRawValue();
    const payload: RegisterRequest = {
      email: (formValue.email ?? '').trim().toLowerCase(),
      firstName: (formValue.firstName ?? '').trim(),
      lastName: (formValue.lastName ?? '').trim(),
      password: formValue.password ?? '',
      // Note: Backend register does not accept a picture. 
      // We upload it immediately after successful login.
    };

    this.authService
      .register(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.authService.login(payload.email, payload.password)),
        switchMap((response) => {
          if (!response?.token || !response?.userId) {
            throw new Error('Invalid email or password. Please try again.');
          }
          this.authService.saveToken(response.token);
          
          // If a file was selected, upload it now
          if (this.selectedFile) {
            return this.authService.updateProfilePicture(this.selectedFile).pipe(
              switchMap(() => this.authService.getMe()),
              switchMap((profileResponse) => {
                this.authService.saveUser(toUserFromAuthResponse(response)); // Temporary
                this.authService.saveUser(toUserFromProfileResponse(profileResponse)); // Actual
                return [true];
              })
            );
          }
          
          // Otherwise, just save the basic user and continue
          this.authService.saveUser(toUserFromAuthResponse(response));
          return [true];
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (error: unknown) => {
          this.errorMessage = error instanceof Error && error.message.includes('Invalid email') 
            ? error.message 
            : mapAuthError(error);
        },
      });
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.signupForm.get(controlName);
    return Boolean(
      control && (control.touched || this.submitted) && control.hasError(errorName),
    );
  }

  hasPasswordMismatch(): boolean {
    return Boolean(
      this.signupForm.hasError('passwordMismatch') &&
        (this.signupForm.get('confirmPassword')?.touched || this.submitted),
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
