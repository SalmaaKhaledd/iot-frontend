import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TrafficAlertsComponent } from '../traffic-alerts/traffic-alerts.component';

type TrendPoint = {
  readonly time: string;
  readonly vehicles: number;
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
  readonly yTicks = [0, 45, 90, 135, 180] as const;
  readonly trendData: readonly TrendPoint[] = [
    { time: '6:00', vehicles: 84 },
    { time: '7:00', vehicles: 118 },
    { time: '8:00', vehicles: 168 },
    { time: '9:00', vehicles: 142 },
    { time: '10:00', vehicles: 108 },
    { time: '11:00', vehicles: 98 },
  ];

  readonly hoveredIndex = signal<number | null>(null);
  readonly tooltipX = signal(0);
  readonly tooltipY = signal(0);

  
  // Multiple mock sensors and selection
  readonly sensors = [
    {
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      name: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      vehicleCount: 245,
      avgSpeed: 8,
      congestionLevel: 95,
    },
    {
      id: '9c858901-8a57-4791-81fe-4c455b099bc9',
      name: '9c858901-8a57-4791-81fe-4c455b099bc9',
      vehicleCount: 185,
      avgSpeed: 35,
      congestionLevel: 72,
    },
    {
      id: '6fa459ea-ee8a-3ca4-894e-db77e160355e',
      name: '6fa459ea-ee8a-3ca4-894e-db77e160355e',
      vehicleCount: 142,
      avgSpeed: 28,
      congestionLevel: 58,
    },
  ] as const;
  
  readonly selectedSensor = signal(this.sensors[0].id);
  readonly selectedSensorData = computed(() =>
    this.sensors.find((s) => s.id === this.selectedSensor()) ?? this.sensors[0],
  );
  private readonly minValue = 0;
  private readonly maxValue = 180;
  private readonly xStart = 70;
  private readonly xEnd = 1000;
  private readonly yTop = 22;
  private readonly yBottom = 220;

  readonly pointCoords = computed(() => {
    const step = (this.xEnd - this.xStart) / (this.trendData.length - 1);
    return this.trendData.map((point, index) => ({
      ...point,
      x: this.xStart + index * step,
      y: this.yFor(point.vehicles),
    }));
  });

  readonly linePath = computed(() =>
    this.pointCoords()
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
      .join(' '),
  );

  readonly hoveredPoint = computed(() => {
    const index = this.hoveredIndex();
    if (index === null) {
      return null;
    }

    return this.pointCoords()[index] ?? null;
  });

  yFor(value: number): number {
    const clamped = Math.min(this.maxValue, Math.max(this.minValue, value));
    const ratio = (clamped - this.minValue) / (this.maxValue - this.minValue);
    return this.yBottom - ratio * (this.yBottom - this.yTop);
  }

  onChartMove(event: MouseEvent, svg: Element): void {
    const rect = svg.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const projectedX = this.xStart + relativeX * (this.xEnd - this.xStart);

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.pointCoords().forEach((point, index) => {
      const distance = Math.abs(point.x - projectedX);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const activePoint = this.pointCoords()[nearestIndex];
    this.hoveredIndex.set(nearestIndex);
    this.tooltipX.set((activePoint.x / 1040) * rect.width);
    this.tooltipY.set((activePoint.y / 260) * rect.height);
  }

  onChartLeave(): void {
    this.hoveredIndex.set(null);
  }
  
  onSelectSensor(value: string): void {
    this.selectedSensor.set(value as any);
  }
}
