import { Routes } from '@angular/router';
import {
  passwordResetEmailStepGuard,
  passwordResetTokenStepGuard
} from '../../core/guards/password-reset-flow.guard';
import { ForgotPasswordShellComponent } from './pages/forgot-password-shell/forgot-password-shell.component';
import { ForgotPasswordRequestComponent } from './pages/forgot-password-request/forgot-password-request.component';
import { ForgotPasswordVerifyOtpComponent } from './pages/forgot-password-verify-otp/forgot-password-verify-otp.component';
import { ForgotPasswordNewPasswordComponent } from './pages/forgot-password-new-password/forgot-password-new-password.component';

export const FORGOT_PASSWORD_ROUTES: Routes = [
  {
    path: '',
    component: ForgotPasswordShellComponent,
    children: [
      {
        path: '',
        component: ForgotPasswordRequestComponent,
        title: 'Forgot password'
      },
      {
        path: 'verify-otp',
        component: ForgotPasswordVerifyOtpComponent,
        canActivate: [passwordResetEmailStepGuard],
        title: 'Verify code'
      },
      {
        path: 'new-password',
        component: ForgotPasswordNewPasswordComponent,
        canActivate: [passwordResetTokenStepGuard],
        title: 'New password'
      }
    ]
  }
];
