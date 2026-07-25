import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasStoredRefreshToken()) {
    return router.createUrlTree(['/auth']);
  }

  if (!auth.isLoggedIn()) {
    await auth.tryRestoreSession();
  }

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/auth']);
};

/** Redirects Buyer users away from /dashboard to /appointments. */
export const dashboardGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.hasRole('Buyer')) {
    return router.createUrlTree(['/appointments']);
  }

  return true;
};

/** Agency agent management — Primary Agency Admin only. */
export const primaryAgencyAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.canManageAgencyAgents()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
