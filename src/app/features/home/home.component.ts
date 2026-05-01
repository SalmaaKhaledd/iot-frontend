import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { toUserFromProfileResponse } from '../../core/utils/auth-user.mapper';
import { SensorixLogoComponent } from '../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SensorixLogoComponent, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private currentUser: User | null = this.authService.getUser();

  displayName = this.currentUser?.firstName ?? 'User';
  userInitials = this.getInitials(this.currentUser);
  profilePictureUrl = this.currentUser?.profilePicture ?? '';
  refreshNotice = '';

  constructor() {
    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profileResponse) => {
          this.refreshNotice = '';
          this.applyUser(toUserFromProfileResponse(profileResponse));
        },
        error: (error: unknown) => {
          // 401 is handled globally by authInterceptor (logout + redirect).
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return;
          }

          this.refreshNotice = this.currentUser
            ? 'Could not refresh profile. Showing saved data.'
            : 'Could not load profile right now. Please try again.';
        },
      });
  }

  private getInitials(user: User | null): string {
    if (!user) {
      return 'U';
    }

    const firstInitial = user.firstName.trim().charAt(0) || '';
    const lastInitial = user.lastName.trim().charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  private applyUser(user: User): void {
    this.currentUser = user;
    this.authService.saveUser(user);
    this.displayName = user.firstName;
    this.userInitials = this.getInitials(user);
    this.profilePictureUrl = user.profilePicture ?? '';
  }
}
