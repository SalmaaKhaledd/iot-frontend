import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SensorDashboard } from '../sensor-dashboard/sensor-dashboard.component';
import { trafficDashboardConfig } from './traffic-dashboard-config';

@Component({
  selector: 'app-traffic-dashboard-page',
  standalone: true,
  imports: [SensorDashboard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-sensor-dashboard [config]="trafficDashboardConfig"></app-sensor-dashboard>`,
})
export class TrafficDashboardPageComponent {
  protected readonly trafficDashboardConfig = trafficDashboardConfig;
}
