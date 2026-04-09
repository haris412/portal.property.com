import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

/**
 * Access token lives only in memory; refresh restores it via `tryRestoreSession` (also from
 * `APP_INITIALIZER`). Await here so navigation after a full page reload never runs the guard
 * before the access token is back from the refresh-token call.
 */
export const adminAuthGuard: CanActivateFn = async () => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  if (!adminAuth.isAdminSession()) {
    await adminAuth.tryRestoreSession();
  }

  if (adminAuth.isAdminSession()) {
    return true;
  }

  return router.createUrlTree(['/admin/auth']);
};

/** On `/admin/auth`, send already-signed-in admins to the dashboard. */
export const adminAuthPageGuard: CanActivateFn = async () => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  if (!adminAuth.isAdminSession()) {
    await adminAuth.tryRestoreSession();
  }

  if (adminAuth.isAdminSession()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return true;
};
