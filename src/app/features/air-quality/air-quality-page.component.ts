import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SensorDashboard } from '../sensor-dashboard/sensor-dashboard.component';
import { airQualityConfig } from './air-quality.config';

@Component({
  selector: 'app-air-quality-page',
  standalone: true,
  imports: [SensorDashboard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-sensor-dashboard [config]="airQualityConfig"></app-sensor-dashboard>`,
})
export class AirQualityPageComponent {
  protected readonly airQualityConfig = airQualityConfig;
} 
