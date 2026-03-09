import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
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
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
