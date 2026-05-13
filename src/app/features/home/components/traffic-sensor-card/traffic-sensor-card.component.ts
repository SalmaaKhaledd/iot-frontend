import { Component, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TrafficAlertsComponent } from '../traffic-alerts/traffic-alerts.component';

type TrendPoint = {
  readonly time: string;
  readonly density: number;
};

type TrafficLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

type TrafficSensorItem = {
  readonly id: string;
  readonly location: string;
  readonly timestamp: string;
  readonly trafficDensity: number;
  readonly avgSpeed: number;
  readonly congestionLevel: TrafficLevel;
};

@Component({
  selector: 'app-traffic-sensor-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TrafficAlertsComponent],
  templateUrl: './traffic-sensor-card.component.html',
  styleUrl: './traffic-sensor-card.component.scss',
})
export class TrafficSensorCardComponent {
  readonly showAlerts = signal(false);
  readonly trendData: readonly TrendPoint[] = [
    { time: '6:00', density: 84 },
    { time: '7:00', density: 118 },
    { time: '8:00', density: 168 },
    { time: '9:00', density: 142 },
    { time: '10:00', density: 108 },
    { time: '11:00', density: 98 },
  ];

  readonly hoveredIndex = signal<number | null>(null);

  readonly maxDensity = computed(() => {
    const max = Math.max(...this.trendData.map(p => p.density));
    return Math.ceil(max / 10) * 10; // Round up to nearest 10
  });

  getBarHeight(density: number): string {
    const percentage = (density / this.maxDensity()) * 100;
    return percentage + '%';
  }

  @HostListener('window:openSensorAlerts', ['$event'])
  onOpenSensorAlerts(event: Event): void {
    const customEvent = event as CustomEvent;
    if (customEvent.detail.sensorType === 'traffic') {
      this.showAlerts.set(true);
    }
  }
  readonly sensors = [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      location: 'Main Street & 5th Ave',
      timestamp: '2026-05-12T08:30:00',
      trafficDensity: 245,
      avgSpeed: 8.4,
      congestionLevel: 'Severe',
    },
    {
      id: '9c858901-8a57-4791-81fe-4c455b099bc9',
      location: 'Highway 101 Northbound',
      timestamp: '2026-05-12T09:10:00',
      trafficDensity: 185,
      avgSpeed: 35.2,
      congestionLevel: 'High',
    },
    {
      id: '6fa459ea-ee8a-3ca4-894e-db77e160355e',
      location: 'Oak Boulevard',
      timestamp: '2026-05-12T09:45:00',
      trafficDensity: 142,
      avgSpeed: 28.1,
      congestionLevel: 'Moderate',
    },
  ] as const;
  
  readonly selectedSensor = signal(this.sensors[0].id);
  readonly selectedSensorData = computed(() =>
    this.sensors.find((s) => s.id === this.selectedSensor()) ?? this.sensors[0],
  );

  onSelectSensor(value: string): void {
    this.selectedSensor.set(value as any);
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
