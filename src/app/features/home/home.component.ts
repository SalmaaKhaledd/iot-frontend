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

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { toUserFromProfileResponse } from '../../core/utils/auth-user.mapper';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { TrafficSensorCardComponent } from './components/traffic-sensor-card/traffic-sensor-card.component';
import { AirQualitySensorCardComponent } from './components/air-quality-sensor-card/air-quality-sensor-card.component';
import { StreetLightCardComponent } from './components/street-light-card/street-light-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TopbarComponent, TrafficSensorCardComponent, AirQualitySensorCardComponent, StreetLightCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser = signal<User | null>(this.authService.getUser());

  readonly displayName = computed(() => this.currentUser()?.firstName ?? 'User');
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

  scrollToSensor(sensorId: string): void {
    const element = document.getElementById(sensorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private applyUser(user: User): void {
    this.currentUser.set(user);
    this.authService.saveUser(user);
  }
}

