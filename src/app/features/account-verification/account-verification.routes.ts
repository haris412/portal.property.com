import { Routes } from '@angular/router';
import { AccountVerificationPageComponent } from './pages/account-verification-page/account-verification-page';

export const ACCOUNT_VERIFICATION_ROUTES: Routes = [
  {
    path: '',
    component: AccountVerificationPageComponent,
    title: 'Account verification',
  },
];
