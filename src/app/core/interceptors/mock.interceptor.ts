import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { User } from '../models/user.model';
import { STRONG_PASSWORD_PATTERN } from '../validation/auth-validation.constants';

type MockUser = User & { password: string };
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const mockUsers: MockUser[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    profilePicture: null,
    password: 'Password123!', // NOSONAR
  },
  {
    id: '2',
    firstName: 'Farida',
    lastName: 'Khaled',
    email: 'faridakhaled05@gmail.com',
    profilePicture: null,
    password: 'Farida123!', // NOSONAR
  },
];

/** Dev tokens encode the user id so profile routes survive a full page reload. */
const MOCK_JWT_PREFIX = 'mock-jwt-';

function getPathname(url: string): string {
  try {
    return url.startsWith('http')
      ? new URL(url).pathname
      : new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

function bearerToken(req: HttpRequest<unknown>): string | null {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  const raw = header.slice('Bearer '.length).trim();
  return raw.length > 0 ? raw : null;
}

function sessionUserFromRequest(req: HttpRequest<unknown>): User | null {
  const token = bearerToken(req);
  if (!token?.startsWith(MOCK_JWT_PREFIX)) {
    return null;
  }
  const userId = token.slice(MOCK_JWT_PREFIX.length);
  const found = mockUsers.find((user) => user.id === userId);
  if (!found) {
    return null;
  }
  const { password: _, ...withoutPassword } = found;
  return withoutPassword;
}

interface MockIntervalSettings {
  id: string;
  userId: string;
  trafficInterval: number;
  airPollutionInterval: number;
  streetLightInterval: number;
}

interface MockAlert {
  id: string;
  sensorType: 'TRAFFIC' | 'AIR_POLLUTION' | 'STREET_LIGHT';
  location: string;
  metric: string;
  triggeredValue: number;
  thresholdValue: number;
  alertType: 'ABOVE' | 'BELOW';
  triggeredAt: string;
  readingId?: string | null;
  readAt?: string | null;
}

const mockIntervalSettings = new Map<string, MockIntervalSettings>();

function defaultIntervalSettings(userId: string): MockIntervalSettings {
  return {
    id: `interval-${userId}`,
    userId,
    trafficInterval: 5,
    airPollutionInterval: 5,
    streetLightInterval: 5,
  };
}

function intervalSettingsFor(userId: string): MockIntervalSettings {
  const existing = mockIntervalSettings.get(userId);
  if (existing) {
    return existing;
  }
  const created = defaultIntervalSettings(userId);
  mockIntervalSettings.set(userId, created);
  return created;
}

// In-memory alert store — DELETE mutates this so subsequent GET reflects dismissals
let mockAlerts: MockAlert[] = [
  {
    id: 'alert-1',
    sensorType: 'TRAFFIC',
    location: 'CAIRO_RING_ROAD',
    metric: 'TRAFFIC_DENSITY',
    triggeredValue: 480.0,
    thresholdValue: 400.0,
    alertType: 'ABOVE' as const,
    triggeredAt: '2026-05-26T10:05:00',
  },
  {
    id: 'alert-2',
    sensorType: 'TRAFFIC',
    location: 'CAIRO_OCTOBER_BRIDGE',
    metric: 'AVG_SPEED',
    triggeredValue: 15.0,
    thresholdValue: 20.0,
    alertType: 'BELOW' as const,
    triggeredAt: '2026-05-26T10:03:00',
  },
  {
    id: 'alert-3',
    sensorType: 'TRAFFIC',
    location: 'CAIRO_SALAH_SALEM_ROAD',
    metric: 'TRAFFIC_DENSITY',
    triggeredValue: 210.0,
    thresholdValue: 200.0,
    alertType: 'ABOVE' as const,
    triggeredAt: '2026-05-26T09:58:00',
  },
];

export const mockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMock) {
    return next(req);
  }

  const path = getPathname(req.url);

  // TODO: remove when backend is ready
  if (req.method === 'POST' && path.endsWith('/api/auth/register')) {
    const requestBody = req.body as
      | {
          firstName?: string;
          lastName?: string;
          email?: string;
          password?: string;
        }
      | null;

    const firstName = String(requestBody?.firstName ?? '').trim();
    const lastName = String(requestBody?.lastName ?? '').trim();
    const email = String(requestBody?.email ?? '').trim().toLowerCase();
    const password = String(requestBody?.password ?? '');

    const validationMessages: string[] = [];
    if (!email) {
      validationMessages.push('email is required');
    } else if (!EMAIL_PATTERN.test(email)) {
      validationMessages.push('invalid email format');
    }
    if (!firstName) {
      validationMessages.push('first name is required');
    } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(firstName)) {
      validationMessages.push('invalid first name');
    }
    if (!lastName) {
      validationMessages.push('last name is required');
    } else if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(lastName)) {
      validationMessages.push('invalid last name');
    }
    if (!password) {
      validationMessages.push('password is required');
    } else {
      if (password.length < 8) {
        validationMessages.push('password must be at least 8 characters long');
      } else if (password.length > 64) {
        validationMessages.push('password too long. 64 characters is the maximum');
      }
      if (!STRONG_PASSWORD_PATTERN.test(password)) {
        validationMessages.push(
          'password must contain at least one uppercase letter, one lowercase letter, one number, and one of @ $ ! % * ? &',
        );
      }
    }

    if (validationMessages.length > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: validationMessages,
            },
          }),
      ).pipe(delay(300));
    }

    const emailExists = mockUsers.some(
      (user) => user.email.toLowerCase() === email,
    );

    if (emailExists) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
            error: {
              status: 409,
              error: 'Conflict',
              message: 'Email already exists.',
            },
          }),
      ).pipe(delay(300));
    }

    const newUser: MockUser = {
      id: String(Date.now()),
      firstName,
      lastName,
      email,
      password,
      profilePicture: null,
    };
    mockUsers.push(newUser);

    return of(
      new HttpResponse({
        status: 201,
        body: {
          userId: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profilePicture: null,
          token: `${MOCK_JWT_PREFIX}${newUser.id}`,
          message: 'User registered successfully.',
        },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'POST' && path.endsWith('/api/auth/login')) {
    const requestBody = req.body as
      | { email?: string; password?: string }
      | null;
    const email = String(requestBody?.email ?? '').toLowerCase();
    const password = String(requestBody?.password ?? '');

    const validationMessages: string[] = [];
    if (!email) {
      validationMessages.push('email is required');
    } else if (!EMAIL_PATTERN.test(email)) {
      validationMessages.push('invalid email format');
    }
    if (!password) {
      validationMessages.push('password is required');
    } else if (password.length < 8) {
      validationMessages.push('password must be at least 8 characters long');
    } else if (password.length > 64) {
      validationMessages.push('password too long. 64 characters is the maximum');
    }

    if (validationMessages.length > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: validationMessages,
            },
          }),
      ).pipe(delay(300));
    }

    const matchedUser = mockUsers.find(
      (user) =>
        user.email.toLowerCase() === email && user.password === password,
    );

    if (!matchedUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Invalid email or password.',
            },
          }),
      ).pipe(delay(300));
    }

    const { password: _, ...userWithoutPassword } = matchedUser;

    const body = {
      userId: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      profilePicture: userWithoutPassword.profilePicture ?? null,
      token: `${MOCK_JWT_PREFIX}${userWithoutPassword.id}`,
      message: 'Login successful.',
    };
    return of(
      new HttpResponse({
        status: 200,
        body,
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && path.endsWith('/api/user/profile')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    return of(
      new HttpResponse({
        status: 200,
        body: {
          userId: sessionUser.id,
          firstName: sessionUser.firstName,
          lastName: sessionUser.lastName,
          email: sessionUser.email,
          profilePicture: sessionUser.profilePicture,
        },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && path.endsWith('/api/intervals')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    return of(
      new HttpResponse({
        status: 200,
        body: intervalSettingsFor(sessionUser.id),
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'PUT' && path.endsWith('/api/intervals')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const requestBody = req.body as
      | {
          trafficInterval?: number;
          airPollutionInterval?: number;
          streetLightInterval?: number;
        }
      | null;

    const saved: MockIntervalSettings = {
      id: `interval-${sessionUser.id}`,
      userId: sessionUser.id,
      trafficInterval: Number(requestBody?.trafficInterval ?? 5),
      airPollutionInterval: Number(requestBody?.airPollutionInterval ?? 5),
      streetLightInterval: Number(requestBody?.streetLightInterval ?? 5),
    };
    mockIntervalSettings.set(sessionUser.id, saved);

    return of(
      new HttpResponse({
        status: 200,
        body: saved,
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'PATCH' && path.endsWith('/api/user/profile/password')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const requestBody = req.body as
      | { currentPassword?: string; newPassword?: string }
      | null;
    const currentPassword = String(requestBody?.currentPassword ?? '');
    const newPassword = String(requestBody?.newPassword ?? '');

    const validationMessages: string[] = [];
    if (!currentPassword) {
      validationMessages.push('current password is required');
    }
    if (!newPassword) {
      validationMessages.push('new password is required');
    } else {
      if (newPassword.length < 8) {
        validationMessages.push('password must at least 8 characters long');
      } else if (newPassword.length > 64) {
        validationMessages.push('password too long. 64 characters is the maximum');
      }
      if (!STRONG_PASSWORD_PATTERN.test(newPassword)) {
        validationMessages.push(
          'password must contain at least one uppercase letter, one lowercase letter, one number, and one of @ $ ! % * ? &',
        );
      }
    }

    if (validationMessages.length > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: validationMessages,
            },
          }),
      ).pipe(delay(300));
    }

    const userIndex = mockUsers.findIndex((user) => user.id === sessionUser.id);
    if (userIndex < 0 || mockUsers[userIndex].password !== currentPassword) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Current password is incorrect.',
            },
          }),
      ).pipe(delay(300));
    }

    mockUsers[userIndex].password = newPassword;
    return of(
      new HttpResponse({
        status: 200,
        body: { message: 'Password updated successfully.' },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'PATCH' && path.endsWith('/api/user/profile/picture')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const requestBody = req.body as FormData;
    const profilePictureFile = requestBody?.get('file');

    if (!profilePictureFile) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              status: 400,
              error: 'Bad Request',
              message: 'Profile picture is required.',
            },
          }),
      ).pipe(delay(300));
    }

    const userIndex = mockUsers.findIndex((user) => user.id === sessionUser.id);
    let profilePicture: string | null = null;
    if (userIndex >= 0) {
      profilePicture = `https://cdn.example.test/profile-pictures/${sessionUser.id}/user_mock_1715000000.jpeg`;
      mockUsers[userIndex].profilePicture = profilePicture;
    }

    return of(
      new HttpResponse({
        status: 200,
        body: {
          message: 'Profile picture updated successfully.',
          profilePicture,
        },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && path.endsWith('/api/user/profile/picture')) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    // Return a dummy blob
    const dummyBlob = new Blob(['dummy image content'], { type: 'image/jpeg' });
    return of(new HttpResponse({ status: 200, body: dummyBlob })).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && /\/api\/sensors\/traffic$/.test(path)) {
    const allReadings: Array<{
      id: string;
      location: string;
      timestamp: string;
      trafficDensity: number;
      avgSpeed: number;
      congestionLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    }> = [
      { id: '1', location: 'CAIRO_RING_ROAD',        timestamp: '2026-05-26T10:47:01', trafficDensity: 187, avgSpeed: 35, congestionLevel: 'HIGH' },
      { id: '2', location: 'CAIRO_OCTOBER_BRIDGE',   timestamp: '2026-05-26T10:46:01', trafficDensity: 121, avgSpeed: 28, congestionLevel: 'MODERATE' },
      { id: '3', location: 'CAIRO_SALAH_SALEM_ROAD', timestamp: '2026-05-26T10:45:01', trafficDensity: 54,  avgSpeed: 62, congestionLevel: 'LOW' },
      { id: '4', location: 'CAIRO_RING_ROAD',        timestamp: '2026-05-26T10:44:01', trafficDensity: 139, avgSpeed: 41, congestionLevel: 'MODERATE' },
      { id: '5', location: 'CAIRO_OCTOBER_BRIDGE',   timestamp: '2026-05-26T10:43:01', trafficDensity: 38,  avgSpeed: 70, congestionLevel: 'LOW' },
      { id: '6', location: 'CAIRO_RING_ROAD',        timestamp: '2026-05-26T10:42:01', trafficDensity: 165, avgSpeed: 37, congestionLevel: 'HIGH' },
      { id: '7', location: 'CAIRO_SALAH_SALEM_ROAD', timestamp: '2026-05-26T10:41:01', trafficDensity: 92,  avgSpeed: 55, congestionLevel: 'MODERATE' },
      { id: '8', location: 'CAIRO_OCTOBER_BRIDGE',   timestamp: '2026-05-26T10:40:01', trafficDensity: 210, avgSpeed: 22, congestionLevel: 'SEVERE' },
    ];

    // Parse query params directly from the request URL
    const p = req.params;
    const page       = Number(p.get('page')  ?? '0');
    const size       = Number(p.get('size')  ?? '20');
    const sortBy     = p.get('sortBy')  ?? 'timestamp';
    const sortDir    = p.get('sortDir') ?? 'desc';
    const location        = p.get('location')        ?? '';
    const congestionLevel = p.get('congestionLevel') ?? '';
    const minDensity = p.get('minDensity') !== null ? Number(p.get('minDensity')) : null;
    const maxDensity = p.get('maxDensity') !== null ? Number(p.get('maxDensity')) : null;
    const minSpeed   = p.get('minSpeed')   !== null ? Number(p.get('minSpeed'))   : null;
    const maxSpeed   = p.get('maxSpeed')   !== null ? Number(p.get('maxSpeed'))   : null;
    const tsStart    = p.get('timestampStart') ?? '';
    const tsEnd      = p.get('timestampEnd')   ?? '';
    console.log('location filter:', p.get('location'), '| page:', page, '| size:', size);
    console.log('req.url:', req.url);
    console.log('req.params keys:', req.params.keys());
    console.log('req.params toString:', req.params.toString());

    // Filter
    let filtered = allReadings.filter(r => {
      if (location        && !r.location.includes(location))              return false;
      if (congestionLevel && r.congestionLevel !== congestionLevel)        return false;
      if (minDensity !== null && r.trafficDensity < minDensity)            return false;
      if (maxDensity !== null && r.trafficDensity > maxDensity)            return false;
      if (minSpeed   !== null && r.avgSpeed < minSpeed)                    return false;
      if (maxSpeed   !== null && r.avgSpeed > maxSpeed)                    return false;
      if (tsStart && r.timestamp < tsStart)                                return false;
      if (tsEnd   && r.timestamp > tsEnd)                                  return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      if (sortBy === 'trafficDensity') { aVal = a.trafficDensity; bVal = b.trafficDensity; }
      else if (sortBy === 'avgSpeed')  { aVal = a.avgSpeed;       bVal = b.avgSpeed; }
      else                             { aVal = a.timestamp;      bVal = b.timestamp; }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const totalElements = filtered.length;
    const totalPages    = Math.max(1, Math.ceil(totalElements / size));
    const safePage      = Math.min(page, totalPages - 1);
    const content       = filtered.slice(safePage * size, safePage * size + size);

    return of(new HttpResponse({
      status: 200,
      body: {
        content,
        totalElements,
        totalPages,
        number: safePage,
        size,
      },
    })).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && /\/api\/sensors\/air-pollution$/.test(path)) {
    const allReadings: Array<{
      id: string;
      location: string;
      timestamp: string;
      pm2_5: number;
      pm10: number;
      co: number;
      no2: number;
      so2: number;
      ozone: number;
      pollutionLevel: 'GOOD' | 'MODERATE' | 'UNHEALTHY' | 'VERY_UNHEALTHY' | 'HAZARDOUS';
    }> = [
      { id: '1', location: 'CAIRO_NASR_CITY',   timestamp: '2026-06-27T10:47:01', pm2_5: 12.5, pm10: 25.0, co: 0.5, no2: 0.04, so2: 0.02, ozone: 0.08, pollutionLevel: 'MODERATE' },
      { id: '2', location: 'CAIRO_MAADI',       timestamp: '2026-06-27T10:46:01', pm2_5: 8.1,  pm10: 18.0, co: 0.3, no2: 0.02, so2: 0.01, ozone: 0.05, pollutionLevel: 'GOOD' },
      { id: '3', location: 'CAIRO_HELIOPOLIS',  timestamp: '2026-06-27T10:45:01', pm2_5: 38.0, pm10: 70.0, co: 1.2, no2: 0.09, so2: 0.06, ozone: 0.14, pollutionLevel: 'UNHEALTHY' },
      { id: '4', location: 'CAIRO_NASR_CITY',   timestamp: '2026-06-27T10:44:01', pm2_5: 55.0, pm10: 110.0, co: 2.0, no2: 0.13, so2: 0.09, ozone: 0.18, pollutionLevel: 'VERY_UNHEALTHY' },
      { id: '5', location: 'CAIRO_MAADI',       timestamp: '2026-06-27T10:43:01', pm2_5: 90.0, pm10: 180.0, co: 3.4, no2: 0.20, so2: 0.15, ozone: 0.24, pollutionLevel: 'HAZARDOUS' },
      { id: '6', location: 'CAIRO_HELIOPOLIS',  timestamp: '2026-06-27T10:42:01', pm2_5: 10.2, pm10: 22.0, co: 0.4, no2: 0.03, so2: 0.02, ozone: 0.06, pollutionLevel: 'GOOD' },
      { id: '7', location: 'CAIRO_NASR_CITY',   timestamp: '2026-06-27T10:41:01', pm2_5: 20.0, pm10: 42.0, co: 0.8, no2: 0.06, so2: 0.04, ozone: 0.10, pollutionLevel: 'MODERATE' },
      { id: '8', location: 'CAIRO_MAADI',       timestamp: '2026-06-27T10:40:01', pm2_5: 45.0, pm10: 88.0, co: 1.6, no2: 0.11, so2: 0.07, ozone: 0.16, pollutionLevel: 'UNHEALTHY' },
    ];

    const p = req.params;
    const page     = Number(p.get('page') ?? '0');
    const size     = Number(p.get('size') ?? '20');
    const sortBy   = p.get('sortBy')  ?? 'timestamp';
    const sortDir  = p.get('sortDir') ?? 'desc';
    const location       = p.get('location')       ?? '';
    const pollutionLevel = p.get('pollutionLevel') ?? '';
    const tsStart  = p.get('timestampStart') ?? '';
    const tsEnd    = p.get('timestampEnd')   ?? '';

    let filtered = allReadings.filter(r => {
      if (location       && !r.location.includes(location))  return false;
      if (pollutionLevel && r.pollutionLevel !== pollutionLevel) return false;
      if (tsStart && r.timestamp < tsStart)                  return false;
      if (tsEnd   && r.timestamp > tsEnd)                    return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      if (sortBy === 'co')         { aVal = a.co;        bVal = b.co; }
      else if (sortBy === 'ozone') { aVal = a.ozone;     bVal = b.ozone; }
      else                         { aVal = a.timestamp; bVal = b.timestamp; }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const totalElements = filtered.length;
    const totalPages    = Math.max(1, Math.ceil(totalElements / size));
    const safePage      = Math.min(page, totalPages - 1);
    const content       = filtered.slice(safePage * size, safePage * size + size);

    return of(new HttpResponse({
      status: 200,
      body: { content, totalElements, totalPages, number: safePage, size },
    })).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && /\/api\/sensors\/street-lights$/.test(path)) {
    const allReadings: Array<{
      id: string;
      location: string;
      timestamp: string;
      brightnessLevel: number;
      powerConsumption: number;
      status: 'ON' | 'OFF';
    }> = [
      { id: '1', location: 'CAIRO_ZAMALEK',    timestamp: '2026-06-27T10:47:01', brightnessLevel: 85, powerConsumption: 120.5, status: 'ON' },
      { id: '2', location: 'CAIRO_DOWNTOWN',   timestamp: '2026-06-27T10:46:01', brightnessLevel: 0,  powerConsumption: 5.0,   status: 'OFF' },
      { id: '3', location: 'CAIRO_NEW_CAIRO',  timestamp: '2026-06-27T10:45:01', brightnessLevel: 60, powerConsumption: 95.0,  status: 'ON' },
      { id: '4', location: 'CAIRO_ZAMALEK',    timestamp: '2026-06-27T10:44:01', brightnessLevel: 0,  powerConsumption: 4.5,   status: 'OFF' },
      { id: '5', location: 'CAIRO_DOWNTOWN',   timestamp: '2026-06-27T10:43:01', brightnessLevel: 100, powerConsumption: 150.0, status: 'ON' },
      { id: '6', location: 'CAIRO_NEW_CAIRO',  timestamp: '2026-06-27T10:42:01', brightnessLevel: 40, powerConsumption: 70.0,  status: 'ON' },
      { id: '7', location: 'CAIRO_ZAMALEK',    timestamp: '2026-06-27T10:41:01', brightnessLevel: 0,  powerConsumption: 5.5,   status: 'OFF' },
      { id: '8', location: 'CAIRO_DOWNTOWN',   timestamp: '2026-06-27T10:40:01', brightnessLevel: 75, powerConsumption: 110.0, status: 'ON' },
    ];

    const p = req.params;
    const page     = Number(p.get('page') ?? '0');
    const size     = Number(p.get('size') ?? '20');
    const sortBy   = p.get('sortBy')  ?? 'timestamp';
    const sortDir  = p.get('sortDir') ?? 'desc';
    const location = p.get('location') ?? '';
    const status   = p.get('status')   ?? '';
    const tsStart  = p.get('timestampStart') ?? '';
    const tsEnd    = p.get('timestampEnd')   ?? '';

    let filtered = allReadings.filter(r => {
      if (location && !r.location.includes(location)) return false;
      if (status   && r.status !== status)            return false;
      if (tsStart && r.timestamp < tsStart)           return false;
      if (tsEnd   && r.timestamp > tsEnd)             return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      if (sortBy === 'powerConsumption')   { aVal = a.powerConsumption; bVal = b.powerConsumption; }
      else if (sortBy === 'brightnessLevel') { aVal = a.brightnessLevel; bVal = b.brightnessLevel; }
      else                                 { aVal = a.timestamp;       bVal = b.timestamp; }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const totalElements = filtered.length;
    const totalPages    = Math.max(1, Math.ceil(totalElements / size));
    const safePage      = Math.min(page, totalPages - 1);
    const content       = filtered.slice(safePage * size, safePage * size + size);

    return of(new HttpResponse({
      status: 200,
      body: { content, totalElements, totalPages, number: safePage, size },
    })).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && /\/api\/sensors\/air-pollution\/stats$/.test(path)) {
    return of(new HttpResponse({
      status: 200,
      body: {
        avgCo: 0.5,
        avgOzone: 0.08,
        alertsTriggered: 2,
        pollutionLevelDistribution: { GOOD: 1, MODERATE: 2 },
        dailyAverages: [
          { date: '2026-06-25', avgCo: 0.48, avgOzone: 0.07 },
          { date: '2026-06-26', avgCo: 0.51, avgOzone: 0.08 },
          { date: '2026-06-27', avgCo: 0.53, avgOzone: 0.09 },
        ],
      },
    })).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && /\/api\/sensors\/street-lights\/stats$/.test(path)) {
    return of(new HttpResponse({
      status: 200,
      body: {
        avgBrightness: 85,
        avgPowerConsumption: 120.5,
        alertsTriggered: 1,
        statusDistribution: { ON: 2, OFF: 1 },
        dailyAverages: [
          { date: '2026-06-25', avgBrightness: 83, avgPowerConsumption: 118.0 },
          { date: '2026-06-26', avgBrightness: 85, avgPowerConsumption: 120.5 },
          { date: '2026-06-27', avgBrightness: 87, avgPowerConsumption: 122.0 },
        ],
      },
    })).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'GET' && /\/api\/sensors\/traffic\/stats$/.test(path)) {
    return of(new HttpResponse({
      status: 200,
      body: {
        avgTrafficDensity: 65,
        avgSpeed: 45,
        alertsTriggered: 3,
        congestionLevelDistribution: { LOW: 1, MODERATE: 2 },
        dailyAverages: [
          { date: '2026-06-25', avgTrafficDensity: 60, avgSpeed: 47 },
          { date: '2026-06-26', avgTrafficDensity: 65, avgSpeed: 45 },
          { date: '2026-06-27', avgTrafficDensity: 70, avgSpeed: 43 },
        ],
      },
    })).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  if (req.method === 'PATCH' && /\/api\/alerts\/(?!flush)[^/]+\/read$/.test(path)) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const pathSegments = path.split('/');
    const alertId = pathSegments.at(-2);
    const alert = mockAlerts.find((candidate) => candidate.id === alertId);

    if (!alert) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            error: {
              status: 404,
              error: 'Not Found',
              message: 'Alert not found.',
            },
          }),
      ).pipe(delay(300));
    }

    alert.readAt ??= new Date().toISOString();

    return of(
      new HttpResponse({
        status: 200,
        body: { message: 'Alert marked as read.' },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  // DELETE must be checked before GET to avoid the /alerts$ regex accidentally
  // matching a path that still has an id segment on it.
  // Negative lookahead excludes /api/alerts/flush so flush is not treated as a dismiss.
  if (req.method === 'DELETE' && /\/api\/alerts\/(?!flush)[^/]+$/.test(path)) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const alertId = path.split('/').pop()!;
    const exists = mockAlerts.some(a => a.id === alertId);

    if (!exists) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            error: {
              status: 404,
              error: 'Not Found',
              // Exact string from tester reference — trailing period is intentional
              message: 'Alert not found.',
            },
          }),
      ).pipe(delay(300));
    }

    mockAlerts = mockAlerts.filter(a => a.id !== alertId);

    return of(
      new HttpResponse({
        status: 200,
        body: { message: 'Alert dismissed successfully.' },
      }),
    ).pipe(delay(300));
  }

  // TODO: remove when backend is ready
  // GET /api/alerts requires Bearer — backend calls getCurrentUser() with no null
  // check on the Authorization header, so a missing token causes 500 not 401.
  // The mock mirrors this strictness to catch integration issues early.
  if (req.method === 'GET' && /\/api\/alerts$/.test(path)) {
    const sessionUser = sessionUserFromRequest(req);
    if (!sessionUser) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: {
              status: 401,
              error: 'Unauthorized',
              message: 'Access denied. Invalid or missing token.',
            },
          }),
      ).pipe(delay(300));
    }

    const content = mockAlerts.map((alert) => ({ ...alert }));
    return of(
      new HttpResponse({
        status: 200,
        // Spread into a new array so mutations to mockAlerts don't affect
        // already-emitted responses
        body: {
          content,
          totalElements: content.length,
          totalPages: 1,
          number: 0,
          size: 20,
        },
      }),
    ).pipe(delay(300));
  }

  return next(req);
};
