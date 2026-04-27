import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, User } from '../../../core/models/auth.models';
import { SensorixLogoComponent } from '../../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SensorixLogoComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

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

    this.authService.register(payload).subscribe({
      next: (response) => {
        const fallbackUser: User = {
          id: String(Date.now()),
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          profilePicture: payload.profilePicture,
        };
        this.authService.saveUser(response.user ?? fallbackUser);
        if (response.token) {
          this.authService.saveToken(response.token);
        }
        this.isLoading = false;
        alert('Account created successfully');
        this.router.navigate(['/home']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Registration failed. Please try again.';
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
