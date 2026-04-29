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
