import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import type { User } from '../models/user.model';
import { writeProfilePictureCache } from '../utils/profile-picture-cache';
import { AuthService } from './auth.service';
import { ProfilePictureService } from './profile-picture.service';

describe('ProfilePictureService', () => {
  const userWithPicture: User = {
    id: '1',
    firstName: 'A',
    lastName: 'B',
    email: 'a@example.com',
    profilePicture: 'uploads/profile-pictures/user.jpeg',
  };

  let currentUser: ReturnType<typeof signal<User | null>>;
  let getProfilePicture: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    currentUser = signal<User | null>(null);
    getProfilePicture = vi.fn();

    await TestBed.configureTestingModule({
      providers: [
        ProfilePictureService,
        {
          provide: AuthService,
          useValue: {
            currentUser,
            getProfilePicture,
          } as unknown as AuthService,
        },
      ],
    }).compileComponents();
  });

  it('sets pictureUrl when the user has a stored picture path', async () => {
    getProfilePicture.mockReturnValue(of(new Blob(['img'], { type: 'image/jpeg' })));
    currentUser.set(userWithPicture);

    const service = TestBed.inject(ProfilePictureService);
    await vi.waitFor(() => expect(service.pictureUrl()).toMatch(/^data:image\//));
    expect(getProfilePicture).toHaveBeenCalledTimes(1);
  });

  it('uses localStorage cache and skips GET /picture on repeat loads', async () => {
    writeProfilePictureCache(
      userWithPicture.id,
      userWithPicture.profilePicture!,
      'data:image/jpeg;base64,Y2FjaGVk',
    );
    currentUser.set(userWithPicture);

    const service = TestBed.inject(ProfilePictureService);
    await vi.waitFor(() =>
      expect(service.pictureUrl()).toBe('data:image/jpeg;base64,Y2FjaGVk'),
    );
    expect(getProfilePicture).not.toHaveBeenCalled();
  });

  it('clears pictureUrl when the user has no picture', async () => {
    getProfilePicture.mockReturnValue(of(new Blob(['img'], { type: 'image/jpeg' })));
    currentUser.set(userWithPicture);
    const service = TestBed.inject(ProfilePictureService);
    await vi.waitFor(() => expect(service.pictureUrl()).toBeTruthy());

    currentUser.set({ ...userWithPicture, profilePicture: null });
    await vi.waitFor(() => expect(service.pictureUrl()).toBeNull());
  });

  it('clears pictureUrl when download fails', async () => {
    getProfilePicture.mockReturnValue(throwError(() => new Error('network')));
    currentUser.set(userWithPicture);

    const service = TestBed.inject(ProfilePictureService);
    await vi.waitFor(() => expect(service.pictureUrl()).toBeNull());
  });

  it('sets loadError when GET /picture returns 429', async () => {
    getProfilePicture.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 429,
            statusText: 'Too Many Requests',
            error: new Blob(
              [JSON.stringify({ message: 'Too many requests. Please try again later.' })],
              { type: 'application/json' },
            ),
          }),
      ),
    );
    currentUser.set(userWithPicture);

    const service = TestBed.inject(ProfilePictureService);
    await vi.waitFor(() =>
      expect(service.loadError()).toBe('Too many requests, try again later.'),
    );
    expect(service.pictureUrl()).toBeNull();
  });

  it('invalidatePictureUrl revokes the blob URL', async () => {
    getProfilePicture.mockReturnValue(of(new Blob(['img'], { type: 'image/jpeg' })));
    currentUser.set(userWithPicture);

    const service = TestBed.inject(ProfilePictureService);
    await vi.waitFor(() => expect(service.pictureUrl()).toBeTruthy());

    service.invalidatePictureUrl();
    expect(service.pictureUrl()).toBeNull();
  });
});
