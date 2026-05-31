import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrafficDashboard } from './traffic-dashboard';

describe('TrafficDashboard', () => {
  let component: TrafficDashboard;
  let fixture: ComponentFixture<TrafficDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrafficDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(TrafficDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
