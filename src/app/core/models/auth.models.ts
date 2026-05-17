/** Captures the payload required to register a new user account. */
export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

/** Captures the credentials payload required for user sign-in. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Successful auth response returned by both register and login contract endpoints. */
export interface AuthApiSuccessResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  message: string;
}

/** Standard backend error contract used by auth endpoints. */
export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string | string[];
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}



export interface MessageResponse {
  message: string;
}
