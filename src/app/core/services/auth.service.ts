import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { clearProfilePictureCache } from '../utils/profile-picture-cache';
import { environment } from '../../../environments/environment';
import type { User, UserProfileResponse } from '../models/user.model';
import type {
  AuthApiSuccessResponse,
  MessageResponse,
  RegisterRequest,
  UpdatePasswordRequest,
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
    }).pipe(
      timeout(10000), // 10 second timeout
    );
  }

  register(user: RegisterRequest): Observable<AuthApiSuccessResponse> {
    return this.http.post<AuthApiSuccessResponse>(
      `${this.baseUrl}/auth/register`,
      user,
    ).pipe(
      timeout(10000), // 10 second timeout
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

  updateProfilePicture(file: File): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.patch<MessageResponse>(
      `${this.baseUrl}/user/profile/picture`,
      formData,
    );
  }

  /** Downloads profile picture bytes from GET /api/user/profile/picture. */
  getProfilePicture(cacheBust = false): Observable<Blob> {
    let url = `${this.baseUrl}/user/profile/picture`;
    if (cacheBust) {
      url += `?t=${Date.now()}`;
    }
    return this.http.get(url, { responseType: 'blob' });
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
    clearProfilePictureCache();
    this.currentUser.set(null);
  }
}
