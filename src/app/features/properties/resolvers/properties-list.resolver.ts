import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AddListingService } from '../../../core/services/add-listing.service';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';
import {
  PROPERTIES_LIST_INITIAL_PAGE_SIZE,
  type PropertiesListResult,
} from '../../../core/models/properties-list.model';

/**
 * Loads the first page of the current user’s listings before `/properties` activates,
 * so the grid can render with data immediately (including after navigating from add-listing).
 */
export const propertiesListResolver: ResolveFn<PropertiesListResult> = () => {
  const addListing = inject(AddListingService);
  const auth = inject(AuthService);

  return addListing
    .getProperties({
      page: 1,
      limit: PROPERTIES_LIST_INITIAL_PAGE_SIZE,
      listedBy: auth.getUserId() ?? undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
    .pipe(
      catchError((err: unknown) =>
        of({
          success: false,
          properties: [],
          count: 0,
          total: 0,
          page: 1,
          totalPages: 0,
          errorMessage: apiErrorSummary(err) || 'Could not load properties.',
        } satisfies PropertiesListResult)
      )
    );
};
