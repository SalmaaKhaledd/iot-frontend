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

  it('filters alerts by severity and AQI level', () => {
    component.setSeverity('warning');
    component.setAqi('moderate');

    expect(component.filteredAlerts().map((alert) => alert.id)).toEqual([
      'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      'fedcba98-7654-3210-fedc-ba9876543210',
    ]);
  });

  it('maps severity and AQI thresholds to colors', () => {
    expect(component.getSeverityColor('critical')).toBe('critical');
    expect(component.getSeverityColor('warning')).toBe('warning');
    expect(component.getSeverityColor('info')).toBe('info');

    expect(component.getAQIColor(40)).toBe('success');
    expect(component.getAQIColor(88)).toBe('warning');
    expect(component.getAQIColor(140)).toBe('error');
    expect(component.getAQIColor(180)).toBe('critical');
  });
});