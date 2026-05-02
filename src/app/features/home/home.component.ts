import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { toUserFromProfileResponse } from '../../core/utils/auth-user.mapper';
import { toRenderablePicture } from '../../core/utils/profile-picture';
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

  private readonly currentUser = signal<User | null>(this.authService.getUser());

  readonly displayName = computed(() => this.currentUser()?.firstName ?? 'User');
  readonly userInitials = computed(() => computeInitials(this.currentUser()));
  readonly profilePictureUrl = computed(() =>
    toRenderablePicture(this.currentUser()?.profilePicture),
  );
  readonly refreshNotice = signal('');

  constructor() {
    this.authService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profileResponse) => {
          this.refreshNotice.set('');
          this.applyUser(toUserFromProfileResponse(profileResponse));
        },
        error: (error: unknown) => {
          // 401 is handled globally by authInterceptor (logout + redirect).
          if (error instanceof HttpErrorResponse && error.status === 401) {
            return;
          }

          this.refreshNotice.set(
            this.currentUser()
              ? 'Could not refresh profile. Showing saved data.'
              : 'Could not load profile right now. Please try again.',
          );
        },
      });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  private applyUser(user: User): void {
    this.currentUser.set(user);
    this.authService.saveUser(user);
  }
}

function computeInitials(user: User | null): string {
  if (!user) {
    return 'U';
  }

  const firstInitial = user.firstName.trim().charAt(0) || '';
  const lastInitial = user.lastName.trim().charAt(0) || '';
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
}
