import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-air-quality-sensor-card',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './air-quality-sensor-card.component.html',
  styleUrl: './air-quality-sensor-card.component.scss',
})
export class AirQualitySensorCardComponent {}
