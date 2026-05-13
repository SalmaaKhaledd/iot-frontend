import { TestBed } from '@angular/core/testing';

import { AirQualityAlertsComponent } from './air-quality-alerts.component';

describe('AirQualityAlertsComponent', () => {
  let component: AirQualityAlertsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AirQualityAlertsComponent],
    }).compileComponents();

    component = TestBed.createComponent(AirQualityAlertsComponent).componentInstance;
  });

  it('exposes the default alert list', () => {
    expect(component.airQualityAlerts).toHaveLength(5);
    expect(component.filteredAlerts()).toHaveLength(5);
  });

  it('toggles the filter panel state', () => {
    expect(component.isFiltersOpen).toBe(false);

    component.toggleFilters();

    expect(component.isFiltersOpen).toBe(true);
  });

  it('filters alerts by pollution level', () => {
    component.setPollution('moderate');

    expect(component.filteredAlerts().map((alert) => alert.id)).toEqual([
      'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      'fedcba98-7654-3210-fedc-ba9876543210',
    ]);
  });

  it('maps pollution levels to colors', () => {
    expect(component.getPollutionColor('Good')).toBe('success');
    expect(component.getPollutionColor('Moderate')).toBe('warning');
    expect(component.getPollutionColor('Unhealthy')).toBe('error');
    expect(component.getPollutionColor('Very Unhealthy')).toBe('critical');
    expect(component.getPollutionColor('Hazardous')).toBe('critical');
  });
});