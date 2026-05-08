import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AirQualityAlertsComponent } from '../air-quality-alerts/air-quality-alerts.component';

@Component({
  selector: 'app-air-quality-sensor-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, AirQualityAlertsComponent],
  templateUrl: './air-quality-sensor-card.component.html',
  styleUrl: './air-quality-sensor-card.component.scss',
})
export class AirQualitySensorCardComponent {
  readonly showAlerts = signal(false);
  // mock sensors
  readonly sensors = [
    {
      id: '3c8d6f1b-2f4a-4c9b-9f1d-1f3a8b6d2a2b',
      name: '3c8d6f1b-2f4a-4c9b-9f1d-1f3a8b6d2a2b',
      aqi: 215,
      pm25: 185,
      pm10: 210,
      co2: 520,
    },
    {
      id: '7b9e3c4d-1a2b-4c5d-9e6f-8a1b2c3d4e5f',
      name: '7b9e3c4d-1a2b-4c5d-9e6f-8a1b2c3d4e5f',
      aqi: 95,
      pm25: 68,
      pm10: 85,
      co2: 445,
    },
    {
      id: '5d41402a-b3d5-4c6a-9a7f-0b1c2d3e4f5a',
      name: '5d41402a-b3d5-4c6a-9a7f-0b1c2d3e4f5a',
      aqi: 48,
      pm25: 28,
      pm10: 42,
      co2: 410,
    },
  ] as const;

  readonly selectedSensor = signal(this.sensors[0].id);
  readonly selectedSensorData = computed(() =>
    this.sensors.find((s) => s.id === this.selectedSensor()) ?? this.sensors[0],
  );

  onSelectSensor(value: string): void {
    this.selectedSensor.set(value as any);
  }

  clampWidth(value: number): number {
    return Math.min(100, Math.max(0, Math.round(value)));
  }

  co2Width(value: number): number {
    // scale CO2 (ppm) roughly into percentage for bars (simple heuristic)
    return Math.min(100, Math.round(value / 6));
  }
}
