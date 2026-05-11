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

  it('filters alerts by severity and congestion level', () => {
    component.setSeverity('info');
    component.setCongestion('low');

    expect(component.filteredAlerts().map((alert) => alert.id)).toEqual([
      'f1e2d3c4-b5a6-7890-1234-56789abcdef0',
      'a2b3c4d5-e6f7-8901-2345-6789abcdef01',
    ]);
  });

  it('maps severity and congestion thresholds to colors', () => {
    expect(component.getSeverityColor('critical')).toBe('critical');
    expect(component.getSeverityColor('warning')).toBe('warning');
    expect(component.getSeverityColor('info')).toBe('info');

    expect(component.getCongestionColor(10)).toBe('success');
    expect(component.getCongestionColor(55)).toBe('warning');
    expect(component.getCongestionColor(80)).toBe('critical');
  });
});