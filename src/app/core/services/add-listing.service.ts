import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { AddListingModel } from '../models/add-listing.model';
import { PropertyCatalogData } from '../models/property-catalog.model';
import { PropertyFeature, PropertyFeaturesApiResponse } from '../models/property-features.model';
import { environment } from '../../../environments/environment';
import {
  CoarsePropertyType,
  FEATURE_SLUG_TO_AMENITY_KEY,
  ListingAmenityBooleans,
  createDefaultListingAmenityBooleans,
  normalizeFeatureSlug,
} from '../constants/listing-payload.constants';

export interface AddListingResponse {
  id: string | number;
}

@Injectable({ providedIn: 'root' })
export class AddListingService {
  private readonly baseUrl = `${environment.apiUrl}/api/properties`;
  private readonly catalogUrl = `${environment.apiUrl}/api/property-catalog`;
  private readonly featuresUrl = `${environment.apiUrl}/api/property-features`;

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

  /**
   * Coarse `propertyType` for the listing API: House | Apartment | Plot.
   * Uses only the selected display names from the form (no catalog lookup).
   */
  getCoarsePropertyTypeFromLabels(
    categoryName?: string | null,
    subtypeName?: string | null
  ): CoarsePropertyType {
    const text = `${subtypeName ?? ''} ${categoryName ?? ''}`.trim().toLowerCase();
    if (!text) {
      return 'House';
    }
    if (/plot|plots|land|commercial\s*plot|residential\s*plot/.test(text)) {
      return 'Plot';
    }
    if (/apartment|flat|penthouse|studio|condo/.test(text)) {
      return 'Apartment';
    }
    return 'House';
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

  createListing(payload: AddListingModel): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(`${this.baseUrl}`, {
      ...payload,
      status: 'Published',
    });
  }

  saveDraft(payload: AddListingModel): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(`${this.baseUrl}`, {
      ...payload,
      status: 'Draft',
    });
  }
}

