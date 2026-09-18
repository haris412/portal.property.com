import { Routes } from '@angular/router';

export const SUBSCRIPTION_PAYMENT_ROUTES: Routes = [
  {
    path: 'payment-success',
    loadComponent: () =>
      import('./pages/payment-success-page/payment-success-page').then(
        (m) => m.PaymentSuccessPageComponent,
      ),
    title: 'Payment successful',
  },
  {
    path: 'payment-cancel',
    loadComponent: () =>
      import('./pages/payment-cancel-page/payment-cancel-page').then(
        (m) => m.PaymentCancelPageComponent,
      ),
    title: 'Payment cancelled',
  },
];
