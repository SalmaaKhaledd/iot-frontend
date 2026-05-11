import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { User, UserProfileResponse } from '../models/user.model';
import type {
  AuthApiSuccessResponse,
  MessageResponse,
  RegisterRequest,
  UpdatePasswordRequest,
  UpdateProfilePictureRequest,
} from '../models/auth.models';

//one shared singleton instance of the AuthService
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly tokenStorageKey = 'iot_auth_token';
  private readonly userStorageKey = 'iot_user';
  readonly currentUser = signal<User | null>(this.getUser());

  login(email: string, password: string): Observable<AuthApiSuccessResponse> {
    return this.http.post<AuthApiSuccessResponse>(`${this.baseUrl}/auth/login`, {
      email,
      password,
    });
  }

  register(user: RegisterRequest): Observable<AuthApiSuccessResponse> {
    return this.http.post<AuthApiSuccessResponse>(
      `${this.baseUrl}/auth/register`,
      user,
    );
  }

  getMe(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/user/profile`);
  }

  updatePassword(payload: UpdatePasswordRequest): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(
      `${this.baseUrl}/user/profile/password`,
      payload,
    );
  }

  updateProfilePicture(
    payload: UpdateProfilePictureRequest,
  ): Observable<MessageResponse> {
    return this.http.patch<MessageResponse>(
      `${this.baseUrl}/user/profile/picture`,
      payload,
    );
  }

  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/auth/logout`, {});
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  saveUser(user: User): void {
    localStorage.setItem(this.userStorageKey, JSON.stringify(user));
    this.currentUser.set(user);
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

  clearSession(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
    this.currentUser.set(null);
  }
}
