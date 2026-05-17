import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, from, map, of, switchMap, tap } from 'rxjs';

import { mapAuthError } from '../utils/auth-error';
import {
  blobToDataUrl,
  readProfilePictureCache,
  writeProfilePictureCache,
} from '../utils/profile-picture-cache';
import { hasProfilePicture, isImageBlob } from '../utils/profile-picture';
import { AuthService } from './auth.service';

interface PictureLoadKey {
  userId: string;
  path: string;
}

/**
 * Loads the authenticated profile picture, keyed on user id + `profilePicture` path.
 * Uses localStorage so revisits and reloads do not re-fetch unless the path changes.
 */
@Injectable({ providedIn: 'root' })
export class ProfilePictureService {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  /** Display URL (cached data URL or blob URL from a fresh download). */
  readonly pictureUrl = signal<string | null>(null);

  /** Set when GET /picture fails (e.g. 429 rate limit). */
  readonly loadError = signal<string | null>(null);

  constructor() {
    toObservable(this.authService.currentUser)
      .pipe(
        map((user): PictureLoadKey | null => {
          const path = user?.profilePicture ?? null;
          if (!user?.id || !hasProfilePicture(path)) {
            return null;
          }
          return { userId: user.id, path: path! };
        }),
        distinctUntilChanged(
          (previous, current) =>
            previous?.userId === current?.userId && previous?.path === current?.path,
        ),
        switchMap((key) => {
          if (!key) {
            this.loadError.set(null);
            return of(null);
          }

          const cached = readProfilePictureCache(key.userId, key.path);
          if (cached) {
            this.loadError.set(null);
            return of(cached);
          }

          this.loadError.set(null);
          return this.authService.getProfilePicture().pipe(
            switchMap((blob) => {
              if (!isImageBlob(blob)) {
                return of(null);
              }
              return from(blobToDataUrl(blob)).pipe(
                tap((dataUrl) => writeProfilePictureCache(key.userId, key.path, dataUrl)),
                catchError(() => of(null)),
              );
            }),
            catchError((error) => {
              if (error instanceof HttpErrorResponse && error.status === 429) {
                this.loadError.set(mapAuthError(error));
              }
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pictureSource) => this.setPictureSource(pictureSource));

    this.destroyRef.onDestroy(() => this.revokePictureUrl());
  }

  /** Clears the in-memory URL (e.g. after a broken `<img>` render). */
  invalidatePictureUrl(): void {
    this.revokePictureUrl();
    this.loadError.set(null);
  }

  private setPictureSource(source: string | null): void {
    this.revokePictureUrl();
    if (source) {
      this.pictureUrl.set(source);
    }
  }

  private revokePictureUrl(): void {
    const current = this.pictureUrl();
    if (current?.startsWith('blob:')) {
      URL.revokeObjectURL(current);
    }
    this.pictureUrl.set(null);
  }
}
