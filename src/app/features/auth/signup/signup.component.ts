import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { mapAuthError } from '../../../core/utils/auth-error';
import { toUserFromAuthResponse } from '../../../core/utils/auth-user.mapper';
import { SensorixLogoComponent } from '../../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SensorixLogoComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  errorMessage = '';
  isLoading = false;
  submitted = false;

  readonly signupForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    profilePicture: [''],
  });

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        this.signupForm.patchValue({ profilePicture: result });
      }
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const payload = this.signupForm.getRawValue() as RegisterRequest;

    this.authService
      .register(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.authService.login(payload.email, payload.password)),
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

  hasError(controlName: string, errorName: string): boolean {
    const control = this.signupForm.get(controlName);
    return Boolean(
      control && (control.touched || this.submitted) && control.hasError(errorName),
    );
  }
}
