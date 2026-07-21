import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthPortalPageComponent } from './features/auth/pages/auth-portal-page/auth-portal-page.component';
import { VerifyEmailComponent } from './features/auth/components/verify-email/verify-email.component';
import { dashboardGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthPortalPageComponent,
    title: 'Sign in',
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    title: 'Verify email',
  },
  {
    path: 'forgot-password',
    loadChildren: () =>
      import('./features/auth/forgot-password.routes').then((m) => m.FORGOT_PASSWORD_ROUTES),
  },
  {
    path: 'accept-invite',
    loadChildren: () =>
      import('./features/auth/invite.routes').then((m) => m.INVITE_ROUTES),
  },
  {
    path: 'video/:roomName',
    loadComponent: () =>
      import('./features/video-call/pages/video-call/video-call.component').then(
        (m) => m.VideoCallComponent
      ),
    title: 'Video call',
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'login',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        canActivate: [dashboardGuard],
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
        title: 'Dashboard',
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
        title: 'Users',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Analytics',
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
        title: 'Settings',
      },
      {
        path: 'properties',
        loadChildren: () =>
          import('./features/properties/properties.routes').then((m) => m.PROPERTIES_ROUTES),
        title: 'Properties',
      },
      {
        path: 'add-listing',
        loadChildren: () =>
          import('./features/add-listing/add-listing.routes').then((m) => m.ADD_LISTING_ROUTES),
        title: 'Listings',
      },
      {
        path: 'agents',
        loadChildren: () =>
          import('./features/agents/agents.routes').then((m) => m.AGENTS_ROUTES),
        title: 'Agents',
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
        title: 'Profile',
      },
      {
        path: 'inbox',
        loadChildren: () =>
          import('./features/inbox/inbox.routes').then((m) => m.PROFILE_ROUTES),
        title: 'Inbox',
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then((m) => m.APPOINTMENTS_ROUTES),
        title: 'Appointments',
      },
      {
        path: 'subscription-usage',
        loadChildren: () =>
          import('./features/subscription-usage/subscription-usage.routes').then(
            (m) => m.SUBSCRIPTION_USAGE_ROUTES
          ),
        title: 'Plan usage',
      },
      {
        path: 'subscription-plan',
        loadChildren: () =>
          import('./features/subscription-plan/subscription-plan.routes').then(
            (m) => m.SUBSCRIPTION_PLAN_ROUTES
          ),
        title: 'Subscription plan',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];
