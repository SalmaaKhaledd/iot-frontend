import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { mapAuthError } from '../../core/utils/auth-error';
import { toUserFromProfileResponse } from '../../core/utils/auth-user.mapper';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { AUTH_VALIDATION } from '../../core/validation/auth-validation.constants';
import { authRules } from '../../core/validation/auth-validators';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  @ViewChild('profilePictureInput')
  private profilePictureInput?: ElementRef<HTMLInputElement>;

  user: User | null = this.authService.getUser();
  /** Full-page loader only when there is no cached user to show. */
  isLoading = false;
  refreshNotice = '';
  isUploadingPicture = false;
  isChangingPassword = false;
  errorMessage = '';
  successMessage = '';
  showPasswordModal = false;
  showCurrentPassword = false;
  showNewPassword = false;
  passwordSubmitted = false;

  readonly passwordForm = this.formBuilder.group({
    currentPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(AUTH_VALIDATION.passwordMinLength),
        Validators.maxLength(AUTH_VALIDATION.passwordMaxLength),
      ],
    ],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(AUTH_VALIDATION.passwordMinLength),
        Validators.maxLength(AUTH_VALIDATION.passwordMaxLength),
        Validators.pattern(authRules.strongPasswordPattern),
      ],
    ],
  });

  constructor() {
    this.refreshProfile();
  }

  goBack(): void {
    void this.router.navigate(['/home']);
  }

  get initials(): string {
    if (!this.user) {
      return 'U';
    }
    return `${this.user.firstName.charAt(0)}${this.user.lastName.charAt(0)}`.toUpperCase();
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordSubmitted = false;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
    this.passwordSubmitted = false;
    this.showCurrentPassword = false;
    this.showNewPassword = false;
  }

  onChangePassword(): void {
    this.passwordSubmitted = true;
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isChangingPassword = true;

    this.authService
      .updatePassword(this.passwordForm.getRawValue() as { currentPassword: string; newPassword: string })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isChangingPassword = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.closePasswordModal();
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = mapAuthError(error);
          this.cdr.markForCheck();
        },
      });
  }

  hasPasswordError(controlName: 'currentPassword' | 'newPassword', errorName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return Boolean(
      control && (control.touched || this.passwordSubmitted) && control.hasError(errorName),
    );
  }

  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        return;
      }
      this.uploadProfilePicture(result);
    };
    reader.readAsDataURL(file);
  }

  openProfilePicturePicker(): void {
    if (this.isUploadingPicture) {
      return;
    }
    this.profilePictureInput?.nativeElement.click();
  }

  private uploadProfilePicture(profilePicture: string): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isUploadingPicture = true;

    this.authService
      .updateProfilePicture({ profilePicture })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isUploadingPicture = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (this.user) {
            this.user = { ...this.user, profilePicture };
            this.authService.saveUser(this.user);
          }
          this.successMessage = response.message;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = mapAuthError(error);
          this.cdr.markForCheck();
        },
      });
  }

  private refreshProfile(): void {
    const hadCachedUser = Boolean(this.user);
    this.refreshNotice = '';
    if (!hadCachedUser) {
      this.isLoading = true;
    }
    this.cdr.markForCheck();

    this.authService
      .getMe()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (profileResponse) => {
          this.refreshNotice = '';
          this.user = toUserFromProfileResponse(profileResponse);
          this.authService.saveUser(this.user);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return;
          }
          this.refreshNotice = this.user
            ? 'Could not refresh profile. Showing saved data.'
            : 'Could not load profile right now. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }
}
