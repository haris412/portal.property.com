/** First page size for the properties grid and route resolver (API max 50). */
export const PROPERTIES_LIST_INITIAL_PAGE_SIZE = 20;

/**
 * GET /api/properties — query filters (all optional).
 * Mirrors Swagger on `propertyRoutes.js`.
 */
export interface PropertiesListQuery {
  page?: number;
  limit?: number;
  /** Lister’s Mongo ObjectId string; invalid id → 400 from API. Server maps this to `userId` in the DB. */
  listedBy?: string;
  status?: 'Draft' | 'Published';
  purpose?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Populated owner from API (`userId` and/or legacy `listedBy`). */
export interface PropertyListedByUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Single property document in list response (fields depend on API; extend as needed).
 */
export interface PropertyListDocument {
  _id?: string;
  listingTitle?: string;
  title?: string;
  city?: string | null;
  neighborhood?: string | null;
  purpose?: string | null;
  price?: number | null;
  status?: string | null;
  /** Legacy/alternate name if the API still sends it. */
  listedBy?: PropertyListedByUser | string | null;
  /** Owner ref; Mongoose `populate('userId')` returns this shape. */
  userId?: PropertyListedByUser | string | null;
  createdAt?: string;
  propertyType?: string | null;
}

/** Raw JSON body from GET /api/properties. */
export interface PropertiesListApiResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  data?: {
    properties?: PropertyListDocument[];
  };
  message?: string;
}

/** Normalized result for UI / state. */
export interface PropertiesListResult {
  success: boolean;
  properties: PropertyListDocument[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
  /** Present when the request failed (e.g. resolver `catchError` fallback). */
  errorMessage?: string;
}

export function formatListedByLabel(
  listedBy: PropertyListDocument['listedBy'] | PropertyListDocument['userId']
): string {
  if (listedBy == null || listedBy === '') return '—';
  if (typeof listedBy === 'string') return listedBy;
  const name = [listedBy.firstName, listedBy.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  return listedBy.email ?? listedBy._id ?? '—';
}

/** Flat row for AG Grid and tables. */
export interface PropertyListingRow {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  purpose: string;
  price: number | null;
  status: string;
  lister: string;
}

export function mapPropertyDocumentToGridRow(doc: PropertyListDocument): PropertyListingRow {
  const title = (doc.listingTitle ?? doc.title ?? '').trim() || '—';
  return {
    id: doc._id ?? '',
    title,
    city: (doc.city ?? '').toString() || '—',
    neighborhood: (doc.neighborhood ?? '').toString() || '—',
    purpose: (doc.purpose ?? '').toString() || '—',
    price: doc.price ?? null,
    status: (doc.status ?? '').toString() || '—',
    lister: formatListedByLabel(doc.userId ?? doc.listedBy),
  };
}
