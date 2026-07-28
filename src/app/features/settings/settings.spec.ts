import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Observable, Subject } from 'rxjs';
import { vi } from 'vitest';
import { Settings } from './settings';
import { SettingsService, type ThresholdSetting } from '../../core/services/settings.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import type { SensorConfiguration } from './settings.types';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockRouter: any;
  let mockSettingsService: any;

  const sensorConfig: SensorConfiguration = {
    trafficReadingInterval: 60,
    airQualityReadingInterval: 60,
    streetLightReadingInterval: 60
  };

  function persistedThreshold(overrides: Partial<ThresholdSetting> = {}): ThresholdSetting {
    return {
      id: 'setting-1',
      type: 'TRAFFIC',
      metric: 'TRAFFIC_DENSITY',
      thresholdValue: 250,
      alertType: 'ABOVE',
      createdAt: '2026-07-28T00:00:00Z',
      ...overrides,
    };
  }

  function createComponent(): Settings {
    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    mockRouter = {
      navigate: vi.fn()
    };

    mockSettingsService = {
      getSettings: vi.fn(),
      getSensorConfig: vi.fn(),
      loadSensorConfig: vi.fn(),
      saveSettings: vi.fn(),
      saveSensorConfig: vi.fn(),
      deleteSetting: vi.fn()
    };

    mockSettingsService.getSettings.mockReturnValue(of([]));
    mockSettingsService.getSensorConfig.mockReturnValue(of(sensorConfig));
    mockSettingsService.loadSensorConfig.mockReturnValue(of(sensorConfig));
    mockSettingsService.saveSensorConfig.mockReturnValue(of(sensorConfig));

    await TestBed.configureTestingModule({
      imports: [Settings, MatDialogModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SettingsService, useValue: mockSettingsService },
      ]
    }).compileComponents();

  });

  it('creates the page with the default categories', () => {
    createComponent();

    expect(component.categories()).toHaveLength(3);
    expect(component.categories()[0].id).toBe('traffic');
  });

  it('starts on the thresholds tab and can switch tabs', () => {
    createComponent();

    expect(component.activeTab()).toBe('thresholds');
    component.setActiveTab('configuration');
    expect(component.activeTab()).toBe('configuration');
  });

  it('navigates home from the toolbar action', () => {
    createComponent();

    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('allows navigation when there are no unsaved changes', () => {
    createComponent();

    expect(component.canDeactivate()).toBe(true);
  });


  it('toggles a single threshold condition and marks the page dirty', () => {
    createComponent();

    const metric = component.categories()[0].metrics[0];
    const threshold = metric.thresholds[0];
    threshold.value = 10;
    component.toggleCondition(metric, threshold);

    expect(metric.thresholds[0].condition).toBe('below');
    expect(component.isDirty()).toBe(true);
  });

  it('adds a missing threshold and keeps above before below', () => {
    createComponent();

    const metric = component.categories()[0].metrics[0];
    component.addThreshold(metric);

    expect(metric.thresholds).toHaveLength(2);
    expect(metric.thresholds[0].condition).toBe('above');
    expect(metric.thresholds[1].condition).toBe('below');

    metric.thresholds[1].value = 50;
    component.checkForChanges();
    expect(component.isDirty()).toBe(true);
  });

  it('removes a threshold from the matched metric', () => {
    createComponent();

    const metric = component.categories()[0].metrics[0];
    component.addThreshold(metric);
    const thresholdId = metric.thresholds[1].id;

    component.removeThreshold(metric, thresholdId);

    expect(metric.thresholds).toHaveLength(1);
    expect(metric.thresholds[0].condition).toBe('above');
  });

  it('deletes the original threshold before saving when a persisted condition changes', () => {
    const deleteSubject = new Subject<void>();
    mockSettingsService.getSettings.mockReturnValue(of([persistedThreshold()]));
    mockSettingsService.deleteSetting.mockReturnValue(deleteSubject.asObservable());
    mockSettingsService.saveSettings.mockReturnValue(of([]));
    createComponent();

    const metric = component.categories()[0].metrics[0];
    component.toggleCondition(metric, metric.thresholds[0]);

    component.saveChanges();

    expect(mockSettingsService.deleteSetting).toHaveBeenCalledWith('setting-1');
    expect(mockSettingsService.saveSettings).not.toHaveBeenCalled();

    deleteSubject.next();
    deleteSubject.complete();

    expect(mockSettingsService.saveSettings).toHaveBeenCalledWith([
      {
        type: 'TRAFFIC',
        metric: 'TRAFFIC_DENSITY',
        thresholdValue: 250,
        alertType: 'BELOW'
      }
    ]);
  });

  it('saves value-only changes without deleting the persisted threshold', () => {
    mockSettingsService.getSettings.mockReturnValue(of([persistedThreshold({ thresholdValue: 200 })]));
    mockSettingsService.saveSettings.mockReturnValue(of([]));
    createComponent();

    const metric = component.categories()[0].metrics[0];
    metric.thresholds[0].value = 250;

    component.saveChanges();

    expect(mockSettingsService.deleteSetting).not.toHaveBeenCalled();
    expect(mockSettingsService.saveSettings).toHaveBeenCalledWith([
      {
        type: 'TRAFFIC',
        metric: 'TRAFFIC_DENSITY',
        thresholdValue: 250,
        alertType: 'ABOVE'
      }
    ]);
  });

  it('deletes a persisted threshold when its value is cleared', () => {
    mockSettingsService.getSettings.mockReturnValue(of([persistedThreshold()]));
    mockSettingsService.deleteSetting.mockReturnValue(of(undefined));
    createComponent();

    const metric = component.categories()[0].metrics[0];
    metric.thresholds[0].value = null;

    component.saveChanges();

    expect(mockSettingsService.deleteSetting).toHaveBeenCalledWith('setting-1');
    expect(mockSettingsService.saveSettings).not.toHaveBeenCalled();
  });
});
