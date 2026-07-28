import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-date-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './date-time-picker.html',
  styleUrl: './date-time-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimePicker implements OnChanges {
  private readonly elRef = inject(ElementRef);

  @Input() value: Date | null = null;
  @Input() timeValue: string = '';
  @Input() placeholder: string = 'Pick date & time';
  @Output() valueChange = new EventEmitter<Date | null>();
  @Output() timeValueChange = new EventEmitter<string>();

  readonly isOpen = signal(false);
  readonly includeTime = signal(false);
  readonly selectedDate = signal<Date | null>(null);
  readonly currentMonth = signal(new Date());
  readonly timeHour = signal<number | null>(null);
  readonly timeMinute = signal<number | null>(null);
  readonly isPM = signal(false);

  // True when the selected date is today — drives all future-time restrictions
  readonly isSelectedToday = computed(() => {
    const sel = this.selectedDate();
    return sel ? this.isToday(sel) : false;
  });

  // When today is selected, PM is only available if the current time is PM
  readonly isPMDisabled = computed(() => {
    if (!this.isSelectedToday()) return false;
    return new Date().getHours() < 12;
  });

  // Maximum hour (12h) selectable given the current period and today constraint
  readonly maxHour = computed(() => {
    if (!this.isSelectedToday()) return 12;
    const now = new Date();
    const h24 = now.getHours();
    const currentlyPM = h24 >= 12;
    const h12 = h24 % 12 || 12;
    // Only restrict when the selected period matches the current period
    return this.isPM() === currentlyPM ? h12 : 12;
  });

  // Maximum minute selectable — restricted only when at the max hour
  readonly maxMinute = computed(() => {
    if (!this.isSelectedToday()) return 59;
    const now = new Date();
    const h24 = now.getHours();
    const m = now.getMinutes();
    const h12 = h24 % 12 || 12;
    const currentlyPM = h24 >= 12;
    const atMaxHour = this.isPM() === currentlyPM && (this.timeHour() ?? 12) >= h12;
    return atMaxHour ? m : 59;
  });

  readonly displayValue = computed(() => {
    const date = this.selectedDate();
    if (!date) return null;
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    if (this.includeTime()) {
      const h = this.timeHour() ?? 12;
      const m = this.timeMinute() ?? 0;
      const period = this.isPM() ? 'PM' : 'AM';
      return `${dateStr} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    }
    return dateStr;
  });

  readonly calendarDays = computed(() => {
    const month = this.currentMonth();
    const year = month.getFullYear();
    const mon = month.getMonth();

    const firstDay = new Date(year, mon, 1).getDay();
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    const daysInPrev = new Date(year, mon, 0).getDate();

    const days: { date: Date; currentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, mon - 1, daysInPrev - i), currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, mon, i), currentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, mon + 1, i), currentMonth: false });
    }

    return days;
  });

  readonly monthLabel = computed(() =>
    this.currentMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.selectedDate.set(this.value);
      if (!this.value) {
        this.includeTime.set(false);
        this.timeHour.set(null);
        this.timeMinute.set(null);
        this.isPM.set(false);
      }
    }
    if (changes['timeValue'] && this.timeValue) {
      const parts = this.timeValue.split(':');
      const h24 = Number.parseInt(parts[0]) || 0;
      const m = Number.parseInt(parts[1]) || 0;
      const pm = h24 >= 12;
      const h12 = h24 % 12 || 12;
      this.timeHour.set(h12);
      this.timeMinute.set(m);
      this.isPM.set(pm);
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  prevMonth(): void {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.selectDate(today);
  }

  isFuture(date: Date): boolean {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateMidnight > todayMidnight;
  }

  selectDate(date: Date): void {
    if (this.isFuture(date)) return;
    this.selectedDate.set(date);
    this.valueChange.emit(date);
    // If today is selected while time is open, clamp to current time immediately
    if (this.includeTime() && this.isToday(date)) {
      this.setToCurrentTime();
    }
  }

  isSelected(date: Date): boolean {
    const sel = this.selectedDate();
    if (!sel) return false;
    return date.getFullYear() === sel.getFullYear() &&
      date.getMonth() === sel.getMonth() &&
      date.getDate() === sel.getDate();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  }

  toggleIncludeTime(): void {
    this.includeTime.update(v => !v);
    if (!this.includeTime()) {
      this.timeHour.set(null);
      this.timeMinute.set(null);
      this.isPM.set(false);
      this.timeValueChange.emit('');
    } else {
      if (this.isSelectedToday()) {
        // Default to current time so the initial value is never in the future
        this.setToCurrentTime();
      } else {
        this.timeHour.set(12);
        this.timeMinute.set(0);
        this.isPM.set(false);
        this.timeValueChange.emit('00:00');
      }
    }
  }

  togglePeriod(): void {
    // Prevent switching to PM when today is selected and current time is AM
    if (!this.isPM() && this.isPMDisabled()) return;
    this.isPM.update(v => !v);
    this.clampTimeToNow();
    this.emitTime();
  }

  onTimeSegmentChange(): void {
    this.clampTimeToNow();
    this.emitTime();
  }

  // Clamps hour and minute to not exceed current time when today is selected
  private clampTimeToNow(): void {
    if (!this.isSelectedToday()) return;
    const maxH = this.maxHour();
    const currentHour = this.timeHour() ?? 1;
    if (currentHour > maxH) {
      this.timeHour.set(maxH);
    }
    const maxM = this.maxMinute();
    const currentMinute = this.timeMinute() ?? 0;
    if (currentMinute > maxM) {
      this.timeMinute.set(maxM);
    }
  }

  // Sets time inputs to the current wall-clock time
  private setToCurrentTime(): void {
    const now = new Date();
    const h24 = now.getHours();
    const m = now.getMinutes();
    const h12 = h24 % 12 || 12;
    const pm = h24 >= 12;
    this.timeHour.set(h12);
    this.timeMinute.set(m);
    this.isPM.set(pm);
    this.emitTime();
  }

  private emitTime(): void {
    const h12 = this.timeHour() ?? 12;
    const m = this.timeMinute() ?? 0;
    const pm = this.isPM();
    let h24 = h12 % 12;
    if (pm) h24 += 12;
    const formatted = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    this.timeValueChange.emit(formatted);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }
}