import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AirQualityAlertsComponent } from './air-quality-alerts.component';
import { AlertsService, ApiAlert } from '../../../../core/services/alerts.service';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { AirPollutionSensorReading } from '../../models/sensor-reading.models';

describe('AirQualityAlertsComponent', () => {
  let component: AirQualityAlertsComponent;
  let fixture: ComponentFixture<AirQualityAlertsComponent>;
  let mockAlertsService: any;
  let mockSensorService: any;

  beforeEach(async () => {
    mockAlertsService = {
      getAlerts: vi.fn(),
      deleteAlert: vi.fn()
    };
    mockSensorService = {
      getAirPollutionReadingById: vi.fn()
    };
    
    const mockApiAlerts: ApiAlert[] = [
      {
        id: '1',
        sensorType: 'AIR_POLLUTION',
        location: 'Downtown',
        metric: 'PM2_5',
        triggeredValue: 90,
        thresholdValue: 80,
        alertType: 'ABOVE',
        triggeredAt: new Date().toISOString(),
        readingId: '123'
      }
    ];

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

    mockAlertsService.getAlerts.mockReturnValue(of(mockApiAlerts));
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
  });

  it('maps pollution levels to colors', () => {
    expect(component.getPollutionColor('Good')).toBe('success');
    expect(component.getPollutionColor('Moderate')).toBe('warning');
    expect(component.getPollutionColor('Unhealthy')).toBe('error');
    expect(component.getPollutionColor('Very Unhealthy')).toBe('critical');
    expect(component.getPollutionColor('Hazardous')).toBe('critical');
  });

  it('deletes alert when deleteAlert is called', () => {
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'stopPropagation');
    
    component.deleteAlert('1', event);
    
    expect(spy).toHaveBeenCalled();
    expect(mockAlertsService.deleteAlert).toHaveBeenCalledWith('1');
    expect(component.airQualityAlerts()).toHaveLength(0);
  });
});