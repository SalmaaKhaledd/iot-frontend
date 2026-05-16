import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TrafficSensorCardComponent } from './traffic-sensor-card.component';
import { SensorReadingsService } from '../../services/sensor-readings.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { TrafficSensorReading } from '../../models/sensor-reading.models';

describe('TrafficSensorCardComponent', () => {
  let component: TrafficSensorCardComponent;
  let fixture: ComponentFixture<TrafficSensorCardComponent>;
  let mockSensorService: any;
  let mockSettingsService: any;

  beforeEach(async () => {
    mockSensorService = {
      getTrafficReadings: vi.fn()
    };
    mockSettingsService = {
      getSettings: vi.fn(),
      getSensorConfig: vi.fn()
    };

    const mockReadings: TrafficSensorReading[] = [
      {
        id: '1',
        location: 'Main St',
        timestamp: new Date().toISOString(),
        trafficDensity: 80,
        avgSpeed: 25,
        congestionLevel: 'HIGH'
      }
    ];

    mockSensorService.getTrafficReadings.mockReturnValue(of(mockReadings));
    mockSettingsService.getSettings.mockReturnValue(of([]));
    mockSettingsService.getSensorConfig.mockReturnValue(of({ trafficReadingInterval: 60 } as any));

    await TestBed.configureTestingModule({
      imports: [TrafficSensorCardComponent],
      providers: [
        { provide: SensorReadingsService, useValue: mockSensorService },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrafficSensorCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

  it('tracks hovered bar index', () => {
    expect(component.hoveredIndex()).toBeNull();
    component.hoveredIndex.set(2);
    expect(component.hoveredIndex()).toBe(2);
    component.hoveredIndex.set(null);
    expect(component.hoveredIndex()).toBeNull();
  });

  it('handles openSensorAlerts event', async () => {
    vi.useFakeTimers();

    const mockEvent = new CustomEvent('openSensorAlerts', {
      detail: { sensorType: 'traffic', alertId: '123' }
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