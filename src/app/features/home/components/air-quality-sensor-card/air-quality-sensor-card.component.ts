import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AirQualityAlertsComponent } from '../air-quality-alerts/air-quality-alerts.component';

type PollutionLevel = 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy';

type AirSensorItem = {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly pm2_5: number;
  readonly pm10: number;
  readonly co: number;
  readonly ozone: number;
  readonly no2: number;
  readonly so2: number;
  readonly pollutionLevel: PollutionLevel;
};

@Component({
  selector: 'app-air-quality-sensor-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, AirQualityAlertsComponent],
  templateUrl: './air-quality-sensor-card.component.html',
  styleUrl: './air-quality-sensor-card.component.scss',
})
export class AirQualitySensorCardComponent {
  readonly showAlerts = signal(false);
  readonly sensors: readonly AirSensorItem[] = [
    {
      id: '3c8d6f1b-2f4a-4c9b-9f1d-1f3a8b6d2a2b',
      location: 'Main Street',
      timestamp: '2026-05-12T08:44:00',
      pm2_5: 286.4,
      pm10: 412.9,
      co: 18.4,
      ozone: 126,
      no2: 248,
      so2: 92,
      pollutionLevel: 'Very Unhealthy',
    },
    {
      id: '7b9e3c4d-1a2b-4c5d-9e6f-8a1b2c3d4e5f',
      location: 'Downtown Plaza',
      timestamp: '2026-05-12T09:12:00',
      pm2_5: 98.2,
      pm10: 176.5,
      co: 9.6,
      ozone: 78,
      no2: 114,
      so2: 39,
      pollutionLevel: 'Moderate',
    },
    {
      id: '5d41402a-b3d5-4c6a-9a7f-0b1c2d3e4f5a',
      location: 'Riverside Park',
      timestamp: '2026-05-12T09:38:00',
      pm2_5: 22.7,
      pm10: 44.1,
      co: 3.8,
      ozone: 44,
      no2: 21,
      so2: 9,
      pollutionLevel: 'Good',
    },
  ] as const;

  readonly selectedSensor = signal(this.sensors[0].id);
  readonly selectedSensorData = computed<AirSensorItem>(() =>
    this.sensors.find((s) => s.id === this.selectedSensor()) ?? this.sensors[0],
  );

  readonly ringDashOffset = computed(() => {
    const sensor = this.selectedSensorData();
    const normalized = Math.min(
      100,
      Math.round(
        (sensor.pm2_5 / 1000) * 25 +
          (sensor.pm10 / 1000) * 20 +
          (sensor.co / 50) * 15 +
          (sensor.ozone / 300) * 15 +
          (sensor.no2 / 500) * 13 +
          (sensor.so2 / 500) * 12,
      ),
    );
    return 553 - Math.round((normalized / 100) * 553);
  });

  readonly recommendationText = computed(() => {
    switch (this.selectedSensorData().pollutionLevel) {
      case 'Good':
        return 'Air quality is good. Outdoor activity is safe for most people.';
      case 'Moderate':
        return 'Air quality is moderate. Sensitive individuals should stay cautious.';
      case 'Unhealthy':
        return 'Air quality is unhealthy. Limit prolonged outdoor exposure.';
      default:
        return 'Air quality is very unhealthy. Avoid outdoor activity where possible.';
    }
  });

  onSelectSensor(value: string): void {
    this.selectedSensor.set(value as any);
  }

  coWidth(value: number): number {
    return Math.min(100, Math.round((value / 50) * 100));
  }

  ozoneWidth(value: number): number {
    return Math.min(100, Math.round((value / 300) * 100));
  }

  particulateWidth(value: number): number {
    return Math.min(100, Math.round((value / 1000) * 100));
  }

  gasWidth(value: number): number {
    return Math.min(100, Math.round((value / 500) * 100));
  }

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
