export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Server filesystem path when a picture exists; null otherwise. Not a display URL. */
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
  /** Server filesystem path when a picture exists; null otherwise. Not a display URL. */
  profilePicture: string | null;
}
