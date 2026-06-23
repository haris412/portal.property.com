import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { CreateListingPayload } from '../models/add-listing.model';
import { PropertyCatalogData } from '../models/property-catalog.model';
import { PropertyFeature, PropertyFeaturesApiResponse } from '../models/property-features.model';
import { environment } from '../../../environments/environment';
import type {
  PropertiesListApiResponse,
  PropertiesListQuery,
  PropertiesListResult,
} from '../models/properties-list.model';
import type { PropertyDetailApiResponse, PropertyDetailDocument } from '../models/property-detail.model';
import {
  FEATURE_SLUG_TO_AMENITY_KEY,
  ListingAmenityBooleans,
  createDefaultListingAmenityBooleans,
  normalizeFeatureSlug,
} from '../constants/listing-payload.constants';

export interface AddListingResponse {
  id: string | number;
}

export type ListingPurposeLabel = 'For Sale' | 'For Rent';

/** POST /api/ai/generate-title */
export interface GenerateListingTitleRequest {
  purpose: ListingPurposeLabel;
  propertyType?: string;
  subtype?: string;
}

/** POST /api/ai/generate-description — core fields plus any listing extras the backend forwards to the model. */
export type GenerateListingDescriptionRequest = {
  title: string;
  purpose: ListingPurposeLabel;
  propertyType?: string;
  subtype?: string;
} & Record<string, unknown>;

const PROPERTIES_LIST_DEFAULT_PAGE = 1;
const PROPERTIES_LIST_DEFAULT_LIMIT = 20;
const PROPERTIES_LIST_MAX_LIMIT = 50;

@Injectable({ providedIn: 'root' })
export class AddListingService {
  private readonly baseUrl = `${environment.apiUrl}/api/properties`;
  private readonly catalogUrl = `${environment.apiUrl}/api/property-catalog`;
  private readonly featuresUrl = `${environment.apiUrl}/api/property-features`;
  private readonly aiBaseUrl = `${environment.apiUrl}/api/ai`;

  /** In-memory cache for the session (set after first successful fetch). */
  private catalogCache: PropertyCatalogData | null = null;
  private catalogRequest$: Observable<PropertyCatalogData> | null = null;

  private featuresCache: PropertyFeature[] | null = null;
  private featuresRequest$: Observable<PropertyFeature[]> | null = null;

  constructor(private http: HttpClient) {}

