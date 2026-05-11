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

  it('computes the chart path from the derived point coordinates', () => {
    const coords = component.pointCoords();

    expect(coords).toHaveLength(component.trendData.length);
    expect(component.linePath()).toBe(
      coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' '),
    );
  });

  it('maps chart values to the SVG coordinate system', () => {
    expect(component.yFor(0)).toBe(220);
    expect(component.yFor(90)).toBe(121);
    expect(component.yFor(180)).toBe(22);
  });

  it('tracks the nearest chart point while hovering', () => {
    const targetPoint = component.pointCoords()[2];
    const svg = {
      getBoundingClientRect: () => ({ left: 0, width: 1040, height: 260 }),
    } as unknown as Element;
    const event = new MouseEvent('mousemove', { clientX: targetPoint.x, clientY: 0 });

    component.onChartMove(event, svg);

    expect(component.hoveredIndex()).toBe(2);
    expect(component.hoveredPoint()).toEqual(targetPoint);
    expect(component.tooltipX()).toBeCloseTo(targetPoint.x, 5);
    expect(component.tooltipY()).toBeCloseTo(targetPoint.y, 5);
  });

  it('clears the hovered point when the pointer leaves', () => {
    component.hoveredIndex.set(1);

    component.onChartLeave();

    expect(component.hoveredIndex()).toBeNull();
    expect(component.hoveredPoint()).toBeNull();
  });
});