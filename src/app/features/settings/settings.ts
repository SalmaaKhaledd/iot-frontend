import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { defaultIfEmpty } from 'rxjs/operators';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

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
  private readonly originalSettings = signal<import('../../core/services/settings.service').ThresholdSetting[]>([]);
  private readonly deletedThresholdIds = new Set<string>();
  readonly showSuccessMessage = signal(false);

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.settingsService.getSensorConfig()
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
            existingCondition.apiId = setting.id;
            existingCondition.originalValue = setting.thresholdValue;
          } else if (emptyDefault) {
            emptyDefault.condition = condition;
            emptyDefault.value = setting.thresholdValue;
            emptyDefault.apiId = setting.id;
            emptyDefault.originalValue = setting.thresholdValue;
          } else {
            metric.thresholds.push({
              id: Math.random().toString(36).substring(2, 9),
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
    let isChanged = false;
    const currentApiIds = new Set<string>();

    for (const cat of this.categories()) {
      for (const met of cat.metrics) {
        for (const t of met.thresholds) {
          if (t.apiId) {
            currentApiIds.add(t.apiId);
            const originalSetting = this.originalSettings().find(s => s.id === t.apiId);
            if (originalSetting) {
              if (originalSetting.thresholdValue !== t.value || originalSetting.alertType.toLowerCase() !== t.condition) {
                isChanged = true;
              }
            } else {
              isChanged = true;
            }
          } else if (t.value !== null) {
            isChanged = true;
          }
        }
      }
    }

    if (!isChanged) {
      if (currentApiIds.size !== this.originalSettings().length) {
        isChanged = true;
      }
    }

    if (!isChanged) {
      const currentConfig = this.sensorConfig();
      const originalConfig = this.originalSensorConfig();
      if (
        currentConfig.trafficReadingInterval !== originalConfig.trafficReadingInterval ||
        currentConfig.airQualityReadingInterval !== originalConfig.airQualityReadingInterval ||
        currentConfig.streetLightReadingInterval !== originalConfig.streetLightReadingInterval
      ) {
        isChanged = true;
      }
    }

    this.isDirty.set(isChanged);
  }

  saveChanges(): void {
    let hasErrors = false;
    const toSave: SaveThresholdSetting[] = [];
    const currentApiIds = new Set<string>();

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

        const above = met.thresholds.find(t => t.condition === 'above');
        const below = met.thresholds.find(t => t.condition === 'below');
        if (above && below && above.value !== null && below.value !== null) {
          if (above.value <= below.value) {
            hasErrors = true;
          }
        }

        for (const t of met.thresholds) {
          if (t.apiId) {
            currentApiIds.add(t.apiId);
          }

          if (t.value !== null) {
            if (t.value < met.min || t.value > met.max) {
              hasErrors = true;
            }

            const originalSetting = this.originalSettings().find(s => s.id === t.apiId);
            const valueChanged = originalSetting 
              ? originalSetting.thresholdValue !== t.value || originalSetting.alertType.toLowerCase() !== t.condition
              : true;

            if (valueChanged) {
              toSave.push({
                id: t.apiId,
                type,
                metric: metricName,
                thresholdValue: t.value,
                alertType: t.condition.toUpperCase()
              });
            }
          }
        }
      }
    }

    if (hasErrors) {
      alert('Please fix the threshold validation errors before saving.');
      return;
    }

    const deletedIds = this.originalSettings()
      .map(s => s.id)
      .filter(id => !currentApiIds.has(id));

    const deleteRequests = deletedIds.map(id => this.settingsService.deleteSetting(id).pipe(defaultIfEmpty(null)));
    const saveRequest = toSave.length > 0 ? this.settingsService.saveSettings(toSave).pipe(defaultIfEmpty(null)) : of(null);
    
    const configRequest = this.settingsService.saveSensorConfig(this.sensorConfig()).pipe(defaultIfEmpty(null));

    forkJoin([saveRequest, configRequest, ...deleteRequests]).subscribe({
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
      id: Math.random().toString(36).substring(2, 9),
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

  onJumpToAlert(event: {type: 'traffic' | 'air-quality' | 'street-light', alertId: string}): void {
    this.router.navigate(['/home'], {
      queryParams: { openAlert: event.type, alertId: event.alertId }
    });
  }
}