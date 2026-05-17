import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom, of, Subject, type Observable } from 'rxjs';
import { vi } from 'vitest';
import { Settings } from './settings';
import { SettingsService } from '../../core/services/settings.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockSettingsService: {
    getSettings: ReturnType<typeof vi.fn>;
    loadSensorConfig: ReturnType<typeof vi.fn>;
    getSensorConfig: ReturnType<typeof vi.fn>;
    saveSettings: ReturnType<typeof vi.fn>;
    saveSensorConfig: ReturnType<typeof vi.fn>;
    deleteSetting: ReturnType<typeof vi.fn>;
  };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let dialogClosed$: Subject<boolean | undefined>;

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

    dialogClosed$ = new Subject<boolean | undefined>();
    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => dialogClosed$.asObservable(),
      }),
    };

    mockRouter = {
      navigate: vi.fn(),
    };
    mockSettingsService = {
      getSettings: vi.fn().mockReturnValue(of([])),
      loadSensorConfig: vi.fn().mockReturnValue(
        of({
          trafficReadingInterval: 60,
          airQualityReadingInterval: 60,
          streetLightReadingInterval: 60,
        }),
      ),
      getSensorConfig: vi.fn(),
      saveSettings: vi.fn(),
      saveSensorConfig: vi.fn(),
      deleteSetting: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    })
      .overrideProvider(MatDialog, { useValue: mockDialog })
      .compileComponents();

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

  it('asks for confirmation when dirty and returns the user choice', async () => {
    component.isDirty.set(true);

    const deactivate$ = component.canDeactivate() as Observable<boolean>;
    expect(mockDialog.open).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          message: expect.stringMatching(/unsaved changes/i),
        }),
      }),
    );

    const canLeavePromise = firstValueFrom(deactivate$);
    dialogClosed$.next(false);
    await expect(canLeavePromise).resolves.toBe(false);
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
