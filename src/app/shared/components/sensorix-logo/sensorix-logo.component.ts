import { Component, input } from '@angular/core';

@Component({
  selector: 'app-sensorix-logo',
  standalone: true,
  templateUrl: './sensorix-logo.component.html',
  styleUrl: './sensorix-logo.component.scss',
})
export class SensorixLogoComponent {
  readonly text = input('Sensorix');
  readonly showText = input(true);
  readonly iconSize = input('20px');
  readonly textSize = input('20px');
  readonly gap = input('10px');
  readonly textWeight = input('500');
}
