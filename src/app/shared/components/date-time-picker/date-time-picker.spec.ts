import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { vi } from 'vitest';

import { DateTimePicker } from './date-time-picker';

describe('DateTimePicker', () => {
  let component: DateTimePicker;
  let fixture: ComponentFixture<DateTimePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateTimePicker],
    }).compileComponents();

    fixture = TestBed.createComponent(DateTimePicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('syncs date and time inputs into display state', () => {
    const selected = new Date(2026, 0, 15);

    component.value = selected;
    component.timeValue = '14:05';
    component.ngOnChanges({
      value: new SimpleChange(null, selected, false),
      timeValue: new SimpleChange('', '14:05', false),
    });
    component.includeTime.set(true);

    expect(component.selectedDate()).toBe(selected);
    expect(component.timeHour()).toBe(2);
    expect(component.timeMinute()).toBe(5);
    expect(component.isPM()).toBe(true);
    expect(component.displayValue()).toContain('02:05 PM');
  });

  it('clears time state when the external date value is cleared', () => {
    component.includeTime.set(true);
    component.timeHour.set(10);
    component.timeMinute.set(30);
    component.isPM.set(true);

    component.value = null;
    component.ngOnChanges({
      value: new SimpleChange(new Date(2026, 0, 15), null, false),
    });

    expect(component.selectedDate()).toBeNull();
    expect(component.includeTime()).toBe(false);
    expect(component.timeHour()).toBeNull();
    expect(component.timeMinute()).toBeNull();
    expect(component.isPM()).toBe(false);
  });

  it('builds a six-week calendar grid and navigates months', () => {
    component.currentMonth.set(new Date(2026, 6, 1));

    expect(component.calendarDays()).toHaveLength(42);
    expect(component.monthLabel()).toBe('July 2026');

    component.prevMonth();
    expect(component.monthLabel()).toBe('June 2026');

    component.nextMonth();
    expect(component.monthLabel()).toBe('July 2026');
  });

  it('selects past dates and rejects future dates', () => {
    const valueSpy = vi.spyOn(component.valueChange, 'emit');
    const pastDate = new Date(2020, 0, 15);
    const futureDate = new Date(new Date().getFullYear() + 1, 0, 1);

    component.selectDate(pastDate);
    expect(component.selectedDate()).toBe(pastDate);
    expect(valueSpy).toHaveBeenCalledWith(pastDate);

    component.selectDate(futureDate);
    expect(component.selectedDate()).toBe(pastDate);
  });

  it('toggles time selection and emits formatted values', () => {
    const timeSpy = vi.spyOn(component.timeValueChange, 'emit');

    component.selectedDate.set(new Date(2020, 0, 15));
    component.toggleIncludeTime();

    expect(component.includeTime()).toBe(true);
    expect(component.timeHour()).toBe(12);
    expect(component.timeMinute()).toBe(0);
    expect(timeSpy).toHaveBeenCalledWith('00:00');

    component.timeHour.set(3);
    component.timeMinute.set(5);
    component.togglePeriod();
    expect(component.isPM()).toBe(true);
    expect(timeSpy).toHaveBeenCalledWith('15:05');

    component.toggleIncludeTime();
    expect(component.includeTime()).toBe(false);
    expect(component.timeHour()).toBeNull();
    expect(component.timeMinute()).toBeNull();
    expect(timeSpy).toHaveBeenCalledWith('');
  });

  it('closes on outside click and escape', () => {
    component.isOpen.set(true);
    component.onDocumentClick(new MouseEvent('click'));
    expect(component.isOpen()).toBe(false);

    component.isOpen.set(true);
    component.onEscape();
    expect(component.isOpen()).toBe(false);
  });

  it('renders the calendar popup and handles template navigation', () => {
    component.currentMonth.set(new Date(2020, 0, 1));
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    nativeElement.querySelector<HTMLButtonElement>('[data-testid="dtp-trigger"]')?.click();
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-testid="dtp-popup"]')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.dtp-weekday')).toHaveLength(7);
    expect(nativeElement.querySelectorAll('.dtp-day')).toHaveLength(42);
    expect(nativeElement.querySelector('.dtp-month-label')?.textContent).toContain('January 2020');

    nativeElement.querySelectorAll<HTMLButtonElement>('.dtp-nav-btn')[1]?.click();
    fixture.detectChanges();
    expect(component.monthLabel()).toBe('February 2020');

    const dayButton = Array.from(nativeElement.querySelectorAll<HTMLButtonElement>('.dtp-day:not(.other-month)'))
      .find((button) => button.textContent?.trim() === '15');
    dayButton?.click();
    fixture.detectChanges();
    expect(component.selectedDate()?.getDate()).toBe(15);
  });

  it('renders time controls from the template', () => {
    component.selectedDate.set(new Date(2020, 0, 15));
    component.isOpen.set(true);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    nativeElement.querySelector<HTMLElement>('.dtp-toggle-row')?.click();
    fixture.detectChanges();

    expect(component.includeTime()).toBe(true);
    expect(nativeElement.querySelector('[data-testid="dtp-hour-input"]')).toBeTruthy();
    expect(nativeElement.querySelector('[data-testid="dtp-minute-input"]')).toBeTruthy();
    expect(nativeElement.querySelectorAll('.dtp-period-btn')).toHaveLength(2);
  });
});
