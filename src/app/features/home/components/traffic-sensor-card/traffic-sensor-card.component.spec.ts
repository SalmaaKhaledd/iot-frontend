import { TestBed } from '@angular/core/testing';

import { TrafficSensorCardComponent } from './traffic-sensor-card.component';

describe('TrafficSensorCardComponent', () => {
  let component: TrafficSensorCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrafficSensorCardComponent],
    }).compileComponents();

    component = TestBed.createComponent(TrafficSensorCardComponent).componentInstance;
  });

  it('starts with the first sensor selected', () => {
    expect(component.selectedSensorData().id).toBe(component.sensors[0].id);
  });

  it('updates the selected sensor', () => {
    component.onSelectSensor(component.sensors[1].id);

    expect(component.selectedSensorData().id).toBe(component.sensors[1].id);
  });

  it('exposes trend data for the bar chart', () => {
    expect(component.trendData).toHaveLength(6);
    expect(component.trendData[0]).toEqual({ time: '6:00', density: 84 });
    expect(component.trendData[5]).toEqual({ time: '11:00', density: 98 });
  });

  it('tracks hovered bar index', () => {
    expect(component.hoveredIndex()).toBeNull();
    component.hoveredIndex.set(2);
    expect(component.hoveredIndex()).toBe(2);
    component.hoveredIndex.set(null);
    expect(component.hoveredIndex()).toBeNull();
  });
});