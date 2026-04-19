import { Routes } from '@angular/router';
import { ForgotPasswordShellComponent } from './pages/forgot-password-shell/forgot-password-shell.component';
import { InviteSetPasswordComponent } from './pages/invite-set-password/invite-set-password.component';

export const INVITE_ROUTES: Routes = [
  {
    path: '',
    component: ForgotPasswordShellComponent,
    children: [
      {
        path: '',
        component: InviteSetPasswordComponent,
        title: 'Accept invitation',
      },
    ],
  },
];
