import { Routes } from '@angular/router';
import { propertiesListResolver } from './resolvers/properties-list.resolver';

export const PROPERTIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/properties-page/properties-page').then((m) => m.PropertiesPageComponent),
    resolve: {
      initialList: propertiesListResolver,
    },
  },
];
