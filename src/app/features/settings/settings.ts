import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { SettingsService, SaveThresholdSetting } from '../../core/services/settings.service';

import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { SettingsConfigurationPanelComponent } from './components/settings-configuration-panel.component';
import { SettingsThresholdsPanelComponent } from './components/settings-thresholds-panel.component';
import {
  createDefaultSensorCategories,
  createDefaultSensorConfiguration,
  SETTINGS_TABS,
  type SensorCategory,
  type SensorConfiguration,
  type SensorMetric,
  type SettingsTab,
  type Threshold,
} from './settings.types';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TopbarComponent,
    SettingsThresholdsPanelComponent,
    SettingsConfigurationPanelComponent,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabs = SETTINGS_TABS;
  readonly activeTab = signal<SettingsTab>('thresholds');
  readonly isDirty = signal(false);
  readonly categories = signal<SensorCategory[]>(createDefaultSensorCategories());
  readonly sensorConfig = signal<SensorConfiguration>(createDefaultSensorConfiguration());

  constructor() {
    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((settings) => {
        const defaultCats = createDefaultSensorCategories();
        
        settings.forEach((setting) => {
          let catId: string;
          if (setting.type === 'TRAFFIC') catId = 'traffic';
          else if (setting.type === 'AIR_POLLUTION') catId = 'air';
          else if (setting.type === 'STREET_LIGHT') catId = 'street';
          else return;

          let metId: string;
          if (setting.metric === 'TRAFFIC_DENSITY') metId = 'density';
          else if (setting.metric === 'AVG_SPEED') metId = 'speed';
          else if (setting.metric === 'CO') metId = 'co';
          else if (setting.metric === 'OZONE') metId = 'ozone';
          else if (setting.metric === 'BRIGHTNESS_LEVEL') metId = 'brightness';
          else if (setting.metric === 'POWER_CONSUMPTION') metId = 'power';
          else return;

          const category = defaultCats.find(c => c.id === catId);
          if (!category) return;
          
          const metric = category.metrics.find(m => m.id === metId);
          if (!metric) return;

          const condition = setting.alertType.toLowerCase() as 'above' | 'below';
          
          // If the default single threshold has no value, update it
          // Otherwise, find matching condition or add a new one
          const emptyDefault = metric.thresholds.find(t => t.value === null);
          const existingCondition = metric.thresholds.find(t => t.condition === condition);
          
          if (existingCondition) {
            existingCondition.value = setting.thresholdValue;
          } else if (emptyDefault) {
            emptyDefault.condition = condition;
            emptyDefault.value = setting.thresholdValue;
          } else {
            metric.thresholds.push({
              id: Math.random().toString(36).substring(2, 9),
              condition,
              value: setting.thresholdValue
            });
          }
        });

        // Sort thresholds so 'above' usually comes before 'below' visually
        defaultCats.forEach(cat => {
          cat.metrics.forEach(met => {
            met.thresholds.sort((a, b) => (a.condition === 'above' ? -1 : 1));
          });
        });

        this.categories.set(defaultCats);
      });
  }

  setActiveTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

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
    let hasErrors = false;
    const toSave: SaveThresholdSetting[] = [];

    for (const cat of this.categories()) {
      let type: string;
      if (cat.id === 'traffic') type = 'TRAFFIC';
      else if (cat.id === 'air') type = 'AIR_POLLUTION';
      else if (cat.id === 'street') type = 'STREET_LIGHT';
      else continue;

      for (const met of cat.metrics) {
        let metricName: string;
        if (met.id === 'density') metricName = 'TRAFFIC_DENSITY';
        else if (met.id === 'speed') metricName = 'AVG_SPEED';
        else if (met.id === 'co') metricName = 'CO';
        else if (met.id === 'ozone') metricName = 'OZONE';
        else if (met.id === 'brightness') metricName = 'BRIGHTNESS_LEVEL';
        else if (met.id === 'power') metricName = 'POWER_CONSUMPTION';
        else continue;

        for (const t of met.thresholds) {
          if (t.value !== null) {
            if (t.value < met.min || t.value > met.max) {
              hasErrors = true;
              break;
            }
            toSave.push({
              type,
              metric: metricName,
              thresholdValue: t.value,
              alertType: t.condition.toUpperCase()
            });
          }
        }
      }
    }

    if (hasErrors) {
      alert('Some threshold values are out of range. Please fix them before saving.');
      return;
    }

    this.settingsService.saveSettings(toSave).subscribe({
      next: () => {
        this.isDirty.set(false);
      },
      error: () => {
        alert('Failed to save settings. Please try again.');
      }
    });
  }

  enforceConstraint(metric: SensorMetric, changedThreshold: Threshold): void {
    if (metric.thresholds.length !== 2) {
      return;
    }

    const aboveThreshold = metric.thresholds.find((threshold) => threshold.condition === 'above');
    const belowThreshold = metric.thresholds.find((threshold) => threshold.condition === 'below');

    if (
      !aboveThreshold ||
      !belowThreshold ||
      aboveThreshold.value === null ||
      belowThreshold.value === null
    ) {
      return;
    }

    if (aboveThreshold.value <= belowThreshold.value) {
      if (changedThreshold.id === aboveThreshold.id) {
        aboveThreshold.value = belowThreshold.value + (Number.isInteger(belowThreshold.value) ? 1 : 0.01);
      } else {
        belowThreshold.value = aboveThreshold.value - (Number.isInteger(aboveThreshold.value) ? 1 : 0.01);
      }

      this.categories.update((categories) => [...categories]);
    }
  }

  toggleCondition(metric: SensorMetric, threshold: Threshold): void {
    if (metric.thresholds.length !== 1) {
      return;
    }

    threshold.condition = threshold.condition === 'above' ? 'below' : 'above';
    this.markDirty();
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
    this.markDirty();
  }

  removeThreshold(metric: SensorMetric, thresholdId: string): void {
    metric.thresholds = metric.thresholds.filter((threshold) => threshold.id !== thresholdId);
    this.markDirty();
  }
}