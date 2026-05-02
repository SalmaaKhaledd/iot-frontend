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
import {
  stripDataUrlPrefix,
  toRenderablePicture,
} from '../../core/utils/profile-picture';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { AUTH_VALIDATION } from '../../core/validation/auth-validation.constants';
import { authRules, profileImageError } from '../../core/validation/auth-validators';

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
  /** Inline error rendered next to the avatar (validator + picture API failures). */
  profilePictureError = '';
  /**
   * Object URL shown as an optimistic preview while the picture upload is in flight.
   * Reverts to the saved `user.profilePicture` if the upload fails.
   */
  pendingPreviewUrl: string | null = null;
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
    // Make sure any in-flight optimistic preview URL is released when the
    // component is destroyed (avoids leaking blob URLs across navigations).
    this.destroyRef.onDestroy(() => this.clearPendingPreview());
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

  /** Renderable `<img>` src for the saved picture (raw base64 + prefix). */
  get profilePictureSrc(): string {
    return toRenderablePicture(this.user?.profilePicture);
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
    // Always reset the input so picking the same file again still fires `change`.
    input.value = '';

    this.profilePictureError = '';
    this.errorMessage = '';
    this.successMessage = '';

    if (!file) {
      this.cdr.markForCheck();
      return;
    }

    const validationError = profileImageError(file);
    if (validationError) {
      this.profilePictureError = validationError;
      this.cdr.markForCheck();
      return;
    }

    // Show the picked image immediately via an object URL so the user sees the
    // change before the API call resolves. The URL is revoked on success/error
    // and on component destroy.
    this.clearPendingPreview();
    this.pendingPreviewUrl = URL.createObjectURL(file);
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        this.profilePictureError =
          'Could not read this image. Please try a different file.';
        this.clearPendingPreview();
        this.cdr.markForCheck();
        return;
      }
      this.uploadProfilePicture(result);
    };
    reader.onerror = () => {
      this.profilePictureError =
        'Could not read this image. Please try a different file.';
      this.clearPendingPreview();
      this.cdr.markForCheck();
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
    // Contract: send raw base64. `FileReader.readAsDataURL` produces a data
    // URL, so we strip the prefix here and persist the same raw value the
    // server stores (so subsequent reads round-trip cleanly).
    const serverPicture = stripDataUrlPrefix(profilePicture);

    this.isUploadingPicture = true;
    this.cdr.markForCheck();

    this.authService
      .updateProfilePicture({ profilePicture: serverPicture })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isUploadingPicture = false;
          this.clearPendingPreview();
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (this.user) {
            this.user = { ...this.user, profilePicture: serverPicture };
            this.authService.saveUser(this.user);
          }
          this.successMessage = response.message;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          // Picture-specific failures (validation 400 from server) belong inline
          // next to the avatar; other failures fall back to the generic message.
          if (error instanceof HttpErrorResponse && error.status === 400) {
            this.profilePictureError = mapAuthError(error);
          } else {
            this.errorMessage = mapAuthError(error);
          }
          this.cdr.markForCheck();
        },
      });
  }

  private clearPendingPreview(): void {
    if (this.pendingPreviewUrl) {
      URL.revokeObjectURL(this.pendingPreviewUrl);
      this.pendingPreviewUrl = null;
    }
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
