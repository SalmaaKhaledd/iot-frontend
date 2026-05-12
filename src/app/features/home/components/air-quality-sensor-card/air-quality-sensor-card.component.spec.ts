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

  it('exposes the full pollution sensor schema', () => {
    const sensor = component.selectedSensorData();

    expect(sensor.location).toBeTruthy();
    expect(sensor.timestamp).toBeTruthy();
    expect(sensor.pm2_5).toBeGreaterThanOrEqual(0);
    expect(sensor.pm10).toBeGreaterThanOrEqual(0);
    expect(sensor.no2).toBeGreaterThanOrEqual(0);
    expect(sensor.so2).toBeGreaterThanOrEqual(0);
  });

  it('scales CO values into a capped percentage', () => {
    expect(component.coWidth(0)).toBe(0);
    expect(component.coWidth(25)).toBe(50);
    expect(component.coWidth(50)).toBe(100);
  });

  it('scales particulate values into a capped percentage', () => {
    expect(component.particulateWidth(0)).toBe(0);
    expect(component.particulateWidth(500)).toBe(50);
    expect(component.particulateWidth(1000)).toBe(100);
  });

  it('scales ozone values into a capped percentage', () => {
    expect(component.ozoneWidth(0)).toBe(0);
    expect(component.ozoneWidth(150)).toBe(50);
    expect(component.ozoneWidth(300)).toBe(100);
  });

  it('scales gas values into a capped percentage', () => {
    expect(component.gasWidth(0)).toBe(0);
    expect(component.gasWidth(250)).toBe(50);
    expect(component.gasWidth(500)).toBe(100);
  });

  it('describes the selected pollution level', () => {
    component.onSelectSensor(component.sensors[0].id);

    expect(component.recommendationText()).toContain('very unhealthy');
  });
});