  getPropertyCatalog(): Observable<PropertyCatalogData> {
    if (this.catalogCache) {
      return of(this.catalogCache);
    }
    if (!this.catalogRequest$) {
      this.catalogRequest$ = this.http
        .get<ApiResponse<PropertyCatalogData>>(this.catalogUrl)
        .pipe(
          map((res) => res.data ?? { categories: [] }),
          tap((data) => {
            this.catalogCache = data;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
          catchError((err) => {
            this.catalogRequest$ = null;
            return throwError(() => err);
          })
        );
    }
    return this.catalogRequest$;
  }

  /**
   * Loads feature definitions once per session; subsequent calls return cached list (sorted by `position`).
   */
  getPropertyFeatures(): Observable<PropertyFeature[]> {
    if (this.featuresCache) {
      return of(this.featuresCache);
    }
    if (!this.featuresRequest$) {
      this.featuresRequest$ = this.http.get<PropertyFeaturesApiResponse>(this.featuresUrl).pipe(
        map((res) => {
          const list = res.data?.features ?? [];
          return [...list].sort((a, b) => a.position - b.position);
        }),
        tap((sorted) => {
          this.featuresCache = sorted;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError((err) => {
          this.featuresRequest$ = null;
          return throwError(() => err);
        })
      );
    }
    return this.featuresRequest$;
  }

  invalidatePropertyFeaturesCache(): void {
    this.featuresCache = null;
    this.featuresRequest$ = null;
  }

  getCachedCatalog(): PropertyCatalogData | null {
    return this.catalogCache;
  }

  /** Clears catalog cache and in-flight request so the next `getPropertyCatalog()` hits the network again. */
  invalidatePropertyCatalogCache(): void {
    this.catalogCache = null;
    this.catalogRequest$ = null;
  }

  // reads coarseType directly from the catalog — no regex needed
  getCoarseTypeById(categoryId: string): string {
    const category = this.catalogCache?.categories.find(c => c._id === categoryId);
    const coarseType = category?.coarseType ?? 'Homes';
    console.log('[AddListingService] getCoarseTypeById:', categoryId, '→', coarseType);
    return coarseType;
  }

  // resolves display name from _id — used in review summary and AI description
  getCategoryNameById(categoryId: string): string {
    return this.catalogCache?.categories.find(c => c._id === categoryId)?.name ?? '';
  }

  getSubtypeNameById(categoryId: string, subtypeId: string): string {
    const category = this.catalogCache?.categories.find(c => c._id === categoryId);
    return category?.subtypes.find(s => s._id === subtypeId)?.name ?? '';
  }

  /** Maps selected feature `_id`s to backend `has*` / `is*` booleans. */
  buildAmenityBooleanPayload(selectedFeatureIds: string[]): ListingAmenityBooleans {
    const out = createDefaultListingAmenityBooleans();
    const list = this.featuresCache;
    if (!list?.length || !selectedFeatureIds.length) {
      return out;
    }
    const selected = new Set(selectedFeatureIds);
    for (const f of list) {
      if (!selected.has(f._id)) {
        continue;
      }
      const key = FEATURE_SLUG_TO_AMENITY_KEY[normalizeFeatureSlug(f.slug)];
      if (key) {
        out[key] = true;
      }
    }
    return out;
  }

  createListing(payload: CreateListingPayload): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(this.baseUrl, {
      ...payload,
      status: 'Published',
    });
  }

  saveDraft(payload: CreateListingPayload): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(this.baseUrl, {
      ...payload,
      status: 'Draft',
    });
  }

  /** GET /api/properties/:id */
  getPropertyById(id: string): Observable<PropertyDetailDocument | null> {
    const safeId = (id ?? '').trim();
    if (!safeId) return of(null);
    return this.http.get<PropertyDetailApiResponse>(`${this.baseUrl}/${encodeURIComponent(safeId)}`).pipe(
      map((res) => res?.data?.property ?? null)
    );
  }

  /** PUT /api/properties/:id */
  updateProperty(id: string, payload: CreateListingPayload): Observable<ApiResponse<AddListingResponse>> {
    const safeId = (id ?? '').trim();
    if (!safeId) {
      return throwError(() => new Error('Missing property id'));
    }
    return this.http.put<ApiResponse<AddListingResponse>>(
      `${this.baseUrl}/${encodeURIComponent(safeId)}`,
      payload
    );
  }

  /**
   * GET /api/properties — same base URL as create/draft. Bearer token is added by `authInterceptor`.
   */
  getProperties(query: PropertiesListQuery = {}): Observable<PropertiesListResult> {
    const params = this.buildPropertiesListParams(query);
    return this.http.get<PropertiesListApiResponse>(this.baseUrl, { params }).pipe(
      map((res) => this.normalizePropertiesListResponse(res))
    );
  }

  private buildPropertiesListParams(query: PropertiesListQuery): HttpParams {
    const page = Math.max(1, query.page ?? PROPERTIES_LIST_DEFAULT_PAGE);
    const limit = Math.min(
      PROPERTIES_LIST_MAX_LIMIT,
      Math.max(1, query.limit ?? PROPERTIES_LIST_DEFAULT_LIMIT)
    );

    let p = new HttpParams().set('page', String(page)).set('limit', String(limit));

    const setParam = (key: keyof PropertiesListQuery, value: string | number | undefined) => {
      if (value === undefined || value === null || value === '') return;
      p = p.set(key, String(value));
    };

    setParam('listedBy', query.listedBy);
    setParam('status', query.status);
    setParam('purpose', query.purpose);
    setParam('propertyType', query.propertyType);
    if (query.minPrice != null) setParam('minPrice', query.minPrice);
    if (query.maxPrice != null) setParam('maxPrice', query.maxPrice);
    setParam('city', query.city);
    setParam('sortBy', query.sortBy);
    setParam('sortOrder', query.sortOrder);

    return p;
  }

  private normalizePropertiesListResponse(res: PropertiesListApiResponse): PropertiesListResult {
    return {
      success: res.success ?? true,
      properties: res.data?.properties ?? [],
      count: res.count ?? 0,
      total: res.total ?? 0,
      page: res.page ?? PROPERTIES_LIST_DEFAULT_PAGE,
      totalPages: res.totalPages ?? 0,
    };
  }

  /**
   * Protected route: `Authorization` is attached by `authInterceptor` for `environment.apiUrl` requests.
   */
  generateListingTitle(body: GenerateListingTitleRequest): Observable<string> {
    return this.http
      .post<ApiResponse<{ title?: string }>>(`${this.aiBaseUrl}/generate-title`, body)
      .pipe(map((res) => (res?.data?.title ?? '').trim()));
  }

  /**
   * Protected route: send the same JSON shape your API validates; extra keys are passed through to the LLM.
   */
  generateListingDescription(body: GenerateListingDescriptionRequest): Observable<string> {
    return this.http
      .post<ApiResponse<{ description?: string }>>(`${this.aiBaseUrl}/generate-description`, body)
      .pipe(map((res) => (res?.data?.description ?? '').trim()));
  }
}

