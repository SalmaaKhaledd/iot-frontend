import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';

import { LoginRequest } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { AUTH_VALIDATION } from '../../../core/validation/auth-validation.constants';
import { mapAuthError } from '../../../core/utils/auth-error';
import {
  toUserFromAuthResponse,
  toUserFromProfileResponse,
} from '../../../core/utils/auth-user.mapper';
import { SensorixLogoComponent } from '../../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SensorixLogoComponent, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  errorMessage = '';
  isLoading = false;
  showPassword = false;

  readonly loginForm = this.formBuilder.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(AUTH_VALIDATION.emailMaxLength),
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.maxLength(AUTH_VALIDATION.passwordMaxLength),
      ],
    ],
  });

  onSubmit(): void {
    const normalizedEmail = (this.loginForm.controls.email.value ?? '').trim().toLowerCase();
    this.loginForm.controls.email.setValue(normalizedEmail);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const formValue = this.loginForm.getRawValue();
    const payload: LoginRequest = {
      email: (formValue.email ?? '').trim().toLowerCase(),
      password: formValue.password ?? '',
    };

    // finalize clears loading; markForCheck keeps OnPush in sync after HttpClient emits outside the submit event path.
    this.authService
      .login(payload.email, payload.password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((response) => {
          if (!response?.token || !response?.userId) {
            throw new Error('Invalid email or password. Please try again.');
          }

          this.authService.saveToken(response.token);
          return this.authService.getMe().pipe(
            catchError(() => {
              this.authService.saveUser(toUserFromAuthResponse(response));
              return of(null);
            }),
          );
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (profileResponse) => {
          if (profileResponse) {
            this.authService.saveUser(toUserFromProfileResponse(profileResponse));
          }

          this.settingsService
            .loadSensorConfig()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                void this.router.navigate(['/home']);
              },
              error: () => {
                void this.router.navigate(['/home']);
              },
            });
        },
        error: (error: unknown) => {
          this.errorMessage =
            error instanceof Error &&
            error.message === 'Invalid email or password. Please try again.'
              ? error.message
              : mapAuthError(error);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
