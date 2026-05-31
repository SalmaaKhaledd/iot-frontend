import { toUserFromAuthResponse, toUserFromProfileResponse } from './auth-user.mapper';

describe('auth-user.mapper', () => {
  it('toUserFromAuthResponse maps userId to id and null profile picture', () => {
    const user = toUserFromAuthResponse({
      userId: 'uuid-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      token: 't',
      message: 'ok',
    });

    expect(user).toEqual({
      id: 'uuid-1',
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      profilePicture: null,
    });
  });

  it('toUserFromProfileResponse maps userId and profilePicture', () => {
    const user = toUserFromProfileResponse({
      userId: 'uuid-2',
      firstName: 'C',
      lastName: 'D',
      email: 'c@d.com',
      profilePicture: 'uploads/profile-pictures/user_abc123_1715000000.jpeg',
    });

    expect(user).toEqual({
      id: 'uuid-2',
      firstName: 'C',
      lastName: 'D',
      email: 'c@d.com',
      profilePicture: 'uploads/profile-pictures/user_abc123_1715000000.jpeg',
    });
  });
});
