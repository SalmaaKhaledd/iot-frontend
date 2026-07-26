import { toUserFromAuthResponse, toUserFromProfileResponse } from './auth-user.mapper';

describe('auth-user.mapper', () => {
  it('toUserFromAuthResponse maps userId and profilePicture', () => {
    const cdnUrl = 'https://cdn.example.com/profile-pictures/user/avatar.jpeg';
    const user = toUserFromAuthResponse({
      userId: 'uuid-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      profilePicture: cdnUrl,
      token: 't',
      message: 'ok',
    });

    expect(user).toEqual({
      id: 'uuid-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      profilePicture: cdnUrl,
    });
  });

  it('toUserFromProfileResponse maps userId and profilePicture', () => {
    const user = toUserFromProfileResponse({
      userId: 'uuid-2',
      firstName: 'C',
      lastName: 'D',
      email: 'c@d.com',
      profilePicture: 'https://cdn.example.com/profile-pictures/user/avatar.jpeg',
    });

    expect(user).toEqual({
      id: 'uuid-2',
      firstName: 'C',
      lastName: 'D',
      email: 'c@d.com',
      profilePicture: 'https://cdn.example.com/profile-pictures/user/avatar.jpeg',
    });
  });
});
