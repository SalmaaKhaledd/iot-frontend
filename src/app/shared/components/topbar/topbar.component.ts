import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { toRenderablePicture } from '../../../core/utils/profile-picture';
import { ThemeService } from '../../../core/services/theme.service';
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

  readonly profilePictureUrl = computed(() =>
    toRenderablePicture(this.currentUser()?.profilePicture),
  );

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
