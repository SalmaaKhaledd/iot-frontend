export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Public HTTP(S) image URL when a picture exists; null otherwise. */
  profilePicture: string | null;
}

/** Contract response shape for GET /api/user/profile. */
export interface UserProfileResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Public HTTP(S) image URL when a picture exists; null otherwise. */
  profilePicture: string | null;
}
