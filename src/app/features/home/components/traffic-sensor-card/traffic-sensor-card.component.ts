import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type TrendPoint = {
  readonly time: string;
  readonly vehicles: number;
};

@Component({
  selector: 'app-traffic-sensor-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './traffic-sensor-card.component.html',
  styleUrl: './traffic-sensor-card.component.scss',
})
export class TrafficSensorCardComponent {
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
}
