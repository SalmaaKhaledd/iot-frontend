import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { StreetLightAlertsComponent } from './street-light-alerts.component';
import { AlertsService, ApiAlert } from '../../../../core/services/alerts.service';
import { SensorReadingsService } from '../../../../core/services/sensor-readings.service';
import { StreetLightSensorReading } from '../../../../core/models/sensor-reading.models';

const mockApiAlert: ApiAlert = {
  id: '1',
  sensorType: 'STREET_LIGHT',
  location: 'Alex Corniche',
  metric: 'BRIGHTNESS',
  triggeredValue: 90,
  thresholdValue: 80,
  alertType: 'ABOVE',
  triggeredAt: new Date().toISOString(),
  readingId: '123'
};

const mockReading: StreetLightSensorReading = {
  id: '123',
  location: 'Alex Corniche',
  timestamp: new Date().toISOString(),
  brightnessLevel: 90,
  powerConsumption: 150,
  status: 'ON'
};

describe('StreetLightAlertsComponent', () => {
  let component: StreetLightAlertsComponent;
  let fixture: ComponentFixture<StreetLightAlertsComponent>;
  let mockAlertsService: any;
  let mockSensorService: any;

  beforeEach(async () => {
    mockAlertsService = {
      getAlerts: vi.fn(),
      getAlertsBySensor: vi.fn(),
      deleteAlert: vi.fn()
    };
    mockSensorService = {
      getStreetLightReadingById: vi.fn()
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
    mockSensorService.getStreetLightReadingById.mockReturnValue(of(mockReading));

    await TestBed.configureTestingModule({
      imports: [StreetLightAlertsComponent],
      providers: [
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: SensorReadingsService, useValue: mockSensorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreetLightAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the alert list from service', () => {
    expect(component.streetLightAlerts()).toHaveLength(1);
    expect(component.filteredAlerts()).toHaveLength(1);
  });

  it('toggles the filter panel state', () => {
    expect(component.isFiltersOpen()).toBe(false);
    component.toggleFilters();
    expect(component.isFiltersOpen()).toBe(true);
    component.toggleFilters();
    expect(component.isFiltersOpen()).toBe(false);
  });

  it('reloads the first page with selected status', async () => {
    mockAlertsService.getAlertsBySensor.mockClear();
    component.setStatus('on');
    await fixture.whenStable();
    expect(component.currentPage()).toBe(1);
    expect(mockAlertsService.getAlertsBySensor).toHaveBeenLastCalledWith(
      'STREET_LIGHT', 0, 10, { status: 'ON' }
    );
  });

  it('renders shared status filter chips', () => {
    component.isFiltersOpen.set(true);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('app-chip-filter .chip');

    expect(chips.length).toBe(3);
    expect(chips[1].textContent?.trim()).toBe('ON');
    expect(chips[2].textContent?.trim()).toBe('OFF');
  });

  it('maps status to colors', () => {
    expect(component.getStatusColor('on')).toBe('success');
    expect(component.getStatusColor('off')).toBe('inactive');
    expect(component.getStatusColor('unknown')).toBe('inactive');
  });

  it('deletes alert when deleteAlert is called', () => {
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'stopPropagation');
    component.deleteAlert('1', event);
    expect(spy).toHaveBeenCalled();
    expect(mockAlertsService.deleteAlert).toHaveBeenCalledWith('1');
    expect(component.streetLightAlerts()).toHaveLength(0);
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
    fixture = TestBed.createComponent(StreetLightAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.streetLightAlerts()).toHaveLength(1);
    expect(component.streetLightAlerts()[0].brightness).toBe(0);
  });

  it('handles sensor reading fetch error gracefully', async () => {
    mockSensorService.getStreetLightReadingById.mockReturnValue(
      throwError(() => new Error('fetch failed'))
    );
    fixture = TestBed.createComponent(StreetLightAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.streetLightAlerts()).toHaveLength(1);
    expect(component.streetLightAlerts()[0].brightness).toBe(0);
  });

  it('handles empty alert list', async () => {
    mockAlertsService.getAlertsBySensor.mockReturnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
    }));
    fixture = TestBed.createComponent(StreetLightAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.streetLightAlerts()).toHaveLength(0);
  });
});
