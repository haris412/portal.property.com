import type { ParamMap, Params } from '@angular/router';
import type { PropertiesListQuery } from '../../core/models/properties-list.model';
import {
  SHARED_BATHROOM_OPTIONS,
  SHARED_KITCHEN_OPTIONS,
  SHARED_TENANT_PREFERENCE_OPTIONS,
  type SharedBathroom,
  type SharedKitchen,
  type SharedTenantPreference,
} from '../../core/models/shared-listing.model';

/** any → no param, whole → isShared=false, shared → isShared=true. */
export type ListingTypeFilter = 'any' | 'whole' | 'shared';

export type TenantPreferenceFilter = Exclude<SharedTenantPreference, 'Any'>;

/** "Any" is the default on a listing, not a search filter — the API already includes "Any" listings in every match. */
export const TENANT_PREFERENCE_FILTER_OPTIONS = SHARED_TENANT_PREFERENCE_OPTIONS.filter(
  (o): o is TenantPreferenceFilter => o !== 'Any'
);

export interface PropertiesListFilters {
  listingType:       ListingTypeFilter;
  bathroom:          SharedBathroom | null;
  kitchen:           SharedKitchen | null;
  tenantPreference:  TenantPreferenceFilter | null;
  minRoomsAvailable: number | null;
}

export const EMPTY_PROPERTIES_LIST_FILTERS: PropertiesListFilters = {
  listingType:       'any',
  bathroom:          null,
  kitchen:           null,
  tenantPreference:  null,
  minRoomsAvailable: null,
};

function oneOf<T extends string>(options: readonly T[], value: string | null): T | null {
  return value != null && (options as readonly string[]).includes(value) ? (value as T) : null;
}

/** URL query params use the API names, so a link can be shared as-is. Unknown values are ignored. */
export function readPropertiesListFilters(params: ParamMap): PropertiesListFilters {
  const isShared = params.get('isShared');
  const rooms    = Number(params.get('minRoomsAvailable'));
  const filters: PropertiesListFilters = {
    listingType:       isShared === 'true' ? 'shared' : isShared === 'false' ? 'whole' : 'any',
    bathroom:          oneOf(SHARED_BATHROOM_OPTIONS, params.get('bathroom')),
    kitchen:           oneOf(SHARED_KITCHEN_OPTIONS, params.get('kitchen')),
    tenantPreference:  oneOf(TENANT_PREFERENCE_FILTER_OPTIONS, params.get('tenantPreference')),
    minRoomsAvailable: params.has('minRoomsAvailable') && Number.isInteger(rooms) && rooms >= 1 ? rooms : null,
  };
  return filters.listingType === 'shared' ? filters : { ...EMPTY_PROPERTIES_LIST_FILTERS, listingType: filters.listingType };
}

export function propertiesListFiltersToQuery(f: PropertiesListFilters): Partial<PropertiesListQuery> {
  if (f.listingType === 'any')   return {};
  if (f.listingType === 'whole') return { isShared: false };
  return {
    isShared:          true,
    bathroom:          f.bathroom          ?? undefined,
    kitchen:           f.kitchen           ?? undefined,
    tenantPreference:  f.tenantPreference  ?? undefined,
    minRoomsAvailable: f.minRoomsAvailable ?? undefined,
  };
}

/** For `router.navigate(..., { queryParamsHandling: 'merge' })`: null removes a param. */
export function propertiesListFiltersToQueryParams(f: PropertiesListFilters): Params {
  const q = propertiesListFiltersToQuery(f);
  return {
    isShared:          q.isShared == null ? null : String(q.isShared),
    bathroom:          q.bathroom          ?? null,
    kitchen:           q.kitchen           ?? null,
    tenantPreference:  q.tenantPreference  ?? null,
    minRoomsAvailable: q.minRoomsAvailable ?? null,
  };
}
