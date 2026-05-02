import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { LoginRequest } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { AUTH_VALIDATION } from '../../../core/validation/auth-validation.constants';
import { mapAuthError } from '../../../core/utils/auth-error';
import { toUserFromAuthResponse } from '../../../core/utils/auth-user.mapper';
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

    //finalize is used to set the isLoading flag to false after the login request is complete
    this.authService
      .login(payload.email, payload.password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (response) => {
          if (!response?.token || !response?.userId) {
            this.errorMessage = 'Invalid email or password. Please try again.';
            return;
          }

          this.authService.saveToken(response.token);
          this.authService.saveUser(toUserFromAuthResponse(response));
          this.router.navigate(['/home']);
        },
        error: (error: unknown) => {
          this.errorMessage = mapAuthError(error);
        },
      });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
