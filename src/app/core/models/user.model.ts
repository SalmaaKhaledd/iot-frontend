export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/** Contract response shape for GET /api/users/profile. */
export interface UserProfileResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
}
