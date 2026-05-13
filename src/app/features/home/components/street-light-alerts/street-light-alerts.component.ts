import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface StreetLightAlert {
  id: string;
  lightId: string;
  location: string;
  title: string;
  message: string;
  report: string;
  time: string;
  status: 'on' | 'off';
  brightness: number;
  powerConsumption: number;
}

@Component({
  selector: 'app-street-light-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './street-light-alerts.component.html',
  styleUrl: './street-light-alerts.component.scss',
})
export class StreetLightAlertsComponent {
  readonly streetLightAlerts: readonly StreetLightAlert[] = [
    {
      id: 'light-2',
      lightId: 'SL-012',
      location: 'Park Avenue & 3rd Street',
      title: 'Multiple Light Outage',
      message: 'Power grid failure affecting 3 lights',
      report: 'Multiple street lights (SL-012, SL-013, SL-014) are offline due to grid issue. Status: OFF. Affected area: 2 blocks. Root cause: Transformer malfunction. Power company notified. Current brightness: 0%. Estimated restoration: 2-3 hours. Emergency backup lighting activated in critical areas.',
      time: '1 hour ago',
      status: 'off',
      brightness: 0,
      powerConsumption: 0
    },
    {
      id: 'light-3',
      lightId: 'SL-008',
      location: 'Cedar Lane',
      title: 'Flickering Light Detected',
      message: 'Intermittent power fluctuations',
      report: 'Street light SL-008 showing irregular behavior. Status: ON (unstable). Brightness fluctuating between 40-85%. Power consumption: 22-42W (variable). Likely cause: Faulty ballast or loose connection. Light still operational but requires inspection. Maintenance scheduled for tomorrow morning.',
      time: '3 hours ago',
      status: 'on',
      brightness: 65,
      powerConsumption: 32
    },
    {
      id: 'light-4',
      lightId: 'SL-021',
      location: 'Oak Boulevard',
      title: 'Reduced Brightness',
      message: 'Light operating at 50% capacity',
      report: 'Street light SL-021 operating at reduced brightness. Status: ON (degraded). Current brightness: 50% (expected: 85%). Power consumption: 25W (normal). Possible LED degradation or dirt accumulation on lens. Cleaning and component inspection recommended. Light remains functional for safety.',
      time: '6 hours ago',
      status: 'on',
      brightness: 50,
      powerConsumption: 25
    },
    {
      id: 'light-5',
      lightId: 'SL-005',
      location: 'Elm Street',
      title: 'Light Repair Completed',
      message: 'SL-005 restored to full operation',
      report: 'Street light SL-005 has been successfully repaired. Status: ON. New LED module installed. Current brightness: 85%. Power consumption: 42W (optimal). All diagnostic tests passed. Light is now fully operational. Expected lifespan of new components: 5 years.',
      time: '1 day ago',
      status: 'on',
      brightness: 85,
      powerConsumption: 42
    },
    {
      id: 'light-6',
      lightId: 'SL-030',
      location: 'Maple Drive',
      title: 'Auto-Dimming Activated',
      message: 'Energy saving mode enabled',
      report: 'Street light SL-030 automatically adjusted brightness based on ambient conditions and low traffic. Status: ON (eco mode). Current brightness: 60% (reduced from 85%). Power consumption: 30W (saved 15W). Auto-dimming triggered by motion sensors detecting minimal activity. Will return to full brightness when activity increases.',
      time: '2 days ago',
      status: 'on',
      brightness: 60,
      powerConsumption: 30
    }
  ];

  // Filter state
  isFiltersOpen = false;
  statusFilter = 'all';

  filteredAlerts(): readonly StreetLightAlert[] {
    return this.streetLightAlerts.filter((a) => {
      const matchesStatus = this.statusFilter === 'all' || a.status === this.statusFilter;
      return matchesStatus;
    });
  }

  toggleFilters(): void { this.isFiltersOpen = !this.isFiltersOpen; }
  setStatus(status: string): void { this.statusFilter = status; }

  getStatusColor(status: string): string {
    switch (status) {
      case 'on':
        return 'success';
      case 'off':
        return 'inactive';
      default:
        return 'inactive';
    }
  }

  onAlertHover(alert: StreetLightAlert): void {
    // Handle hover - show report tooltip
  }
}
