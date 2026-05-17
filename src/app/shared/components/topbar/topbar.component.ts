import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  effect,
  DestroyRef,
  ChangeDetectorRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { buildProfilePictureUrl, hasProfilePicture } from '../../../core/utils/profile-picture';
import { ThemeService } from '../../../core/services/theme.service';
import { environment } from '../../../../environments/environment';
import { SensorixLogoComponent } from '../sensorix-logo/sensorix-logo.component';
import { NotificationPanelComponent } from '../notification-panel/notification-panel.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, SensorixLogoComponent, NotificationPanelComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  @Output() readonly jumpToAlert = new EventEmitter<{type: 'traffic' | 'air-quality' | 'street-light', alertId: string}>();

  /** Reactive current user shared by the auth service. */
  readonly currentUser = this.authService.currentUser;

  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';
    const first = user.firstName.trim().charAt(0) || '';
    const last = user.lastName.trim().charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  });

  activeBlobUrl: string | null = null;
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (!hasProfilePicture(user?.profilePicture)) {
        this.clearActiveBlobUrl();
        this.cdr.markForCheck();
        return;
      }

      const fullUrl = buildProfilePictureUrl(user?.profilePicture, environment.apiUrl);
      const cacheBustedUrl = `${fullUrl}?t=${new Date().getTime()}`;
      this.authService.fetchProfilePictureBlob(cacheBustedUrl).subscribe({
        next: (blob) => {
          this.clearActiveBlobUrl();
          this.activeBlobUrl = URL.createObjectURL(blob);
          this.cdr.markForCheck();
        },
        error: () => {
          this.clearActiveBlobUrl();
          this.cdr.markForCheck();
        }
      });
    });

    this.destroyRef.onDestroy(() => this.clearActiveBlobUrl());
  }

  private clearActiveBlobUrl(): void {
    if (this.activeBlobUrl) {
      URL.revokeObjectURL(this.activeBlobUrl);
      this.activeBlobUrl = null;
    }
  }

  onImageError(): void {
    this.clearActiveBlobUrl();
    this.cdr.markForCheck();
  }

  get profilePictureUrl(): string {
    return this.activeBlobUrl || '';
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  onJumpToAlert(event: {type: 'traffic' | 'air-quality' | 'street-light', alertId: string}): void {
    this.jumpToAlert.emit(event);
  }
}
