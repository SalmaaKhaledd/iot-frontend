import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SensorDashboard } from '../sensor-dashboard/sensor-dashboard.component';
import { streetLightConfig } from './street-light.config';

@Component({
  selector: 'app-street-light-page',
  standalone: true,
  imports: [SensorDashboard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-sensor-dashboard [config]="streetLightConfig"></app-sensor-dashboard>`,
})
export class StreetLightPageComponent {
  protected readonly streetLightConfig = streetLightConfig;
}
