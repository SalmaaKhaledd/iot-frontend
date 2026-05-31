import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AirQualitySensorCardComponent } from './air-quality-sensor-card.component';
import { SensorReadingsService } from '../../../../core/services/sensor-readings.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { AirPollutionSensorReading } from '../../../../core/models/sensor-reading.models';

describe('AirQualitySensorCardComponent', () => {
  let component: AirQualitySensorCardComponent;
  let fixture: ComponentFixture<AirQualitySensorCardComponent>;
  let mockSensorService: any;
  let mockSettingsService: any;

  beforeEach(async () => {
    mockSensorService = {
      getAirPollutionReadings: vi.fn()
    };
    mockSettingsService = {
      getSettings: vi.fn(),
      getSensorConfig: vi.fn()
    };

    const mockReadings: AirPollutionSensorReading[] = [
      {
        id: '1',
        location: 'Downtown',
        timestamp: new Date().toISOString(),
        pm2_5: 50,
        pm10: 100,
        co: 25,
        ozone: 150,
        no2: 200,
        so2: 100,
        pollutionLevel: 'VERY_UNHEALTHY'
      }
    ];

    mockSensorService.getAirPollutionReadings.mockReturnValue(of(mockReadings));
    mockSettingsService.getSettings.mockReturnValue(of([]));
    mockSettingsService.getSensorConfig.mockReturnValue(of({ airQualityReadingInterval: 60 } as any));

    await TestBed.configureTestingModule({
      imports: [AirQualitySensorCardComponent],
      providers: [
        { provide: SensorReadingsService, useValue: mockSensorService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AirQualitySensorCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.refresh();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('exposes the latest reading and history', () => {
    expect(component.readingHistory()).toHaveLength(1);
    expect(component.latestReading()?.id).toBe('1');
    expect(component.selectedSensorData()?.id).toBe('1');
  });

  it('updates the selected reading index', () => {
    component.onSelectReading(0);
    expect(component.selectedReadingIndex()).toBe(0);
  });

  it('exposes the full pollution sensor schema', () => {
    const sensor = component.selectedSensorData();
    expect(sensor).toBeTruthy();
    if (sensor) {
      expect(sensor.location).toBeTruthy();
      expect(sensor.timestamp).toBeTruthy();
      expect(sensor.pm2_5).toBeGreaterThanOrEqual(0);
      expect(sensor.pm10).toBeGreaterThanOrEqual(0);
      expect(sensor.no2).toBeGreaterThanOrEqual(0);
      expect(sensor.so2).toBeGreaterThanOrEqual(0);
    }
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
    expect(component.recommendationText()).toContain('very unhealthy');
  });

  it('handles openSensorAlerts event', async () => {
    vi.useFakeTimers();

    const mockEvent = new CustomEvent('openSensorAlerts', {
      detail: { sensorType: 'air-quality', alertId: '123' }
    });

    const mockEl = document.createElement('div');
    mockEl.id = 'alert-123';
    document.body.appendChild(mockEl);

    mockEl.scrollIntoView = vi.fn();
    const spy = mockEl.scrollIntoView;
    
    component.onOpenSensorAlerts(mockEvent);
    expect(component.showAlerts()).toBe(true);

    vi.advanceTimersByTime(100);
    expect(spy).toHaveBeenCalled();
    expect(mockEl.classList.contains('highlight-alert')).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(mockEl.classList.contains('highlight-alert')).toBe(false);

    document.body.removeChild(mockEl);
    vi.useRealTimers();
  });
});
