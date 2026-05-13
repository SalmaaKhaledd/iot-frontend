import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface TrafficAlert {
  id: string;
  sensorId?: string;
  location?: string;
  title: string;
  message: string;
  report: string;
  time: string;
  trafficDensity: number;
  avgSpeed: number;
  congestionLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
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
      location: 'Main Street & 5th Ave',
      title: 'Severe Congestion',
      message: 'Traffic at standstill due to accident',
      report: 'Major accident blocking two lanes. Emergency services on scene. Traffic density: 245 vehicles/min. Average speed: 8 km/h. Congestion level: Severe. Estimated clearance: 45 minutes. Recommended detour: Use Park Avenue.',
      time: '5 min ago',
      trafficDensity: 245,
      avgSpeed: 8,
      congestionLevel: 'Severe'
    },
    {
      id: 'c6e2f0a1-4a2b-4c3d-8e9f-0a1b2c3d4e5f',
      sensorId: '9c858901-8a57-4791-81fe-4c455b099bc9',
      location: 'Highway 101 Northbound',
      title: 'Heavy Traffic',
      message: 'Rush hour congestion building',
      report: 'Normal rush hour traffic patterns. No incidents reported. Traffic density: 185 vehicles/min. Average speed: 35 km/h. Congestion level: High. Expected to clear by 7:00 PM.',
      time: '12 min ago',
      trafficDensity: 185,
      avgSpeed: 35,
      congestionLevel: 'High'
    },
    {
      id: 'e7f3a1b2-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
      sensorId: '6fa459ea-ee8a-3ca4-894e-db77e160355e',
      location: 'Oak Boulevard',
      title: 'Moderate Congestion',
      message: 'Construction zone causing delays',
      report: 'Road work in progress. One lane closed. Traffic density: 142 vehicles/min. Average speed: 28 km/h. Congestion level: Moderate. Construction expected to complete by next week.',
      time: '25 min ago',
      trafficDensity: 142,
      avgSpeed: 28,
      congestionLevel: 'Moderate'
    },
    {
      id: 'f1e2d3c4-b5a6-7890-1234-56789abcdef0',
      location: 'Park Avenue',
      title: 'Traffic Cleared',
      message: 'Normal flow restored',
      report: 'Previous congestion has cleared. Traffic density: 85 vehicles/min. Average speed: 55 km/h. Congestion level: Low. All lanes operational. No delays expected.',
      time: '1 hour ago',
      trafficDensity: 85,
      avgSpeed: 55,
      congestionLevel: 'Low'
    },
    {
      id: 'a2b3c4d5-e6f7-8901-2345-6789abcdef01',
      location: 'Cedar Lane',
      title: 'Light Traffic',
      message: 'Optimal driving conditions',
      report: 'Traffic flowing smoothly. Traffic density: 65 vehicles/min. Average speed: 60 km/h. Congestion level: Low. Excellent conditions for travel.',
      time: '2 hours ago',
      trafficDensity: 65,
      avgSpeed: 60,
      congestionLevel: 'Low'
    }
  ];

  // Filter state
  isFiltersOpen = false;
  congestionFilter = 'all';

  filteredAlerts(): readonly TrafficAlert[] {
    return this.trafficAlerts.filter((a) => {
      let matchesCongestion = true;
      if (this.congestionFilter === 'low') matchesCongestion = a.congestionLevel === 'Low';
      else if (this.congestionFilter === 'moderate') matchesCongestion = a.congestionLevel === 'Moderate';
      else if (this.congestionFilter === 'high') matchesCongestion = a.congestionLevel === 'High';
      else if (this.congestionFilter === 'severe') matchesCongestion = a.congestionLevel === 'Severe';
      return matchesCongestion;
    });
  }

  toggleFilters(): void { this.isFiltersOpen = !this.isFiltersOpen; }
  setCongestion(level: string): void { this.congestionFilter = level; }
  

  getCongestionColor(level: string): string {
    switch (level) {
      case 'Low':
        return 'success';
      case 'Moderate':
        return 'warning';
      case 'High':
        return 'error';
      case 'Severe':
        return 'critical';
      default:
        return 'info';
    }
  }

  onAlertHover(alert: TrafficAlert): void {
    // Handle hover - show report tooltip
  }
}
