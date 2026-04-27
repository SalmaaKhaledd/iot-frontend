import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap, throwError } from 'rxjs';

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

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/users`, payload);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.get<JsonServerUser[]>(`${this.baseUrl}/users`).pipe(
      map((users) =>
        users.find(
          (user) =>
            user.email === payload.email && user.password === payload.password,
        ) ?? null,
      ),
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
    );
  }

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }
}
