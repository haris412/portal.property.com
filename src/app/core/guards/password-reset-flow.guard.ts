import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PasswordResetFlowService } from '../services/password-reset-flow.service';

export const passwordResetEmailStepGuard: CanActivateFn = () => {
  const flow = inject(PasswordResetFlowService);
  const router = inject(Router);
  if (flow.email()) return true;
  return router.createUrlTree(['/forgot-password']);
};

export const passwordResetTokenStepGuard: CanActivateFn = () => {
  const flow = inject(PasswordResetFlowService);
  const router = inject(Router);
  if (flow.resetToken()) return true;
  return router.createUrlTree(['/forgot-password']);
};
