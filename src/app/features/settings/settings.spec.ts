import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { Settings, type SensorMetric } from './settings';

describe('Settings', () => {
  let component: Settings;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerSpy = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    component = TestBed.createComponent(Settings).componentInstance;
  });

  it('creates the page with the default categories', () => {
    expect(component.categories()).toHaveLength(3);
    expect(component.categories()[0].id).toBe('traffic');
  });

  it('navigates home from the toolbar action', () => {
    component.goHome();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('allows navigation when there are no unsaved changes', () => {
    expect(component.canDeactivate()).toBe(true);
  });

  it('asks for confirmation when dirty and returns the user choice', () => {
    component.markDirty();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    expect(component.canDeactivate()).toBe(false);
    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved changes. Do you want to leave without saving?',
    );

    confirmSpy.mockRestore();
  });

  it('clears the dirty state when saving changes', () => {
    component.markDirty();

    component.saveChanges();

    expect(component.isDirty()).toBe(false);
  });

  it('enforces the upper threshold when above is not higher than below', () => {
    const metric: SensorMetric = {
      id: 'custom',
      label: 'Custom',
      unit: 'units',
      placeholder: 'Enter a value',
      min: 0,
      max: 100,
      thresholds: [
        { id: 'above', condition: 'above', value: 10 },
        { id: 'below', condition: 'below', value: 20 },
      ],
    };

    component.enforceConstraint(metric, metric.thresholds[0]);

    expect(metric.thresholds[0].value).toBe(21);
    expect(metric.thresholds[1].value).toBe(20);
  });

  it('toggles a single threshold condition and marks the page dirty', () => {
    const metric = component.categories()[0].metrics[0];
    const threshold = metric.thresholds[0];

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
    expect(component.isDirty()).toBe(true);
  });

  it('removes a threshold from the matched metric', () => {
    const metric = component.categories()[0].metrics[0];
    component.addThreshold(metric);
    const thresholdId = metric.thresholds[1].id;

    component.removeThreshold(metric, thresholdId);

    expect(metric.thresholds).toHaveLength(1);
    expect(metric.thresholds[0].condition).toBe('above');
    expect(component.isDirty()).toBe(true);
  });
});
