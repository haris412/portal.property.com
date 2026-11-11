import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isAdminRole } from '../models/role.models';
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

  return true;
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

/** Identity review inside the signed-in portal. Admin role only. */
export const portalAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = auth.getCurrentUser()?.roles ?? [];
  if (roles.some((role) => isAdminRole(role))) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
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
