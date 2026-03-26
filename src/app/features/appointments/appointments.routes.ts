import { Routes } from '@angular/router';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/appointments-page/appointments-page').then((m) => m.AppointmentsPageComponent),
  },
];
