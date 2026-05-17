export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** API path to the profile picture, e.g. '/api/user/profile/picture', or null */
  profilePicture: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/** Contract response shape for GET /api/user/profile. */
export interface UserProfileResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** API path to the profile picture, e.g. '/api/user/profile/picture', or null */
  profilePicture: string | null;
}
