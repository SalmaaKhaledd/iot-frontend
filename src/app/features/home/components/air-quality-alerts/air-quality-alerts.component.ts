import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface AirQualityAlert {
  id: string;
  sensorId?: string;
  title: string;
  message: string;
  report: string;
  time: string;
  pollutionLevel: 'Good' | 'Moderate' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  pm2_5: number;
  pm10: number;
  co: number;
  ozone: number;
  no2: number;
  so2: number;
}

@Component({
  selector: 'app-air-quality-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './air-quality-alerts.component.html',
  styleUrl: './air-quality-alerts.component.scss',
})
export class AirQualityAlertsComponent {
  readonly airQualityAlerts: readonly AirQualityAlert[] = [
    {
      id: '11111111-2222-3333-4444-555555555555',
      sensorId: '3c8d6f1b-2f4a-4c9b-9f1d-1f3a8b6d2a2b',
      title: 'Hazardous Air Quality',
      message: 'Pollution levels reached dangerous levels',
      report: 'Air quality has deteriorated significantly. PM2.5: 185 μg/m³. PM10: 210 μg/m³. CO: 8.5 ppm. Ozone: 195 ppb. NO₂: 145 ppb. SO₂: 85 ppb. Pollution Level: Very Unhealthy. Health advisory: Everyone should avoid all outdoor physical activity. Keep windows closed and use air purifiers. Vulnerable populations should remain indoors.',
      time: '30 min ago',
      pollutionLevel: 'Very Unhealthy',
      pm2_5: 185,
      pm10: 210,
      co: 8.5,
      ozone: 195,
      no2: 145,
      so2: 85
    },
    {
      id: '66666666-7777-8888-9999-aaaaaaaaaaaa',
      sensorId: '7b9e3c4d-1a2b-4c5d-9e6f-8a1b2c3d4e5f',
      title: 'Poor Air Quality Alert',
      message: 'PM2.5 exceeded safe threshold',
      report: 'Particulate matter levels are unhealthy. PM2.5: 152 μg/m³. PM10: 178 μg/m³. CO: 6.2 ppm. Ozone: 162 ppb. NO₂: 128 ppb. SO₂: 72 ppb. Pollution Level: Unhealthy. Cause: Industrial emissions combined with low wind conditions. Recommendation: Limit outdoor activities, especially for children and elderly. Use N95 masks if going outside.',
      time: '2 hours ago',
      pollutionLevel: 'Unhealthy',
      pm2_5: 152,
      pm10: 178,
      co: 6.2,
      ozone: 162,
      no2: 128,
      so2: 72
    },
    {
      id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      sensorId: '5d41402a-b3d5-4c6a-9a7f-0b1c2d3e4f5a',
      title: 'Moderate Air Quality',
      message: 'Air quality is acceptable but concerning',
      report: 'Air quality has declined to moderate levels. PM2.5: 68 μg/m³. PM10: 85 μg/m³. CO: 2.8 ppm. Ozone: 95 ppb. NO₂: 62 ppb. SO₂: 35 ppb. Pollution Level: Moderate. Sensitive individuals should consider reducing prolonged outdoor exertion. Monitor conditions before outdoor activities.',
      time: '5 hours ago',
      pollutionLevel: 'Moderate',
      pm2_5: 68,
      pm10: 85,
      co: 2.8,
      ozone: 95,
      no2: 62,
      so2: 35
    },
    {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      title: 'Air Quality Improved',
      message: 'Pollution levels back to good',
      report: 'Air quality has improved significantly due to favorable wind conditions. PM2.5: 28 μg/m³. PM10: 42 μg/m³. CO: 1.2 ppm. Ozone: 48 ppb. NO₂: 25 ppb. SO₂: 12 ppb. Pollution Level: Good. Air quality is satisfactory and poses little or no risk. Outdoor activities are safe for all populations.',
      time: '8 hours ago',
      pollutionLevel: 'Good',
      pm2_5: 28,
      pm10: 42,
      co: 1.2,
      ozone: 48,
      no2: 25,
      so2: 12
    },
    {
      id: 'fedcba98-7654-3210-fedc-ba9876543210',
      title: 'Elevated Pollution Levels',
      message: 'Multiple pollutants rising',
      report: 'Multiple pollutant levels have increased above normal. PM2.5: 85 μg/m³. PM10: 110 μg/m³. CO: 3.5 ppm. Ozone: 125 ppb. NO₂: 88 ppb. SO₂: 48 ppb. Pollution Level: Moderate. Source: Heavy traffic during rush hour. Expected to normalize within 2-3 hours. Ventilation recommended for indoor spaces.',
      time: '12 hours ago',
      pollutionLevel: 'Moderate',
      pm2_5: 85,
      pm10: 110,
      co: 3.5,
      ozone: 125,
      no2: 88,
      so2: 48
    }
  ];

  // Filter state
  isFiltersOpen = false;
  pollutionFilter = 'all';

  filteredAlerts(): readonly AirQualityAlert[] {
    return this.airQualityAlerts.filter((a) => {
      let matchesPollution = true;
      if (this.pollutionFilter === 'good') matchesPollution = a.pollutionLevel === 'Good';
      else if (this.pollutionFilter === 'moderate') matchesPollution = a.pollutionLevel === 'Moderate';
      else if (this.pollutionFilter === 'unhealthy') matchesPollution = a.pollutionLevel === 'Unhealthy';
      else if (this.pollutionFilter === 'very-unhealthy') matchesPollution = a.pollutionLevel === 'Very Unhealthy';
      else if (this.pollutionFilter === 'hazardous') matchesPollution = a.pollutionLevel === 'Hazardous';
      return matchesPollution;
    });
  }

  toggleFilters(): void { this.isFiltersOpen = !this.isFiltersOpen; }
  setPollution(level: string): void { this.pollutionFilter = level; }

  getPollutionColor(level: string): string {
    switch (level) {
      case 'Good':
        return 'success';
      case 'Moderate':
        return 'warning';
      case 'Unhealthy':
        return 'error';
      case 'Very Unhealthy':
        return 'critical';
      case 'Hazardous':
        return 'critical';
      default:
        return 'info';
    }
  }

  onAlertHover(alert: AirQualityAlert): void {
    // Handle hover - show report tooltip
  }
}
