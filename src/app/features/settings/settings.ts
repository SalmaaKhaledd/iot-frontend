import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

export type ThresholdCondition = 'above' | 'below';

export interface Threshold {
  id: string;
  condition: ThresholdCondition;
  value: number | null;
}

export interface SensorMetric {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
  min: number;
  max: number;
  thresholds: Threshold[];
}

export interface SensorCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorClass: string;
  metrics: SensorMetric[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TopbarComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly router = inject(Router);

  readonly isDirty = signal(false);

  goHome(): void {
    this.router.navigate(['/home']);
  }

  canDeactivate(): boolean {
    if (this.isDirty()) {
      return window.confirm('You have unsaved changes. Do you want to leave without saving?');
    }
    return true;
  }

  markDirty(): void {
    this.isDirty.set(true);
  }

  saveChanges(): void {
    this.isDirty.set(false);
    // Real app would make an API call here.
  }

  readonly categories = signal<SensorCategory[]>([
    {
      id: 'traffic',
      title: 'Traffic Threshold',
      description: 'Set limits for traffic monitoring',
      icon: 'directions_car',
      colorClass: 'blue',
      metrics: [
        {
          id: 'density',
          label: 'Traffic Density',
          unit: 'Vehicles per minute',
          placeholder: 'Enter a value between 0 to 500',
          min: 0,
          max: 500,
          thresholds: [
            { id: 't1', condition: 'above', value: null },
          ],
        },
        {
          id: 'speed',
          label: 'Average Speed',
          unit: 'Kilometers per hour',
          placeholder: 'Enter a value between 0 to 120',
          min: 0,
          max: 120,
          thresholds: [{ id: 't3', condition: 'above', value: null }],
        },
      ],
    },
    {
      id: 'air',
      title: 'Air Pollution Threshold',
      description: 'Set limits for air quality monitoring',
      icon: 'air',
      colorClass: 'green',
      metrics: [
        {
          id: 'co',
          label: 'CO (Carbon Monoxide)',
          unit: 'Parts per million (ppm)',
          placeholder: 'Enter a value between 0 to 50',
          min: 0,
          max: 50,
          thresholds: [
            { id: 't4', condition: 'above', value: null },
          ],
        },
        {
          id: 'ozone',
          label: 'Ozone (O₃)',
          unit: 'Parts per billion (ppb)',
          placeholder: 'Enter a value between 0 to 300',
          min: 0,
          max: 300,
          thresholds: [{ id: 't6', condition: 'above', value: null }],
        },
      ],
    },
    {
      id: 'street',
      title: 'Street Light Threshold',
      description: 'Set limits for street light monitoring',
      icon: 'lightbulb',
      colorClass: 'yellow',
      metrics: [
        {
          id: 'brightness',
          label: 'Brightness Level',
          unit: 'Percentage (0-100%)',
          placeholder: 'Enter a value between 0 to 100',
          min: 0,
          max: 100,
          thresholds: [
            { id: 't7', condition: 'above', value: null },
          ],
        },
        {
          id: 'power',
          label: 'Power Consumption',
          unit: 'Watts (W)',
          placeholder: 'Enter a value between 0 to 5000',
          min: 0,
          max: 5000,
          thresholds: [{ id: 't9', condition: 'above', value: null }],
        },
      ],
    },
  ]);

  enforceConstraint(metric: SensorMetric, changedThreshold: Threshold): void {
    if (metric.thresholds.length !== 2) return;

    const aboveT = metric.thresholds.find(t => t.condition === 'above');
    const belowT = metric.thresholds.find(t => t.condition === 'below');

    if (!aboveT || !belowT || aboveT.value === null || belowT.value === null) return;

    if (aboveT.value <= belowT.value) {
      if (changedThreshold.id === aboveT.id) {
        aboveT.value = belowT.value + (Number.isInteger(belowT.value) ? 1 : 0.01);
      } else {
        belowT.value = aboveT.value - (Number.isInteger(aboveT.value) ? 1 : 0.01);
      }
      // Force change detection update for OnPush
      this.categories.update(cats => [...cats]);
    }
  }

  toggleCondition(metric: SensorMetric, threshold: Threshold): void {
    if (metric.thresholds.length === 1) {
      this.categories.update((cats) => {
        const t = this.findThreshold(cats, threshold.id);
        if (t) {
          t.condition = t.condition === 'above' ? 'below' : 'above';
          this.markDirty();
        }
        return [...cats];
      });
    }
  }

  addThreshold(metric: SensorMetric): void {
    if (metric.thresholds.length >= 2) return;

    // Automatically use the opposite condition of the existing one
    const existingCondition = metric.thresholds[0]?.condition || 'above';
    const newCondition = existingCondition === 'above' ? 'below' : 'above';

    this.categories.update((cats) => {
      const m = this.findMetric(cats, metric.id);
      if (m) {
        m.thresholds.push({
          id: Math.random().toString(36).substring(2, 9),
          condition: newCondition,
          value: null,
        });
        // Enforce that 'above' condition always stays on top
        m.thresholds.sort((a, b) => (a.condition === 'above' ? -1 : 1));
        this.markDirty();
      }
      return [...cats];
    });
  }

  removeThreshold(metric: SensorMetric, thresholdId: string): void {
    this.categories.update((cats) => {
      const m = this.findMetric(cats, metric.id);
      if (m) {
        m.thresholds = m.thresholds.filter((t) => t.id !== thresholdId);
        this.markDirty();
      }
      return [...cats];
    });
  }

  // Helper to mutate deeply nested state safely
  private findMetric(cats: SensorCategory[], metricId: string): SensorMetric | undefined {
    for (const cat of cats) {
      for (const m of cat.metrics) {
        if (m.id === metricId) return m;
      }
    }
    return undefined;
  }

  private findThreshold(cats: SensorCategory[], thresholdId: string): Threshold | undefined {
    for (const cat of cats) {
      for (const m of cat.metrics) {
        for (const t of m.thresholds) {
          if (t.id === thresholdId) return t;
        }
      }
    }
    return undefined;
  }
}
