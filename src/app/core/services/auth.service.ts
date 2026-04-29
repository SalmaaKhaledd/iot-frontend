import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { AuthResponse, User } from '../models/user.model';
import type { RegisterRequest } from '../models/auth.models';

export interface RegisterSuccessResponse {
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly tokenStorageKey = 'auth_token';
  private readonly userStorageKey = 'iot_user';

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, {
      email,
      password,
    });
  }

  register(user: RegisterRequest): Observable<RegisterSuccessResponse> {
    return this.http.post<RegisterSuccessResponse>(
      `${this.baseUrl}/auth/register`,
      user,
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/users/me`);
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
