import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { toUserFromProfileResponse } from '../../core/utils/auth-user.mapper';
import { SensorixLogoComponent } from '../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SensorixLogoComponent],
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

  constructor() {
    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profileResponse) => {
          this.currentUser = toUserFromProfileResponse(profileResponse);
          this.authService.saveUser(this.currentUser);
          this.displayName = this.currentUser.firstName;
          this.userInitials = this.getInitials(this.currentUser);
          this.profilePictureUrl = this.currentUser.profilePicture ?? '';
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
}
