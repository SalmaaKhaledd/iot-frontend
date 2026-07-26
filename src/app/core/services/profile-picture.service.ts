import { Injectable, effect, inject, signal } from '@angular/core';

import { hasProfilePicture } from '../utils/profile-picture';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfilePictureService {
  private readonly authService = inject(AuthService);

  /** Display URL for the saved public profile picture. */
  readonly pictureUrl = signal<string | null>(null);

  /** Kept for existing avatar UI bindings; public URL rendering has no backend load step. */
  readonly loadError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const profilePicture = this.authService.currentUser()?.profilePicture ?? null;
      this.loadError.set(null);
      this.pictureUrl.set(hasProfilePicture(profilePicture) ? profilePicture!.trim() : null);
    });
  }

  /** Clears the in-memory URL after a broken `<img>` render. */
  invalidatePictureUrl(): void {
    this.pictureUrl.set(null);
    this.loadError.set(null);
  }
}
