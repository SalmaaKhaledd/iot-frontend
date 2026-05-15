import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { SensorCategory, SensorMetric, Threshold } from '../settings.types';

@Component({
  selector: 'app-settings-thresholds-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './settings-thresholds-panel.component.html',
  styleUrl: './settings-thresholds-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsThresholdsPanelComponent {
  readonly categories = input.required<SensorCategory[]>();
  readonly changed = output<void>();
  readonly isCompactView = signal(this.getCompactView());
  readonly focusedThresholdId = signal<string | null>(null);

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isCompactView.set(this.getCompactView());
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  onThresholdFocus(thresholdId: string): void {
    this.focusedThresholdId.set(thresholdId);
  }

  onThresholdBlur(): void {
    this.focusedThresholdId.set(null);
  }

  showPlaceholder(metric: SensorMetric, threshold: Threshold): boolean {
    return threshold.value === null && this.focusedThresholdId() !== threshold.id;
  }

  onThresholdValueChange(metric: SensorMetric, threshold: Threshold): void {
    this.enforceConstraint(metric, threshold);
    this.changed.emit();
  }

  toggleCondition(metric: SensorMetric, threshold: Threshold): void {
    if (metric.thresholds.length !== 1) {
      return;
    }

    threshold.condition = threshold.condition === 'above' ? 'below' : 'above';
    this.changed.emit();
  }

  addThreshold(metric: SensorMetric): void {
    if (metric.thresholds.length >= 2) {
      return;
    }

    const existingCondition = metric.thresholds[0]?.condition || 'above';
    const newCondition = existingCondition === 'above' ? 'below' : 'above';

    metric.thresholds.push({
      id: Math.random().toString(36).substring(2, 9),
      condition: newCondition,
      value: null,
    });

    metric.thresholds.sort((a, b) => (a.condition === 'above' ? -1 : 1));
    this.changed.emit();
  }

  removeThreshold(metric: SensorMetric, thresholdId: string): void {
    metric.thresholds = metric.thresholds.filter((threshold) => threshold.id !== thresholdId);
    this.changed.emit();
  }

  hasValueError(metric: SensorMetric, threshold: Threshold): boolean {
    return threshold.value !== null && (threshold.value < metric.min || threshold.value > metric.max);
  }

  placeholderFor(metric: SensorMetric): string {
    return this.isCompactView() ? `${metric.min} - ${metric.max}` : metric.placeholder;
  }

  private enforceConstraint(metric: SensorMetric, changedThreshold: Threshold): void {
    if (metric.thresholds.length !== 2) {
      return;
    }

    const aboveThreshold = metric.thresholds.find((threshold) => threshold.condition === 'above');
    const belowThreshold = metric.thresholds.find((threshold) => threshold.condition === 'below');

    if (!aboveThreshold || !belowThreshold || aboveThreshold.value === null || belowThreshold.value === null) {
      return;
    }

    if (aboveThreshold.value <= belowThreshold.value) {
      if (changedThreshold.id === aboveThreshold.id) {
        aboveThreshold.value = belowThreshold.value + (Number.isInteger(belowThreshold.value) ? 1 : 0.01);
      } else {
        belowThreshold.value = aboveThreshold.value - (Number.isInteger(aboveThreshold.value) ? 1 : 0.01);
      }
    }
  }

  private getCompactView(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  }
}