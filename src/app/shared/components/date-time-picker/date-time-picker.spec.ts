import { ComponentFixture, TestBed } from '@angular/core/testing';

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
});
