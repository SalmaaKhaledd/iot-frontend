import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface NotificationAlert {
  id: string;
  type: 'traffic' | 'air-quality' | 'street-light';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  report: string;
  time: string;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent {
  readonly isOpen = signal(false);
  readonly expandedAlertId = signal<string | null>(null);

  readonly alerts: NotificationAlert[] = [
    {
      id: 'alert-1',
      type: 'traffic',
      severity: 'warning',
      title: 'High Traffic Congestion',
      message: 'Main Street experiencing heavy traffic',
      report:
        'Traffic density has increased by 45% in the last hour. Average speed reduced to 25 km/h. Estimated clearance time: 30 minutes. Recommend alternative routes via Park Avenue.',
      time: '2 min ago',
    },
    {
      id: 'alert-2',
      type: 'air-quality',
      severity: 'critical',
      title: 'Poor Air Quality Detected',
      message: 'AQI reached unhealthy levels',
      report:
        'PM2.5 levels exceeded safe threshold at 85 μg/m³. CO₂ concentration at 480 ppm. Air quality index: 152 (Unhealthy). Recommendation: Limit outdoor activities and use air purifiers indoors.',
      time: '15 min ago',
    },
    {
      id: 'alert-3',
      type: 'street-light',
      severity: 'warning',
      title: 'Street Light Malfunction',
      message: 'SL-005 on Elm Street reported fault',
      report:
        'Street light SL-005 has failed diagnostic checks. Power consumption dropped to 0W. Last operational: 45 minutes ago. Maintenance team has been notified. Priority: Medium.',
      time: '45 min ago',
    },
    {
      id: 'alert-4',
      type: 'traffic',
      severity: 'info',
      title: 'Traffic Flow Normalized',
      message: 'Congestion cleared on Oak Boulevard',
      report:
        'Traffic conditions have returned to normal levels. Current vehicle count: 98 cars/min. Average speed: 52 km/h. Congestion level reduced to 28%. No further action required.',
      time: '1 hour ago',
    },
    {
      id: 'alert-5',
      type: 'air-quality',
      severity: 'info',
      title: 'Air Quality Improved',
      message: 'AQI back to moderate levels',
      report:
        'Air quality has improved significantly. Current AQI: 68 (Moderate). PM2.5: 32 μg/m³. Wind speed increased, helping disperse pollutants. Safe for normal outdoor activities.',
      time: '2 hours ago',
    },
  ];

  readonly unreadCount = this.alerts.filter(
    (a) => a.severity !== 'info'
  ).length;

  constructor(private readonly elRef: ElementRef) {}

  /** Close panel when clicking outside */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.expandedAlertId.set(null);
    }
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
    if (!this.isOpen()) {
      this.expandedAlertId.set(null);
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.expandedAlertId.set(null);
  }

  toggleReport(alertId: string): void {
    this.expandedAlertId.update((id) => (id === alertId ? null : alertId));
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  getTypeLabel(type: string): string {
    return type.replace('-', ' ').toUpperCase();
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'traffic':
        return 'traffic';
      case 'air-quality':
        return 'air';
      case 'street-light':
        return 'lightbulb';
      default:
        return 'sensors';
    }
  }
}
