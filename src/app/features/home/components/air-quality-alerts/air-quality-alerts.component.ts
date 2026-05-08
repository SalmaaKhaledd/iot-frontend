import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface AirQualityAlert {
  id: string;
  sensorId?: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  report: string;
  time: string;
  aqi: number;
  pm25: number;
  pm10: number;
  co2: number;
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
      severity: 'critical',
      title: 'Hazardous Air Quality',
      message: 'AQI reached dangerous levels',
      report: 'Air quality has deteriorated significantly. PM2.5 levels at 185 μg/m³ (very high). PM10 at 210 μg/m³. CO₂ concentration: 520 ppm. AQI: 215 (Very Unhealthy). Health advisory: Everyone should avoid all outdoor physical activity. Keep windows closed and use air purifiers. Vulnerable populations should remain indoors.',
      time: '30 min ago',
      aqi: 215,
      pm25: 185,
      pm10: 210,
      co2: 520
    },
    {
      id: '66666666-7777-8888-9999-aaaaaaaaaaaa',
      sensorId: '7b9e3c4d-1a2b-4c5d-9e6f-8a1b2c3d4e5f',
      severity: 'critical',
      title: 'Poor Air Quality Alert',
      message: 'PM2.5 exceeded safe threshold',
      report: 'Particulate matter levels are unhealthy. PM2.5: 152 μg/m³. PM10: 178 μg/m³. CO₂: 485 ppm. AQI: 178 (Unhealthy). Cause: Industrial emissions combined with low wind conditions. Recommendation: Limit outdoor activities, especially for children and elderly. Use N95 masks if going outside.',
      time: '2 hours ago',
      aqi: 178,
      pm25: 152,
      pm10: 178,
      co2: 485
    },
    {
      id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      sensorId: '5d41402a-b3d5-4c6a-9a7f-0b1c2d3e4f5a',
      severity: 'warning',
      title: 'Moderate Air Quality',
      message: 'Air quality is acceptable but concerning',
      report: 'Air quality has declined to moderate levels. PM2.5: 68 μg/m³. PM10: 85 μg/m³. CO₂: 445 ppm. AQI: 95 (Moderate). Sensitive individuals should consider reducing prolonged outdoor exertion. Monitor conditions before outdoor activities.',
      time: '5 hours ago',
      aqi: 95,
      pm25: 68,
      pm10: 85,
      co2: 445
    },
    {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      severity: 'info',
      title: 'Air Quality Improved',
      message: 'AQI back to good levels',
      report: 'Air quality has improved significantly due to favorable wind conditions. PM2.5: 28 μg/m³. PM10: 42 μg/m³. CO₂: 410 ppm. AQI: 48 (Good). Air quality is satisfactory and poses little or no risk. Outdoor activities are safe for all populations.',
      time: '8 hours ago',
      aqi: 48,
      pm25: 28,
      pm10: 42,
      co2: 410
    },
    {
      id: 'fedcba98-7654-3210-fedc-ba9876543210',
      severity: 'warning',
      title: 'Elevated CO₂ Levels',
      message: 'Carbon dioxide concentration rising',
      report: 'CO₂ levels have increased above normal. PM2.5: 45 μg/m³. PM10: 62 μg/m³. CO₂: 475 ppm (elevated). AQI: 82 (Moderate). Source: Heavy traffic during rush hour. Expected to normalize within 2-3 hours. Ventilation recommended for indoor spaces.',
      time: '12 hours ago',
      aqi: 82,
      pm25: 45,
      pm10: 62,
      co2: 475
    }
  ];

  // Filter state
  isFiltersOpen = false;
  selectedSeverityFilter = 'all';
  aqiFilter = 'all';

  filteredAlerts(): readonly AirQualityAlert[] {
    return this.airQualityAlerts.filter((a) => {
      const matchesSeverity = this.selectedSeverityFilter === 'all' || a.severity === this.selectedSeverityFilter;
      let matchesAqi = true;
      if (this.aqiFilter === 'good') matchesAqi = a.aqi <= 50;
      else if (this.aqiFilter === 'moderate') matchesAqi = a.aqi > 50 && a.aqi <= 100;
      else if (this.aqiFilter === 'unhealthy') matchesAqi = a.aqi > 100 && a.aqi <= 150;
      else if (this.aqiFilter === 'very-unhealthy') matchesAqi = a.aqi > 150;
      return matchesSeverity && matchesAqi;
    });
  }

  toggleFilters(): void { this.isFiltersOpen = !this.isFiltersOpen; }
  setSeverity(sev: string): void { this.selectedSeverityFilter = sev; }
  setAqi(level: string): void { this.aqiFilter = level; }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  getAQIColor(aqi: number): string {
    if (aqi <= 50) return 'success';
    if (aqi <= 100) return 'warning';
    if (aqi <= 150) return 'error';
    return 'critical';
  }

  onAlertHover(alert: AirQualityAlert): void {
    // Handle hover - show report tooltip
  }
}
