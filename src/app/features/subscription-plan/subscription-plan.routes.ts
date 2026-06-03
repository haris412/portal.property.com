import { Routes } from '@angular/router';

export const SUBSCRIPTION_PLAN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/subscription-plan-page/subscription-plan-page').then(
        (m) => m.SubscriptionPlanPageComponent
      ),
    title: 'Subscription plan',
  },
];
