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
      description: 'How often traffic sensors collect and report data',
      icon: 'directions_car',
      colorClass: 'blue',
      min: 1,
      max: 60,
      placeholder: 'Traffic interval',
    },
    {
      key: 'airQualityReadingInterval',
      label: 'Air Quality Sensors',
      description: 'How often air quality sensors collect and report data',
      icon: 'air',
      colorClass: 'green',
      min: 1,
      max: 60,
      placeholder: 'Air quality interval',
    },
    {
      key: 'streetLightReadingInterval',
      label: 'Street Light Sensors',
      description: 'How often street light sensors collect and report data',
      icon: 'lightbulb',
      colorClass: 'yellow',
      min: 1,
      max: 60,
      placeholder: 'Street light interval',
    },
  ];

  updateInterval(key: keyof SensorConfiguration, value: string): void {
    this.sensorConfig()[key] = Number(value) || 0;
    this.changed.emit();
  }

  hasValueError(field: ConfigurationField): boolean {
    const value = this.sensorConfig()[field.key];
    return value < field.min || value > field.max;
  }

  markChanged(): void {
    this.changed.emit();
  }
}