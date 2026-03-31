import { Routes } from '@angular/router';
import { AddListingPageComponent } from './pages/add-listing-page/add-listing-page';

export const ADD_LISTING_ROUTES: Routes = [
  {
    path: '',
    component: AddListingPageComponent
  },
  /**
   * Edit mode: loads listing by id and populates the same form page.
   * Update endpoint will be wired in next.
   */
  {
    path: ':id',
    component: AddListingPageComponent,
    title: 'Edit listing',
  },
];