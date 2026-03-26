import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/agent-dashboard-page/agent-dashboard-page').then((m) => m.AgentDashboardPageComponent),
  },
];
