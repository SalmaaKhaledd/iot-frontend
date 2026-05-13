import { TestBed } from '@angular/core/testing';

import { TrafficAlertsComponent } from './traffic-alerts.component';

describe('TrafficAlertsComponent', () => {
  let component: TrafficAlertsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrafficAlertsComponent],
    }).compileComponents();

    component = TestBed.createComponent(TrafficAlertsComponent).componentInstance;
  });

  it('exposes the default alert list', () => {
    expect(component.trafficAlerts).toHaveLength(5);
    expect(component.filteredAlerts()).toHaveLength(5);
  });

  it('toggles the filter panel state', () => {
    expect(component.isFiltersOpen).toBe(false);

    component.toggleFilters();

    expect(component.isFiltersOpen).toBe(true);
  });

  it('filters alerts by congestion level', () => {
    component.setCongestion('low');

    expect(component.filteredAlerts().map((alert) => alert.id)).toEqual([
      'f1e2d3c4-b5a6-7890-1234-56789abcdef0',
      'a2b3c4d5-e6f7-8901-2345-6789abcdef01',
    ]);
  });

  it('maps congestion levels to colors', () => {
    expect(component.getCongestionColor('Low')).toBe('success');
    expect(component.getCongestionColor('Moderate')).toBe('warning');
    expect(component.getCongestionColor('High')).toBe('error');
    expect(component.getCongestionColor('Severe')).toBe('critical');
  });
});