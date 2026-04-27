import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap, throwError, timeout } from 'rxjs';

import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../models/auth.models';
import { environment } from '../../../environments/environment';

type JsonServerUser = User & { password: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly tokenStorageKey = 'auth_token';
  private readonly userStorageKey = 'iot_user';

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/users`, payload);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.get<JsonServerUser[]>(`${this.baseUrl}/users`).pipe(
      map((users) => {
        console.log('users from mock:', users);
        console.log('payload:', payload);
        const found = users.find(
          (user) =>
            user.email === payload.email && user.password === payload.password,
        ) ?? null;
        console.log('matched user:', found);
        return found;
      }),
      switchMap((matchedUser) => {
        if (!matchedUser) {
          return throwError(() => new Error('Invalid credentials'));
        }
        const { password: _password, ...userWithoutPassword } = matchedUser;
        return of({
          token: 'mock-jwt-token',
          user: userWithoutPassword as User,
        });
      }),
      timeout(8000),
    );
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  saveUser(user: User): void {
    localStorage.setItem(this.userStorageKey, JSON.stringify(user));
  }

  getUser(): User | null {
    const rawUser = localStorage.getItem(this.userStorageKey);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
  }
}
