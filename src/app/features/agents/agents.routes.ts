import { Routes } from '@angular/router';
import { primaryAgencyAdminGuard } from '../../core/guards/auth.guard';

export const AGENTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [primaryAgencyAdminGuard],
    loadComponent: () =>
      import('./pages/agents-page/agents-page').then((m) => m.AgentsPageComponent),
    title: 'Agents',
  },
  {
    path: 'add',
    canActivate: [primaryAgencyAdminGuard],
    loadComponent: () =>
      import('./pages/add-agent-page/add-agent-page').then((m) => m.AddAgentPageComponent),
    title: 'Add agent',
  },
  {
    path: 'edit/:agentId',
    canActivate: [primaryAgencyAdminGuard],
    loadComponent: () =>
      import('./pages/add-agent-page/add-agent-page').then((m) => m.AddAgentPageComponent),
    title: 'Edit agent',
  },
  {
    path: 'setup-password/:agentId',
    canActivate: [primaryAgencyAdminGuard],
    loadComponent: () =>
      import('../auth/pages/invite-set-password/invite-set-password.component').then(
        (m) => m.InviteSetPasswordComponent,
      ),
    data: { embedded: true },
    title: 'Set agent password',
  },
];
