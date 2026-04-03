import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import {
  AdminAgencyService,
  AgencySortBy,
  ListAgenciesQuery,
  ListAgenciesResult,
} from '../../core/services/admin-agency.service';
import { apiErrorSummary } from '../../core/http/parse-http-api-error';

export interface AdminAgenciesResolved {
  result: ListAgenciesResult;
  errorMessage: string | null;
}

/** Build GET /api/admin/agencies query from URL (same shape as the agencies page filters). */
export function buildListAgenciesQueryFromRoute(
  route: ActivatedRouteSnapshot,
  adminId: string
): ListAgenciesQuery {
  const q = route.queryParamMap;
  const page = Math.max(1, Number(q.get('page') ?? '1') || 1);
  const limit = Math.min(100, Math.max(1, Number(q.get('limit') ?? '20') || 20));
  const search = q.get('search')?.trim() || undefined;
  const isActiveRaw = q.get('isActive');
  const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined;
  let sortBy = (q.get('sortBy') ?? 'createdAt') as AgencySortBy;
  if (!['createdAt', 'updatedAt', 'name'].includes(sortBy)) {
    sortBy = 'createdAt';
  }
  const sortOrder = q.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  return {
    createdBy: adminId,
    page,
    limit,
    isActive,
    search,
    sortBy,
    sortOrder,
  };
}

/**
 * Loads agencies before the route activates so navigations (e.g. after create) always show fresh data.
 */
export const adminAgenciesResolver: ResolveFn<AdminAgenciesResolved> = (route) => {
  const adminAuth = inject(AdminAuthService);
  const svc = inject(AdminAgencyService);
  const user = adminAuth.getCurrentAdminUser();
  if (!user?._id) {
    return of({
      result: {
        agencies: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      },
      errorMessage: 'You must be signed in as an admin.',
    });
  }

  const query = buildListAgenciesQueryFromRoute(route, user._id);
  return svc.listAgencies(query).pipe(
    map((result) => ({ result, errorMessage: null as string | null })),
    catchError((err: unknown) =>
      of({
        result: {
          agencies: [],
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          total: 0,
          totalPages: 1,
        },
        errorMessage: apiErrorSummary(err),
      })
    )
  );
};
