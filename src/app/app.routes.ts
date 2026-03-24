import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthPortalPageComponent } from './features/auth/pages/auth-portal-page/auth-portal-page.component';
import { VerifyEmailComponent } from './features/auth/components/verify-email/verify-email.component';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'login',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: '',
    component: LayoutComponent,
    // canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
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
        path: 'add-listing',
        loadChildren: () =>
          import('./features/add-listing/add-listing.routes').then((m) => m.ADD_LISTING_ROUTES),
        title: 'Listings',
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
      }
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
