import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { LoginRequest } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { SensorixLogoComponent } from '../../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SensorixLogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  errorMessage = '';
  isLoading = false;

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const payload = this.loginForm.getRawValue() as LoginRequest;

    //finalize is used to set the isLoading flag to false after the login request is complete
    this.authService
      .login(payload.email, payload.password)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          if (!response?.token || !response?.user) {
            this.errorMessage = 'Invalid email or password. Please try again.';
            return;
          }
          this.authService.saveToken(response.token);
          this.authService.saveUser(response.user);
          this.router.navigate(['/home']);
        },
        error: () => {
          this.errorMessage = 'Invalid email or password. Please try again.';
        },
      });
  }
}
