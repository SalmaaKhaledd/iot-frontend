import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type StreetLightItem = {
  readonly id: string;
  readonly location: string;
  readonly isOn: boolean;
  readonly isFaulty: boolean;
  readonly brightness: number;
};

@Component({
  selector: 'app-street-light-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './street-light-card.component.html',
  styleUrl: './street-light-card.component.scss',
})
export class StreetLightCardComponent {
  readonly lights = signal<StreetLightItem[]>([
    { id: 'SL-001', location: 'Main Street', isOn: true, isFaulty: false, brightness: 85 },
    { id: 'SL-002', location: 'Park Avenue', isOn: true, isFaulty: false, brightness: 70 },
    { id: 'SL-003', location: 'Oak Boulevard', isOn: false, isFaulty: false, brightness: 0 },
  ]);

  readonly totalLights = computed(() => this.lights().length);
  readonly lightsOn = computed(() => this.lights().filter((light) => light.isOn).length);
  readonly faultyLights = computed(() => this.lights().filter((light) => light.isFaulty).length);
  readonly powerUsage = computed(() =>
    this.lights().reduce((total, light) => total + this.computePower(light.brightness), 0),
  );

  computePower(brightness: number): number {
    return Math.round(brightness * 0.5);
  }

  onBrightnessChange(id: string, rawValue: string): void {
    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) {
      return;
    }

    this.lights.update((lights) =>
      lights.map((light) =>
        light.id === id
          ? {
              ...light,
              brightness: Math.max(0, Math.min(100, numericValue)),
            }
          : light,
      ),
    );
  }
}
