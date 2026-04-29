import { Component, inject } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { SensorixLogoComponent } from '../../shared/components/sensorix-logo/sensorix-logo.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SensorixLogoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly currentUser: User | null = this.authService.getUser();

  readonly displayName = this.currentUser?.firstName ?? 'User';
  readonly userInitials = this.getInitials(this.currentUser);

  private getInitials(user: User | null): string {
    if (!user) {
      return 'U';
    }

    const firstInitial = user.firstName.trim().charAt(0) || '';
    const lastInitial = user.lastName.trim().charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  }
}
