import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { StreetLightCardComponent } from './street-light-card.component';
import { SensorReadingsService } from '../../../../core/services/sensor-readings.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { StreetLightSensorReading } from '../../../../core/models/sensor-reading.models';

describe('StreetLightCardComponent', () => {
  let component: StreetLightCardComponent;
  let fixture: ComponentFixture<StreetLightCardComponent>;
  let mockSensorService: any;
  let mockSettingsService: any;

  beforeEach(async () => {
    mockSensorService = {
      getStreetLightReadings: vi.fn()
    };
    mockSettingsService = {
      getSettings: vi.fn(),
      getSensorConfig: vi.fn()
    };

    const mockReadings: StreetLightSensorReading[] = [
      {
        id: '1',
        location: 'Downtown',
        timestamp: new Date().toISOString(),
        brightnessLevel: 80,
        powerConsumption: 40,
        status: 'ON'
      }
    ];

    mockSensorService.getStreetLightReadings.mockReturnValue(of({
      content: mockReadings,
      totalElements: mockReadings.length,
      totalPages: 1,
      number: 0,
      size: mockReadings.length,
    }));
    mockSettingsService.getSettings.mockReturnValue(of([]));
    mockSettingsService.getSensorConfig.mockReturnValue(of({ streetLightReadingInterval: 60 } as any));

    await TestBed.configureTestingModule({
      imports: [StreetLightCardComponent],
      providers: [
        { provide: SensorReadingsService, useValue: mockSensorService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreetLightCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.refresh();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('exposes the latest reading and history', () => {
    expect(component.readingHistory()).toHaveLength(1);
    expect(component.selectedReading()?.id).toBe('1');
  });

  it('updates the selected reading index', () => {
    component.onSelectReading(0);
    expect(component.selectedReadingIndex()).toBe(0);
  });

  it('derives totals from the configured light list', () => {
    expect(component.totalLights()).toBe(1);
    expect(component.lightsOn()).toBe(1);
    expect(component.lightsOff()).toBe(0);
    expect(component.averageBrightness()).toBe(80);
    expect(component.powerUsage()).toBe(40);
  });

  it('handles openSensorAlerts event', async () => {
    vi.useFakeTimers();

    const mockEvent = new CustomEvent('openSensorAlerts', {
      detail: { sensorType: 'street-light', alertId: '123' }
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
