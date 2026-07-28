import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { defer, forkJoin, of, Observable } from 'rxjs';
import { defaultIfEmpty, switchMap } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

import {
  SettingsService,
  type SaveThresholdSetting,
  type ThresholdSetting,
} from '../../core/services/settings.service';

import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import type { AlertNavigationTarget } from '../../shared/models/alert-navigation.model';
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

interface ThresholdSavePlan {
  hasErrors: boolean;
  retainedApiIds: Set<string>;
  toSave: SaveThresholdSetting[];
}

const CATEGORY_ID_BY_SENSOR_TYPE: Record<string, string> = {
  TRAFFIC: 'traffic',
  AIR_POLLUTION: 'air',
  STREET_LIGHT: 'street',
};

const SENSOR_TYPE_BY_CATEGORY_ID: Record<string, string> = {
  traffic: 'TRAFFIC',
  air: 'AIR_POLLUTION',
  street: 'STREET_LIGHT',
};

const METRIC_ID_BY_API_NAME: Record<string, string> = {
  TRAFFIC_DENSITY: 'density',
  AVG_SPEED: 'speed',
  CO: 'co',
  OZONE: 'ozone',
  BRIGHTNESS_LEVEL: 'brightness',
  POWER_CONSUMPTION: 'power',
};

const API_NAME_BY_METRIC_ID: Record<string, string> = {
  density: 'TRAFFIC_DENSITY',
  speed: 'AVG_SPEED',
  co: 'CO',
  ozone: 'OZONE',
  brightness: 'BRIGHTNESS_LEVEL',
  power: 'POWER_CONSUMPTION',
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TopbarComponent,
    SettingsThresholdsPanelComponent,
    SettingsConfigurationPanelComponent,
    MatDialogModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  readonly tabs = SETTINGS_TABS;
  readonly activeTab = signal<SettingsTab>('thresholds');
  readonly isDirty = signal(false);
  readonly categories = signal<SensorCategory[]>(createDefaultSensorCategories());
  readonly sensorConfig = signal<SensorConfiguration>(createDefaultSensorConfiguration());
  private readonly originalSensorConfig = signal<SensorConfiguration>(createDefaultSensorConfiguration());
  private readonly originalSettings = signal<ThresholdSetting[]>([]);
  readonly showSuccessMessage = signal(false);

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.settingsService.loadSensorConfig(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        this.sensorConfig.set({ ...config });
        this.originalSensorConfig.set({ ...config });
      });

    this.settingsService.getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((settings) => {
        const defaultCats = createDefaultSensorCategories();
        
        settings.forEach((setting) => {
          const catId = CATEGORY_ID_BY_SENSOR_TYPE[setting.type];
          const metId = METRIC_ID_BY_API_NAME[setting.metric];
          if (!catId || !metId) return;

          const category = defaultCats.find(c => c.id === catId);
          if (!category) return;
          
          const metric = category.metrics.find(m => m.id === metId);
          if (!metric) return;

          const condition = setting.alertType.toLowerCase() as Threshold['condition'];
          
          // If the default single threshold has no value, update it
          // Otherwise, find matching condition or add a new one
          const emptyDefault = metric.thresholds.find(t => t.value === null);
          const existingCondition = metric.thresholds.find(t => t.condition === condition);
          
          if (existingCondition) {
            existingCondition.value = setting.thresholdValue;
            existingCondition.apiId = setting.id;
            existingCondition.originalValue = setting.thresholdValue;
          } else if (emptyDefault) {
            emptyDefault.condition = condition;
            emptyDefault.value = setting.thresholdValue;
            emptyDefault.apiId = setting.id;
            emptyDefault.originalValue = setting.thresholdValue;
          } else {
            metric.thresholds.push({
              id: crypto.randomUUID().substring(0, 7),
              condition,
              value: setting.thresholdValue,
              apiId: setting.id,
              originalValue: setting.thresholdValue
            });
          }
        });

        // Sort thresholds so 'above' usually comes before 'below' visually
        defaultCats.forEach(cat => {
          cat.metrics.forEach(met => {
            met.thresholds.sort((a, b) => (a.condition === 'above' ? -1 : 1));
          });
        });

        this.originalSettings.set(settings);
        this.categories.set(defaultCats);
      });
  }

  setActiveTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.isDirty()) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave without saving?',
          confirmText: 'Leave',
          cancelText: 'Cancel'
        },
        width: '400px',
        disableClose: true
      });
      
      return dialogRef.afterClosed();
    }

    return true;
  }

  checkForChanges(): void {
    const { retainedApiIds, toSave } = this.buildThresholdSavePlan();
    const deletedThresholdExists = this.originalSettings()
      .some(setting => !retainedApiIds.has(setting.id));

    this.isDirty.set(toSave.length > 0 || deletedThresholdExists || this.hasSensorConfigChanges());
  }

  saveChanges(): void {
    const { hasErrors, retainedApiIds, toSave } = this.buildThresholdSavePlan();

    if (hasErrors) {
      alert('Please fix the threshold validation errors before saving.');
      return;
    }

    const deletedIds = this.originalSettings()
      .map(s => s.id)
      .filter(id => !retainedApiIds.has(id));

    const saveRequest = defer(() =>
      toSave.length > 0 ? this.settingsService.saveSettings(toSave).pipe(defaultIfEmpty(null)) : of(null),
    );
    const configRequest = defer(() =>
      this.settingsService.saveSensorConfig(this.sensorConfig()).pipe(defaultIfEmpty(null)),
    );

    this.deleteSettings(deletedIds).pipe(
      switchMap(() => forkJoin([saveRequest, configRequest])),
    ).subscribe({
      next: () => {
        this.originalSensorConfig.set({ ...this.sensorConfig() });
        this.isDirty.set(false);
        this.showSuccessMessage.set(true);
        setTimeout(() => this.showSuccessMessage.set(false), 3000);
        this.loadSettings();
      },
      error: () => {
        alert('Failed to save settings. Please try again.');
      }
    });
  }

  toggleCondition(metric: SensorMetric, threshold: Threshold): void {
    if (metric.thresholds.length !== 1) {
      return;
    }

    threshold.condition = threshold.condition === 'above' ? 'below' : 'above';
    this.checkForChanges();
  }

  addThreshold(metric: SensorMetric): void {
    if (metric.thresholds.length >= 2) {
      return;
    }

    const existingCondition = metric.thresholds[0]?.condition;
    const newCondition = existingCondition === 'above' ? 'below' : 'above';

    metric.thresholds.push({
      id: crypto.randomUUID().substring(0, 7),
      condition: newCondition,
      value: null,
    });

    metric.thresholds.sort((a, b) => (a.condition === 'above' ? -1 : 1));
    this.checkForChanges();
  }

  removeThreshold(metric: SensorMetric, thresholdId: string): void {
    metric.thresholds = metric.thresholds.filter((threshold) => threshold.id !== thresholdId);
    this.checkForChanges();
  }

  private buildThresholdSavePlan(): ThresholdSavePlan {
    let hasErrors = false;
    const retainedApiIds = new Set<string>();
    const toSave: SaveThresholdSetting[] = [];

    for (const cat of this.categories()) {
      const type = SENSOR_TYPE_BY_CATEGORY_ID[cat.id];
      if (!type) continue;

      for (const met of cat.metrics) {
        const metricName = API_NAME_BY_METRIC_ID[met.id];
        if (!metricName) continue;

        if (this.hasContradictoryThresholds(met)) {
          hasErrors = true;
        }

        for (const threshold of met.thresholds) {
          const originalSetting = this.originalSettings().find(s => s.id === threshold.apiId);
          const conditionChanged = !!originalSetting && originalSetting.alertType.toLowerCase() !== threshold.condition;

          if (threshold.value === null) {
            continue;
          }

          if (threshold.value < met.min || threshold.value > met.max) {
            hasErrors = true;
          }

          if (threshold.apiId && !conditionChanged) {
            retainedApiIds.add(threshold.apiId);
          }

          const valueChanged = originalSetting
            ? originalSetting.thresholdValue !== threshold.value || conditionChanged
            : true;

          if (valueChanged) {
            toSave.push({
              type,
              metric: metricName,
              thresholdValue: threshold.value,
              alertType: threshold.condition.toUpperCase()
            });
          }
        }
      }
    }

    return { hasErrors, retainedApiIds, toSave };
  }

  private hasContradictoryThresholds(metric: SensorMetric): boolean {
    const above = metric.thresholds.find(t => t.condition === 'above');
    const below = metric.thresholds.find(t => t.condition === 'below');
    return !!above && !!below && above.value !== null && below.value !== null && above.value <= below.value;
  }

  private hasSensorConfigChanges(): boolean {
    const currentConfig = this.sensorConfig();
    const originalConfig = this.originalSensorConfig();
    return currentConfig.trafficReadingInterval !== originalConfig.trafficReadingInterval ||
      currentConfig.airQualityReadingInterval !== originalConfig.airQualityReadingInterval ||
      currentConfig.streetLightReadingInterval !== originalConfig.streetLightReadingInterval;
  }

  private deleteSettings(ids: string[]): Observable<unknown> {
    if (ids.length === 0) {
      return of(null);
    }

    return forkJoin(ids.map(id => this.settingsService.deleteSetting(id).pipe(defaultIfEmpty(null))));
  }

  onJumpToAlert(event: AlertNavigationTarget): void {
    this.router.navigate(['/home'], {
      queryParams: { openAlert: event.type, alertId: event.alertId }
    });
  }
}
