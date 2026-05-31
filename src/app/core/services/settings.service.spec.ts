import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { take } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';
import type { SensorConfiguration } from '../../features/settings/settings.types';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;
  let authService: { getUser: ReturnType<typeof vi.fn>; currentUser: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = {
      getUser: vi.fn().mockReturnValue({ id: 'user-1' }),
      currentUser: vi.fn().mockReturnValue({ id: 'user-1' }),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    });

    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads sensor intervals from the api and updates the shared cache', () => {
    const observed: SensorConfiguration[] = [];

    service.getSensorConfig().pipe(take(2)).subscribe((value) => {
      observed.push(value);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/intervals');
    expect(request.request.method).toBe('GET');
    request.flush([{
      id: 'interval-1',
      userId: 'user-1',
      trafficInterval: 7,
      airPollutionInterval: 11,
      streetLightInterval: 13,
    }]);

    expect(observed.at(-1)).toEqual({
      trafficReadingInterval: 7,
      airQualityReadingInterval: 11,
      streetLightReadingInterval: 13,
    });
  });

  it('saves sensor intervals with PUT api/intervals using the loaded id', () => {
    service.getSensorConfig().subscribe();

    const loadRequest = httpMock.expectOne('http://localhost:8080/api/intervals');
    loadRequest.flush([{
      id: 'interval-1',
      userId: 'user-1',
      trafficInterval: 5,
      airPollutionInterval: 10,
      streetLightInterval: 15,
    }]);

    let savedConfig: unknown;
    service.saveSensorConfig({
      trafficReadingInterval: 9,
      airQualityReadingInterval: 12,
      streetLightReadingInterval: 18,
    }).subscribe((value) => {
      savedConfig = value;
    });

    const saveRequest = httpMock.expectOne('http://localhost:8080/api/intervals');
    expect(saveRequest.request.method).toBe('PUT');
    expect(saveRequest.request.body).toEqual({
      id: 'interval-1',
      userId: 'user-1',
      trafficInterval: 9,
      airPollutionInterval: 12,
      streetLightInterval: 18,
    });

    saveRequest.flush({
      id: 'interval-1',
      trafficInterval: 9,
      airPollutionInterval: 12,
      streetLightInterval: 18,
    });

    expect(savedConfig).toEqual({
      trafficReadingInterval: 9,
      airQualityReadingInterval: 12,
      streetLightReadingInterval: 18,
    });
  });
});
