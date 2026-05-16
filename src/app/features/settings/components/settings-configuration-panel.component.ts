import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { SensorConfiguration } from '../settings.types';

interface ConfigurationField {
  key: keyof SensorConfiguration;
  label: string;
  description: string;
  icon: string;
  colorClass: 'blue' | 'green' | 'yellow';
  min: number;
  max: number;
  step?: string;
  placeholder: string;
}

@Component({
  selector: 'app-settings-configuration-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './settings-configuration-panel.component.html',
  styleUrl: './settings-configuration-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsConfigurationPanelComponent {
  readonly sensorConfig = input.required<SensorConfiguration>();
  readonly changed = output<void>();

  readonly fields: ConfigurationField[] = [
    {
      key: 'trafficReadingInterval',
      label: 'Traffic Sensors',
      description: 'How often traffic sensors report data',
      icon: 'directions_car',
      colorClass: 'blue',
      min: 1,
      max: 60,
      placeholder: 'Enter a valid interval',
    },
    {
      key: 'airQualityReadingInterval',
      label: 'Air Quality Sensors',
      description: 'How often air quality sensors report data',
      icon: 'air',
      colorClass: 'green',
      min: 1,
      max: 60,
      placeholder: 'Enter a valid interval',
    },
    {
      key: 'streetLightReadingInterval',
      label: 'Street Light Sensors',
      description: 'How often street light sensors report data',
      icon: 'lightbulb',
      colorClass: 'yellow',
      min: 1,
      max: 60,
      placeholder: 'Enter a valid interval',
    },
  ];

  updateInterval(key: keyof SensorConfiguration, value: number | null | string): void {
    if (value === null || value === undefined || value === '') {
      this.sensorConfig()[key] = null as any;
    } else {
      const num = Number(value);
      this.sensorConfig()[key] = isNaN(num) ? null as any : num;
    }
    this.changed.emit();
  }

  revertIfEmpty(key: keyof SensorConfiguration, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '') {
      const current = this.sensorConfig()[key];
      if (current === null) {
        // already null, nothing to revert to — keep it empty visually
        input.value = '';
      } else {
        input.value = String(current);
      }
    }
  }

  hasValueError(field: ConfigurationField): boolean {
    const value = this.sensorConfig()[field.key];
    return value !== null && (value < field.min || value > field.max);
  }

  markChanged(): void {
    this.changed.emit();
  }
}