import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import type { ApiResponse } from '../models/api-response.model';
import type { CreateListingPayload } from '../models/add-listing.model';
import type { PropertyCatalogData } from '../models/property-catalog.model';
import type { ListingConfigData, ListingConfigApiResponse } from '../models/listing-config.model';
import type {
  PropertiesListApiResponse,
  PropertiesListQuery,
  PropertiesListResult,
} from '../models/properties-list.model';
import type { PropertyDetailApiResponse, PropertyDetailDocument } from '../models/property-detail.model';

export interface AddListingResponse {
  id: string | number;
}

export type ListingPurposeLabel = 'For Sale' | 'For Rent';

export interface GenerateListingTitleRequest {
  purpose:       ListingPurposeLabel;
  propertyType?: string;
  subtype?:      string;
}

export type GenerateListingDescriptionRequest = {
  title:         string;
  purpose:       ListingPurposeLabel;
  propertyType?: string;
  subtype?:      string;
} & Record<string, unknown>;

const PROPERTIES_LIST_DEFAULT_PAGE  = 1;
const PROPERTIES_LIST_DEFAULT_LIMIT = 20;
const PROPERTIES_LIST_MAX_LIMIT     = 50;

@Injectable({ providedIn: 'root' })
export class AddListingService {
  private readonly baseUrl          = `/properties`;
  private readonly listingConfigUrl = `/listing-config`;
  private readonly aiBaseUrl        = `/ai`;

  private listingConfigCache:    ListingConfigData | null = null;
  private listingConfigRequest$: Observable<ListingConfigData> | null = null;

  constructor(private readonly http: HttpClient) {}

  getListingConfig(): Observable<ListingConfigData> {
    if (this.listingConfigCache) return of(this.listingConfigCache);
    if (!this.listingConfigRequest$) {
      this.listingConfigRequest$ = this.http
        .get<ListingConfigApiResponse>(this.listingConfigUrl)
        .pipe(
          map(res => ({
            catalog:  res.data.catalog  ?? { categories: [] },
            features: [...(res.data.features ?? [])].sort((a, b) => a.position - b.position),
          })),
          tap(data  => { this.listingConfigCache = data; }),
          shareReplay({ bufferSize: 1, refCount: false }),
          catchError(err => { this.listingConfigRequest$ = null; return throwError(() => err); })
        );
    }
    return this.listingConfigRequest$;
  }

  invalidateListingConfigCache(): void {
    this.listingConfigCache    = null;
    this.listingConfigRequest$ = null;
  }

  getCachedCatalog(): PropertyCatalogData | null {
    return this.listingConfigCache?.catalog ?? null;
  }

  getCoarseTypeById(categoryId: string): string {
    return this.listingConfigCache?.catalog.categories
      .find(c => c._id === categoryId)?.coarseType ?? 'Homes';
  }

  getCategoryNameById(categoryId: string): string {
    return this.listingConfigCache?.catalog.categories
      .find(c => c._id === categoryId)?.name ?? '';
  }

  getSubtypeNameById(categoryId: string, subtypeId: string): string {
    return this.listingConfigCache?.catalog.categories
      .find(c => c._id === categoryId)
      ?.subtypes.find(s => s._id === subtypeId)?.name ?? '';
  }

  createListing(payload: CreateListingPayload): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(this.baseUrl, { ...payload, status: 'Published' });
  }

  saveDraft(payload: CreateListingPayload): Observable<ApiResponse<AddListingResponse>> {
    return this.http.post<ApiResponse<AddListingResponse>>(this.baseUrl, { ...payload, status: 'Draft' });
  }

  getPropertyById(id: string): Observable<PropertyDetailDocument | null> {
    const safeId = (id ?? '').trim();
    if (!safeId) return of(null);
    return this.http
      .get<PropertyDetailApiResponse>(`${this.baseUrl}/${encodeURIComponent(safeId)}`)
      .pipe(map(res => res?.data?.property ?? null));
  }

  updateProperty(id: string, payload: CreateListingPayload): Observable<ApiResponse<AddListingResponse>> {
    const safeId = (id ?? '').trim();
    if (!safeId) return throwError(() => new Error('Missing property id'));
    return this.http.put<ApiResponse<AddListingResponse>>(
      `${this.baseUrl}/${encodeURIComponent(safeId)}`,
      payload
    );
  }

  getProperties(query: PropertiesListQuery = {}): Observable<PropertiesListResult> {
    const params = this.buildPropertiesListParams(query);
    return this.http
      .get<PropertiesListApiResponse>(this.baseUrl, { params })
      .pipe(map(res => this.normalizePropertiesListResponse(res)));
  }

  generateListingTitle(body: GenerateListingTitleRequest): Observable<string> {
    return this.http
      .post<ApiResponse<{ title?: string }>>(`${this.aiBaseUrl}/generate-title`, body)
      .pipe(map(res => (res?.data?.title ?? '').trim()));
  }

  generateListingDescription(body: GenerateListingDescriptionRequest): Observable<string> {
    return this.http
      .post<ApiResponse<{ description?: string }>>(`${this.aiBaseUrl}/generate-description`, body)
      .pipe(map(res => (res?.data?.description ?? '').trim()));
  }

  private buildPropertiesListParams(query: PropertiesListQuery): HttpParams {
    const page  = Math.max(1, query.page  ?? PROPERTIES_LIST_DEFAULT_PAGE);
    const limit = Math.min(PROPERTIES_LIST_MAX_LIMIT, Math.max(1, query.limit ?? PROPERTIES_LIST_DEFAULT_LIMIT));

    let p = new HttpParams().set('page', String(page)).set('limit', String(limit));

    const setParam = (key: keyof PropertiesListQuery, value: string | number | undefined) => {
      if (value == null || value === '') return;
      p = p.set(key, String(value));
    };

    setParam('listedBy',     query.listedBy);
    setParam('status',       query.status);
    setParam('purpose',      query.purpose);
    setParam('propertyType', query.propertyType);
    if (query.minPrice != null) setParam('minPrice', query.minPrice);
    if (query.maxPrice != null) setParam('maxPrice', query.maxPrice);
    setParam('city',         query.city);
    setParam('sortBy',       query.sortBy);
    setParam('sortOrder',    query.sortOrder);

    return p;
  }

  private normalizePropertiesListResponse(res: PropertiesListApiResponse): PropertiesListResult {
    return {
      success:    res.success    ?? true,
      properties: res.data?.properties ?? [],
      count:      res.count      ?? 0,
      total:      res.total      ?? 0,
      page:       res.page       ?? PROPERTIES_LIST_DEFAULT_PAGE,
      totalPages: res.totalPages ?? 0,
    };
  }
}
