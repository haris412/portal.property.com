import { Routes } from '@angular/router';
import { adminAuthGuard, adminAuthPageGuard } from '../core/guards/admin-auth.guard';
import { AdminAuthPortalComponent } from './auth/pages/admin-auth-portal/admin-auth-portal.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page/admin-dashboard-page.component';
import { AdminAgenciesPageComponent } from './pages/admin-agencies-page/admin-agencies-page.component';
import { AdminAddAgencyPageComponent } from './pages/admin-add-agency-page/admin-add-agency-page.component';
import { AdminAccessDeniedPageComponent } from './pages/admin-access-denied-page/admin-access-denied-page.component';
import { AdminAgencyUsersPageComponent } from './pages/admin-agency-users-page/admin-agency-users-page.component';
import { AdminAddAgencyUserPageComponent } from './pages/admin-add-agency-user-page/admin-add-agency-user-page.component';
import { adminAgenciesResolver } from './resolvers/admin-agencies.resolver';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'auth',
    component: AdminAuthPortalComponent,
    canActivate: [adminAuthPageGuard],
    title: 'Admin — Sign in',
  },
  {
    path: 'access-denied',
    component: AdminAccessDeniedPageComponent,
    title: 'Admin — Access denied',
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        component: AdminDashboardPageComponent,
        title: 'Dashboard',
      },
      {
        path: 'add-agency',
        component: AdminAddAgencyPageComponent,
        title: 'Add agency',
      },
      {
        path: 'agencies',
        component: AdminAgenciesPageComponent,
        title: 'Agencies',
        resolve: { adminAgencies: adminAgenciesResolver },
        runGuardsAndResolvers: 'always',
      },
      {
        path: 'users',
        component: AdminAgencyUsersPageComponent,
        title: 'Users',
      },
      {
        path: 'add-user',
        component: AdminAddAgencyUserPageComponent,
        title: 'Add agency user',
      },
    ],
  },
];
