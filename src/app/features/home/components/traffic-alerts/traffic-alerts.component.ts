import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface TrafficAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  sensorId?: string;
  location?: string;
  title: string;
  message: string;
  report: string;
  time: string;
  vehicleCount: number;
  avgSpeed: number;
  congestionLevel: number;
}

@Component({
  selector: 'app-traffic-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './traffic-alerts.component.html',
  styleUrl: './traffic-alerts.component.scss',
})
export class TrafficAlertsComponent {
  readonly trafficAlerts: readonly TrafficAlert[] = [
    {
      id: 'd9b1d7c3-9f6a-4b2b-9d1f-1a2b3c4d5e6f',
      sensorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      severity: 'critical',
      location: 'Main Street & 5th Ave',
      title: 'Severe Congestion',
      message: 'Traffic at standstill due to accident',
      report: 'Major accident blocking two lanes. Emergency services on scene. Traffic density: HIGH. Vehicle count: 245 cars/min. Average speed: 8 km/h. Congestion level: 95%. Estimated clearance: 45 minutes. Recommended detour: Use Park Avenue.',
      time: '5 min ago',
      vehicleCount: 245,
      avgSpeed: 8,
      congestionLevel: 95
    },
    {
      id: 'c6e2f0a1-4a2b-4c3d-8e9f-0a1b2c3d4e5f',
      sensorId: '9c858901-8a57-4791-81fe-4c455b099bc9',
      severity: 'warning',
      location: 'Highway 101 Northbound',
      title: 'Heavy Traffic',
      message: 'Rush hour congestion building',
      report: 'Normal rush hour traffic patterns. No incidents reported. Traffic density: MEDIUM-HIGH. Vehicle count: 185 cars/min. Average speed: 35 km/h. Congestion level: 72%. Expected to clear by 7:00 PM.',
      time: '12 min ago',
      vehicleCount: 185,
      avgSpeed: 35,
      congestionLevel: 72
    },
    {
      id: 'e7f3a1b2-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
      sensorId: '6fa459ea-ee8a-3ca4-894e-db77e160355e',
      severity: 'warning',
      location: 'Oak Boulevard',
      title: 'Moderate Congestion',
      message: 'Construction zone causing delays',
      report: 'Road work in progress. One lane closed. Traffic density: MEDIUM. Vehicle count: 142 cars/min. Average speed: 28 km/h. Congestion level: 58%. Construction expected to complete by next week.',
      time: '25 min ago',
      vehicleCount: 142,
      avgSpeed: 28,
      congestionLevel: 58
    },
    {
      id: 'f1e2d3c4-b5a6-7890-1234-56789abcdef0',
      severity: 'info',
      location: 'Park Avenue',
      title: 'Traffic Cleared',
      message: 'Normal flow restored',
      report: 'Previous congestion has cleared. Traffic density: LOW. Vehicle count: 85 cars/min. Average speed: 55 km/h. Congestion level: 22%. All lanes operational. No delays expected.',
      time: '1 hour ago',
      vehicleCount: 85,
      avgSpeed: 55,
      congestionLevel: 22
    },
    {
      id: 'a2b3c4d5-e6f7-8901-2345-6789abcdef01',
      severity: 'info',
      location: 'Cedar Lane',
      title: 'Light Traffic',
      message: 'Optimal driving conditions',
      report: 'Traffic flowing smoothly. Traffic density: LOW. Vehicle count: 65 cars/min. Average speed: 60 km/h. Congestion level: 15%. Excellent conditions for travel.',
      time: '2 hours ago',
      vehicleCount: 65,
      avgSpeed: 60,
      congestionLevel: 15
    }
  ];

  // Filter state
  isFiltersOpen = false;
  selectedSeverityFilter = 'all';
  congestionFilter = 'all';

  filteredAlerts(): readonly TrafficAlert[] {
    return this.trafficAlerts.filter((a) => {
      const matchesSeverity = this.selectedSeverityFilter === 'all' || a.severity === this.selectedSeverityFilter;
      let matchesCongestion = true;
      if (this.congestionFilter === 'low') matchesCongestion = a.congestionLevel < 40;
      else if (this.congestionFilter === 'medium') matchesCongestion = a.congestionLevel >= 40 && a.congestionLevel < 70;
      else if (this.congestionFilter === 'high') matchesCongestion = a.congestionLevel >= 70;
      return matchesSeverity && matchesCongestion;
    });
  }

  toggleFilters(): void { this.isFiltersOpen = !this.isFiltersOpen; }
  setSeverity(sev: string): void { this.selectedSeverityFilter = sev; }
  setCongestion(level: string): void { this.congestionFilter = level; }
  

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

  getCongestionColor(level: number): string {
    if (level < 40) return 'success';
    if (level < 70) return 'warning';
    return 'critical';
  }

  onAlertHover(alert: TrafficAlert): void {
    // Handle hover - show report tooltip
  }
}
