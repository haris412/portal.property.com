import { Routes } from '@angular/router';

export const SUBSCRIPTION_USAGE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/subscription-usage-page/subscription-usage-page').then(
        (m) => m.SubscriptionUsagePageComponent,
      ),
    title: 'Plan usage',
  },
];
