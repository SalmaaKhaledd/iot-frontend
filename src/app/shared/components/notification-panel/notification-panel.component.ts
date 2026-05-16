import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlertsService, ApiAlert } from '../../../core/services/alerts.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertToastComponent } from '../alert-toast/alert-toast.component';

export interface NotificationAlert {
  id: string;
  type: 'traffic' | 'air-quality' | 'street-light';
  typeIcon: string;
  typeLabel: string;
  severity: string;
  severityIcon: string;
  direction: 'ABOVE' | 'BELOW';
  title: string;
  message: string;
  report: string;
  time: string;
  isRead: boolean;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSnackBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss',
})
export class NotificationPanelComponent {
  private readonly alertsService = inject(AlertsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  readonly isOpen = signal(false);
  readonly expandedAlertId = signal<string | null>(null);
  private isInitialized = false;
  
  readonly alerts = signal<NotificationAlert[]>([]);
  readonly rawAlerts = signal<any>(null);
  readonly unreadCount = computed(() => this.alerts().filter((a: NotificationAlert) => !a.isRead).length);

  @Output() readonly jumpToAlert = new EventEmitter<{type: 'traffic' | 'air-quality' | 'street-light', alertId: string}>();

  constructor(private readonly elRef: ElementRef) {
    this.alertsService.alerts$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (apiAlerts: ApiAlert[]) => {
          this.rawAlerts.set(apiAlerts);
          const mappedAlerts = apiAlerts.map((a: ApiAlert) => this.mapToNotificationAlert(a));
          // Sort newest first
          mappedAlerts.sort((a: NotificationAlert, b: NotificationAlert) => new Date(b.time).getTime() - new Date(a.time).getTime());
          
          // Check for new alerts to show toast
          if (this.isInitialized) {
            const currentIds = new Set(this.alerts().map(a => a.id));
            const newAlerts = mappedAlerts.filter(a => !currentIds.has(a.id));
            
            newAlerts.forEach(alert => {
              this.snackBar.openFromComponent(AlertToastComponent, {
                data: {
                  title: alert.title,
                  message: alert.message,
                  type: alert.type,
                  severity: alert.severity,
                  icon: alert.typeIcon
                },
                duration: 5000,
                horizontalPosition: 'right',
                verticalPosition: 'top',
                panelClass: ['transparent-snackbar']
              });
            });
          } else {
            this.isInitialized = true;
          }

          this.alerts.set(mappedAlerts);
        },
        error: (err: unknown) => console.error('Failed to load alerts', err)
      });

    this.alertsService.alertDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((deletedId) => {
        this.alerts.update(alerts => alerts.filter(a => a.id !== deletedId));
      });
  }

  private formatDate(isoString: string): string {
    if (!isoString) return 'Unknown Time';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Unknown Time';
    
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
  }

  private mapToNotificationAlert(apiAlert: ApiAlert): NotificationAlert {
    try {
      const typeMap: Record<string, string> = {
        'TRAFFIC': 'traffic',
        'AIR_POLLUTION': 'air-quality',
        'STREET_LIGHT': 'street-light'
      };
      
      const typeStr = typeMap[apiAlert.sensorType] || 'traffic';
      const type = typeStr as 'traffic' | 'air-quality' | 'street-light';
      const severity: string = apiAlert.alertType === 'ABOVE' ? 'warning' : 'info';
      
      const metricName = (apiAlert.metric || 'Sensor').replace(/_/g, ' ');
      const isBelow = apiAlert.alertType === 'BELOW';
      const directionStr = isBelow ? 'BELOW' : 'ABOVE';
      const title = `${metricName} Alert`;
      const directionVerb = isBelow ? 'dropped below' : 'exceeded';
      const message = `${metricName} in ${apiAlert.location || 'Unknown Location'} ${directionVerb} threshold.`;
      const report = `${metricName} reached ${apiAlert.triggeredValue ?? 'N/A'} (Threshold: ${apiAlert.thresholdValue ?? 'N/A'}).`;

      let typeIcon = 'sensors';
      if (type === 'traffic') typeIcon = 'traffic';
      else if (type === 'air-quality') typeIcon = 'air';
      else if (type === 'street-light') typeIcon = 'lightbulb';

      let severityIcon = 'info';
      if (severity === 'warning') severityIcon = 'warning';
      else if (severity === 'critical') severityIcon = 'error';

      return {
        id: apiAlert.id || Math.random().toString(),
        type: type,
        typeIcon: typeIcon,
        typeLabel: type.replace(/-/g, ' ').toUpperCase(),
        severity: severity,
        severityIcon: severityIcon,
        direction: directionStr as 'ABOVE' | 'BELOW',
        title: title,
        message: message,
        report: report,
        time: this.formatDate(apiAlert.triggeredAt || new Date().toISOString()),
        isRead: false
      };
    } catch (e) {
      console.error("Error mapping alert", e, apiAlert);
      return {
        id: apiAlert?.id || Math.random().toString(),
        type: 'traffic',
        typeIcon: 'sensors',
        typeLabel: 'UNKNOWN',
        severity: 'info',
        severityIcon: 'info',
        direction: 'ABOVE',
        title: 'Data Error',
        message: 'Could not map alert data.',
        report: '',
        time: this.formatDate(new Date().toISOString()),
        isRead: false
      };
    }
  }

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

  navigateToAlert(alert: NotificationAlert): void {
    this.markAsRead(alert.id);
    const sensorMap: { [key: string]: string } = {
      traffic: 'traffic-sensor',
      'air-quality': 'air-quality-sensor',
      'street-light': 'street-light-sensor'
    };
    
    // Jump to the alert modal
    this.jumpToAlert.emit({type: alert.type, alertId: alert.id});
    const sensorId = sensorMap[alert.type];
    if (sensorId) {
      // Scroll to the sensor
      const element = document.getElementById(sensorId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Close notification panel
      this.close();
    }
  }

  markAsRead(alertId: string): void {
    this.alerts.update(alerts =>
      alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a)
    );
  }
}
