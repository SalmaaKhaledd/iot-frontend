import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

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

  readonly tabs = SETTINGS_TABS;
  readonly activeTab = signal<SettingsTab>('thresholds');
  readonly isDirty = signal(false);
  readonly categories = signal<SensorCategory[]>(createDefaultSensorCategories());
  readonly sensorConfig = signal<SensorConfiguration>(createDefaultSensorConfiguration());

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
    this.isDirty.set(false);
    // Real app would persist through a settings API service.
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