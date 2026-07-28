import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AirQualityAlertsComponent } from './air-quality-alerts.component';
import { AlertsService, ApiAlert } from '../../../../core/services/alerts.service';
import { SensorReadingsService } from '../../../../core/services/sensor-readings.service';
import { AirPollutionSensorReading } from '../../../../core/models/sensor-reading.models';

const mockApiAlert: ApiAlert = {
  id: '1',
  sensorType: 'AIR_POLLUTION',
  location: 'Downtown',
  metric: 'PM2_5',
  triggeredValue: 90,
  thresholdValue: 80,
  alertType: 'ABOVE',
  triggeredAt: new Date().toISOString(),
  readingId: '123'
};

const mockReading: AirPollutionSensorReading = {
  id: '123',
  location: 'Downtown',
  timestamp: new Date().toISOString(),
  pm2_5: 50,
  pm10: 100,
  co: 25,
  ozone: 150,
  no2: 200,
  so2: 100,
  pollutionLevel: 'VERY_UNHEALTHY'
};

describe('AirQualityAlertsComponent', () => {
  let component: AirQualityAlertsComponent;
  let fixture: ComponentFixture<AirQualityAlertsComponent>;
  let mockAlertsService: any;
  let mockSensorService: any;

  beforeEach(async () => {
    mockAlertsService = {
      getAlerts: vi.fn(),
      getAlertsBySensor: vi.fn(),
      deleteAlert: vi.fn()
    };
    mockSensorService = {
      getAirPollutionReadingById: vi.fn()
    };

    mockAlertsService.getAlerts.mockReturnValue(of([mockApiAlert]));
    mockAlertsService.getAlertsBySensor.mockReturnValue(of({
      content: [mockApiAlert],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    }));
    mockAlertsService.deleteAlert.mockReturnValue(of(undefined));
    mockSensorService.getAirPollutionReadingById.mockReturnValue(of(mockReading));

    await TestBed.configureTestingModule({
      imports: [AirQualityAlertsComponent],
      providers: [
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: SensorReadingsService, useValue: mockSensorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AirQualityAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the alert list from service', () => {
    expect(component.airQualityAlerts()).toHaveLength(1);
    expect(component.filteredAlerts()).toHaveLength(1);
  });

  it('toggles the filter panel state', () => {
    expect(component.isFiltersOpen()).toBe(false);
    component.toggleFilters();
    expect(component.isFiltersOpen()).toBe(true);
    component.toggleFilters();
    expect(component.isFiltersOpen()).toBe(false);
  });

  it('reloads the first page with selected pollution level', async () => {
    mockAlertsService.getAlertsBySensor.mockClear();
    component.setPollution('hazardous');
    await fixture.whenStable();
    expect(component.currentPage()).toBe(1);
    expect(mockAlertsService.getAlertsBySensor).toHaveBeenLastCalledWith(
      'AIR_POLLUTION', 0, 10, { pollutionLevel: 'HAZARDOUS' }
    );
  });

  it('maps pollution levels to colors', () => {
    expect(component.getPollutionColor('Good')).toBe('success');
    expect(component.getPollutionColor('Moderate')).toBe('warning');
    expect(component.getPollutionColor('Unhealthy')).toBe('error');
    expect(component.getPollutionColor('Very Unhealthy')).toBe('critical');
    expect(component.getPollutionColor('Hazardous')).toBe('critical');
    expect(component.getPollutionColor('Unknown')).toBe('info');
  });

  it('deletes alert when deleteAlert is called', () => {
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'stopPropagation');
    component.deleteAlert('1', event);
    expect(spy).toHaveBeenCalled();
    expect(mockAlertsService.deleteAlert).toHaveBeenCalledWith('1');
    expect(component.airQualityAlerts()).toHaveLength(0);
  });

  it('decrements totalElements after delete', () => {
    const event = new MouseEvent('click');
    component.deleteAlert('1', event);
    expect(component.totalElements()).toBe(0);
  });

  it('advances to next page when available', () => {
    component.totalElements.set(15);
    component.currentPage.set(1);
    component.nextPage();
    expect(component.currentPage()).toBe(2);
  });

  it('does not advance past last page', () => {
    component.totalElements.set(10);
    component.currentPage.set(1);
    component.nextPage();
    expect(component.currentPage()).toBe(1);
  });

  it('goes to previous page when not on first page', () => {
    component.currentPage.set(2);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('does not go below page 1', () => {
    component.currentPage.set(1);
    component.prevPage();
    expect(component.currentPage()).toBe(1);
  });

  it('uses fallback object when readingId is null', async () => {
    const alertWithoutReading: ApiAlert = { ...mockApiAlert, readingId: null };
    mockAlertsService.getAlertsBySensor.mockReturnValue(of({
      content: [alertWithoutReading],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
    }));
    fixture = TestBed.createComponent(AirQualityAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.airQualityAlerts()).toHaveLength(1);
    expect(component.airQualityAlerts()[0].pm2_5).toBe(0);
  });

  it('handles sensor reading fetch error gracefully', async () => {
    mockSensorService.getAirPollutionReadingById.mockReturnValue(
      throwError(() => new Error('fetch failed'))
    );
    fixture = TestBed.createComponent(AirQualityAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.airQualityAlerts()).toHaveLength(1);
    expect(component.airQualityAlerts()[0].pm2_5).toBe(0);
  });

  it('handles empty alert list', async () => {
    mockAlertsService.getAlertsBySensor.mockReturnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
    }));
    fixture = TestBed.createComponent(AirQualityAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.airQualityAlerts()).toHaveLength(0);
  });
});