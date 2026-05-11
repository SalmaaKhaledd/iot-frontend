import { TestBed } from '@angular/core/testing';

import { StreetLightAlertsComponent } from './street-light-alerts.component';

describe('StreetLightAlertsComponent', () => {
  let component: StreetLightAlertsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreetLightAlertsComponent],
    }).compileComponents();

    component = TestBed.createComponent(StreetLightAlertsComponent).componentInstance;
  });

  it('exposes the default alert list', () => {
    expect(component.streetLightAlerts).toHaveLength(6);
    expect(component.filteredAlerts()).toHaveLength(6);
  });

  it('toggles the filter panel state', () => {
    expect(component.isFiltersOpen).toBe(false);

    component.toggleFilters();

    expect(component.isFiltersOpen).toBe(true);
  });

  it('filters alerts by severity and status', () => {
    component.setSeverity('critical');
    component.setStatus('off');

    expect(component.filteredAlerts().map((alert) => alert.id)).toEqual(['light-2']);
  });

  it('maps severity and status values to colors', () => {
    expect(component.getSeverityColor('critical')).toBe('critical');
    expect(component.getSeverityColor('warning')).toBe('warning');
    expect(component.getSeverityColor('info')).toBe('info');

    expect(component.getStatusColor('on')).toBe('success');
    expect(component.getStatusColor('off')).toBe('inactive');
    expect(component.getStatusColor('faulty')).toBe('critical');
  });
});