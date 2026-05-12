import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StreetLightAlertsComponent } from '../street-light-alerts/street-light-alerts.component';

type StreetLightItem = {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly brightnessLevel: number;
  readonly powerConsumption: number;
  readonly status: 'ON' | 'OFF';
};

@Component({
  selector: 'app-street-light-card',
  standalone: true,
  imports: [MatIconModule, StreetLightAlertsComponent],
  templateUrl: './street-light-card.component.html',
  styleUrl: './street-light-card.component.scss',
})
export class StreetLightCardComponent {
  readonly showAlerts = signal(false);
  readonly lights = signal<StreetLightItem[]>([
    {
      id: 'SL-001',
      location: 'Main Street',
      timestamp: '2026-05-12T08:15:00',
      brightnessLevel: 85,
      powerConsumption: 42.5,
      status: 'ON',
    },
    {
      id: 'SL-002',
      location: 'Park Avenue',
      timestamp: '2026-05-12T08:20:00',
      brightnessLevel: 70,
      powerConsumption: 34,
      status: 'ON',
    },
    {
      id: 'SL-003',
      location: 'Oak Boulevard',
      timestamp: '2026-05-12T08:22:00',
      brightnessLevel: 0,
      powerConsumption: 0,
      status: 'OFF',
    },
  ]);

  readonly totalLights = computed(() => this.lights().length);
  readonly lightsOn = computed(() => this.lights().filter((light) => light.status === 'ON').length);
  readonly lightsOff = computed(() => this.lights().filter((light) => light.status === 'OFF').length);
  readonly averageBrightness = computed(() => {
    const items = this.lights();
    return Math.round(items.reduce((total, light) => total + light.brightnessLevel, 0) / items.length);
  });
  readonly powerUsage = computed(() =>
    Math.round(this.lights().reduce((total, light) => total + light.powerConsumption, 0) * 10) / 10,
  );

  formatTimestamp(timestamp: string): string {
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsed);
  }
}
