/** Represents an authenticated application user profile returned by the API. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
}

/** Captures the payload required to register a new user account. */
export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  profilePicture: string;
}

/** Captures the credentials payload required for user sign-in. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Returned by both login and register endpoints. */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Type alias for AuthResponse — register and login return identical shapes. */
export type RegisterResponse = AuthResponse;
