import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { ProfilePictureService } from './profile-picture.service';

describe('ProfilePictureService', () => {
  const cdnUrl = 'https://cdn.example.com/profile-pictures/user/avatar.jpeg';
  const userWithPicture: User = {
    id: '1',
    firstName: 'A',
    lastName: 'B',
    email: 'a@example.com',
    profilePicture: cdnUrl,
  };

  let currentUser: ReturnType<typeof signal<User | null>>;

  beforeEach(async () => {
    localStorage.clear();
    currentUser = signal<User | null>(null);

    await TestBed.configureTestingModule({
      providers: [
        ProfilePictureService,
        {
          provide: AuthService,
          useValue: {
            currentUser,
          } as unknown as AuthService,
        },
      ],
    }).compileComponents();
  });

  it('sets pictureUrl to the stored public image URL', async () => {
    const service = TestBed.inject(ProfilePictureService);
    currentUser.set(userWithPicture);

    await vi.waitFor(() => expect(service.pictureUrl()).toBe(cdnUrl));
    expect(service.loadError()).toBeNull();
  });

  it('clears pictureUrl when the user has no picture', async () => {
    const service = TestBed.inject(ProfilePictureService);
    currentUser.set(userWithPicture);
    await vi.waitFor(() => expect(service.pictureUrl()).toBe(cdnUrl));

    currentUser.set({ ...userWithPicture, profilePicture: null });

    await vi.waitFor(() => expect(service.pictureUrl()).toBeNull());
  });

  it('ignores legacy local paths and data URLs', async () => {
    const service = TestBed.inject(ProfilePictureService);
    currentUser.set({ ...userWithPicture, profilePicture: 'uploads/profile-pictures/user.jpeg' });

    await vi.waitFor(() => expect(service.pictureUrl()).toBeNull());

    currentUser.set({ ...userWithPicture, profilePicture: 'data:image/png;base64,abc' });

    await vi.waitFor(() => expect(service.pictureUrl()).toBeNull());
  });

  it('updates pictureUrl when the stored public URL changes', async () => {
    const nextUrl = 'https://cdn.example.com/profile-pictures/user/avatar-2.jpeg';
    const service = TestBed.inject(ProfilePictureService);
    currentUser.set(userWithPicture);
    await vi.waitFor(() => expect(service.pictureUrl()).toBe(cdnUrl));

    currentUser.set({ ...userWithPicture, profilePicture: nextUrl });

    await vi.waitFor(() => expect(service.pictureUrl()).toBe(nextUrl));
  });

  it('invalidatePictureUrl clears the current URL and load error', async () => {
    const service = TestBed.inject(ProfilePictureService);
    currentUser.set(userWithPicture);
    await vi.waitFor(() => expect(service.pictureUrl()).toBe(cdnUrl));

    service.loadError.set('Image failed to load.');
    service.invalidatePictureUrl();

    expect(service.pictureUrl()).toBeNull();
    expect(service.loadError()).toBeNull();
  });
});
