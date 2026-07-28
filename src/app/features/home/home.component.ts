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
import { SettingsService, type ThresholdSetting } from '../../core/services/settings.service';
import { User } from '../../core/models/user.model';
import { toUserFromProfileResponse } from '../../core/utils/auth-user.mapper';
import { ActivatedRoute, Router } from '@angular/router';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { TrafficSensorCardComponent } from './components/traffic-sensor-card/traffic-sensor-card.component';
import { AirQualitySensorCardComponent } from './components/air-quality-sensor-card/air-quality-sensor-card.component';
import { StreetLightCardComponent } from './components/street-light-card/street-light-card.component';
import type {
  AlertNavigationTarget,
  AlertNavigationType,
} from '../../shared/models/alert-navigation.model';

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
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(this.authService.getUser());

  readonly displayName = computed(() => this.currentUser()?.firstName ?? 'User');
  readonly refreshNotice = signal('');
  readonly showThresholdSetupBanner = signal(false);

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

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const openAlert = params['openAlert'] as AlertNavigationType | undefined;
      const alertId = params['alertId'] as string | undefined;

      if (openAlert && alertId) {
        // slight delay to ensure UI components are fully rendered before scrolling
        setTimeout(() => {
          this.handleJumpToAlert({ type: openAlert, alertId });
          
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { openAlert: null, alertId: null },
            queryParamsHandling: 'merge'
          });
        }, 100);
      }
    });

    this.settingsService
      .getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.showThresholdSetupBanner.set(!this.hasConfiguredThresholds(settings));
        },
        error: () => {
          this.showThresholdSetupBanner.set(false);
        },
      });
  }

  scrollToSensor(sensorId: string): void {
    const element = document.getElementById(sensorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Navigation from card in home to dashboard
  goToDashboard(type: 'traffic' | 'air-quality' | 'street-light'): void {
    this.router.navigate([`/${type}-dashboard`]);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  handleJumpToAlert(event: AlertNavigationTarget): void {
    const alertType = event.type;
    // Map alert type to sensor ID
    const sensorMap: { [key: string]: string } = {
      traffic: 'traffic-sensor',
      'air-quality': 'air-quality-sensor',
      'street-light': 'street-light-sensor',
    };

    const sensorId = sensorMap[alertType];
    if (sensorId) {
      this.scrollToSensor(sensorId);
      // Trigger alert opening through a custom event
      window.dispatchEvent(
        new CustomEvent('openSensorAlerts', {
          detail: { sensorType: alertType, alertId: event.alertId },
        })
      );
    }
  }

  private applyUser(user: User): void {
    this.currentUser.set(user);
    this.authService.saveUser(user);
  }

  private hasConfiguredThresholds(settings: ThresholdSetting[]): boolean {
    return settings.some((setting) => {
      const value = setting.thresholdValue;
      return value !== null && value !== undefined && Number.isFinite(Number(value));
    });
  }
}

