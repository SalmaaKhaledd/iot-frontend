import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Settings } from './settings';
import { SettingsService } from '../../core/services/settings.service';
import { SensorMetric } from './settings.types';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockRouter: any;
  let mockSettingsService: any;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
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
      saveSettings: vi.fn(),
      saveSensorConfig: vi.fn(),
      deleteSetting: vi.fn()
    };

    mockSettingsService.getSettings.mockReturnValue(of([]));
    mockSettingsService.getSensorConfig.mockReturnValue(of({
      trafficReadingInterval: 60,
      airQualityReadingInterval: 60,
      streetLightReadingInterval: 60
    }));

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SettingsService, useValue: mockSettingsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the page with the default categories', () => {
    expect(component.categories()).toHaveLength(3);
    expect(component.categories()[0].id).toBe('traffic');
  });

  it('starts on the thresholds tab and can switch tabs', () => {
    expect(component.activeTab()).toBe('thresholds');
    component.setActiveTab('configuration');
    expect(component.activeTab()).toBe('configuration');
  });

  it('navigates home from the toolbar action', () => {
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('allows navigation when there are no unsaved changes', () => {
    expect(component.canDeactivate()).toBe(true);
  });

  it('asks for confirmation when dirty and returns the user choice', () => {
    component.isDirty.set(true);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    expect(component.canDeactivate()).toBe(false);
    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved changes. Do you want to leave without saving?'
    );
  });

  it('toggles a single threshold condition and marks the page dirty', () => {
    const metric = component.categories()[0].metrics[0];
    const threshold = metric.thresholds[0];
    threshold.value = 10; // Give it a value so it's tracked
    component.toggleCondition(metric, threshold);

    expect(metric.thresholds[0].condition).toBe('below');
    expect(component.isDirty()).toBe(true);
  });

  it('adds a missing threshold and keeps above before below', () => {
    const metric = component.categories()[0].metrics[0];
    component.addThreshold(metric);

    expect(metric.thresholds).toHaveLength(2);
    expect(metric.thresholds[0].condition).toBe('above');
    expect(metric.thresholds[1].condition).toBe('below');
    
    // Simulate setting a value on the new threshold
    metric.thresholds[1].value = 50;
    component.checkForChanges();
    expect(component.isDirty()).toBe(true);
  });

  it('removes a threshold from the matched metric', () => {
    const metric = component.categories()[0].metrics[0];
    component.addThreshold(metric);
    const thresholdId = metric.thresholds[1].id;

    component.removeThreshold(metric, thresholdId);

    expect(metric.thresholds).toHaveLength(1);
    expect(metric.thresholds[0].condition).toBe('above');
  });
});
