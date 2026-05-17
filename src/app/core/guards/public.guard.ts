import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guard for public auth routes (login, signup).
 * Redirects authenticated users to /home to prevent accessing login/signup when already logged in.
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getToken()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
