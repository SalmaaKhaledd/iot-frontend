import type { AuthApiSuccessResponse } from '../models/auth.models';
import type { User, UserProfileResponse } from '../models/user.model';

/**
 * Transforms auth contract payload into the app's local user shape.
 */
export function toUserFromAuthResponse(response: AuthApiSuccessResponse): User {
  return {
    id: response.userId,
    firstName: response.firstName,
    lastName: response.lastName,
    email: response.email,
    profilePicture: null,
  };
}

/**
 * Transforms profile contract payload into the app's local user shape.
 */
export function toUserFromProfileResponse(response: UserProfileResponse): User {
  return {
    id: response.userId,
    firstName: response.firstName,
    lastName: response.lastName,
    email: response.email,
    profilePicture: response.profilePicture,
  };
}
