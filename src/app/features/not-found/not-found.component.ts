import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { SensorixLogoComponent } from '../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SensorixLogoComponent, MatIconModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  /**
   * Sends the user somewhere safe: the home page when they have a session,
   * otherwise the login page. This keeps the wildcard route useful for both
   * authenticated and anonymous visitors.
   */
  goSomewhereSafe(): void {
    const target = this.authService.getToken() ? '/home' : '/login';
    void this.router.navigate([target]);
  }

  get primaryActionLabel(): string {
    return this.authService.getToken() ? 'Go to home' : 'Go to login';
  }
}
