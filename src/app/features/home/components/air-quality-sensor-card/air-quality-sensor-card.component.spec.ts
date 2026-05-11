import { TestBed } from '@angular/core/testing';

import { AirQualitySensorCardComponent } from './air-quality-sensor-card.component';

describe('AirQualitySensorCardComponent', () => {
  let component: AirQualitySensorCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirQualitySensorCardComponent],
    }).compileComponents();

    component = TestBed.createComponent(AirQualitySensorCardComponent).componentInstance;
  });

  it('selects the first sensor by default', () => {
    expect(component.selectedSensorData().id).toBe(component.sensors[0].id);
  });

  it('switches the selected sensor when onSelectSensor is called', () => {
    component.onSelectSensor(component.sensors[2].id);

    expect(component.selectedSensorData().id).toBe(component.sensors[2].id);
  });

  it('clamps bar widths into the 0 to 100 range', () => {
    expect(component.clampWidth(-8)).toBe(0);
    expect(component.clampWidth(41.4)).toBe(41);
    expect(component.clampWidth(200)).toBe(100);
  });

  it('scales CO2 values into a capped percentage', () => {
    expect(component.co2Width(0)).toBe(0);
    expect(component.co2Width(456)).toBe(76);
    expect(component.co2Width(900)).toBe(100);
  });
});