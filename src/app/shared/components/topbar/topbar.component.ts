import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
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

  /** Reactive snapshot of the current user from local storage. */
  readonly currentUser = signal<User | null>(this.authService.getUser());

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

  /** Allow parent components to refresh the user data shown in the topbar. */
  refreshUser(user: User): void {
    this.currentUser.set(user);
  }
}
