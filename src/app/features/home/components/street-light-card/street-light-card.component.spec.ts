import { TestBed } from '@angular/core/testing';

import { StreetLightCardComponent } from './street-light-card.component';

describe('StreetLightCardComponent', () => {
  let component: StreetLightCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreetLightCardComponent],
    }).compileComponents();

    component = TestBed.createComponent(StreetLightCardComponent).componentInstance;
  });

  it('derives totals from the configured light list', () => {
    expect(component.totalLights()).toBe(3);
    expect(component.lightsOn()).toBe(2);
    expect(component.lightsOff()).toBe(1);
    expect(component.averageBrightness()).toBe(52);
    expect(component.powerUsage()).toBe(76.5);
  });

  it('formats timestamps without changing the value', () => {
    expect(component.formatTimestamp('2026-05-12T08:22:00')).toBe('May 12, 2026, 8:22 AM');
  });
});