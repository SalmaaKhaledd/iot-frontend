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
    expect(component.faultyLights()).toBe(0);
    expect(component.powerUsage()).toBe(78);
  });

  it('rounds brightness into a power estimate', () => {
    expect(component.computePower(0)).toBe(0);
    expect(component.computePower(51)).toBe(26);
  });

  it('updates the selected light brightness with clamping', () => {
    component.onBrightnessChange('SL-003', '120');

    const updatedLight = component.lights().find((light) => light.id === 'SL-003');
    expect(updatedLight?.brightness).toBe(100);
    expect(component.powerUsage()).toBe(128);
  });

  it('ignores invalid brightness values', () => {
    const before = component.lights();

    component.onBrightnessChange('SL-001', 'not-a-number');

    expect(component.lights()).toBe(before);
  });
});