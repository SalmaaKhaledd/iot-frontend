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
