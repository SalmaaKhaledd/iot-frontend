import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { mapAuthError } from '../../core/utils/auth-error';
import { toUserFromProfileResponse } from '../../core/utils/auth-user.mapper';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  user: User | null = this.authService.getUser();
  isLoading = false;
  isUploadingPicture = false;
  isChangingPassword = false;
  errorMessage = '';
  successMessage = '';
  showPasswordModal = false;

  readonly passwordForm = this.formBuilder.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.refreshProfile();
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
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
  }

  onChangePassword(): void {
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

  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
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
    this.isLoading = true;
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
          this.user = toUserFromProfileResponse(profileResponse);
          this.authService.saveUser(this.user);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = mapAuthError(error);
          this.cdr.markForCheck();
        },
      });
  }
}
