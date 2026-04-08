import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export type AgencySortBy = 'createdAt' | 'updatedAt' | 'name';
export type AgencySortOrder = 'asc' | 'desc';

/** Query for GET /api/admin/agencies */
export interface ListAgenciesQuery {
  createdBy?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  /** Partial match on name, location, contactName, contactEmail */
  search?: string;
  name?: string;
  location?: string;
  sortBy?: AgencySortBy;
  sortOrder?: AgencySortOrder;
}

export interface AgencyContact {
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface AgencyListItem {
  _id: string;
  name: string;
  logoUrl?: string;
  location?: string;
  contacts?: AgencyContact[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListAgenciesResult {
  agencies: AgencyListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Body for POST /api/admin/agencies */
export interface CreateAgencyPayload {
  name: string;
  logoUrl?: string;
  location?: string;
  contacts: AgencyContact[];
}

interface ListAgenciesApiResponse {
  success?: boolean;
  message?: string;
  data?: {
    agencies?: unknown[];
    items?: unknown[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
    total?: number;
  };
}

interface CreateAgencyApiResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

function normalizeAgencyRow(row: unknown): AgencyListItem | null {
  if (!isRecord(row)) return null;
  const id = row['_id'] ?? row['id'];
  if (typeof id !== 'string' || !id.length) return null;
  
  // Normalize contacts array
  let contacts: AgencyContact[] = [];
  const rawContacts = row['contacts'];
  if (Array.isArray(rawContacts)) {
    contacts = rawContacts
      .filter((c): c is Record<string, unknown> => isRecord(c))
      .map((c): AgencyContact => ({
        name: typeof c['name'] === 'string' ? c['name'] : '',
        email: typeof c['email'] === 'string' ? c['email'] : '',
        phone: typeof c['phone'] === 'string' ? c['phone'] : '',
        isPrimary: typeof c['isPrimary'] === 'boolean' ? c['isPrimary'] : false,
      }));
  } else {
    // Backward compatibility: single contact fields
    const contactName = typeof row['contactName'] === 'string' ? row['contactName'] : '';
    const contactEmail = typeof row['contactEmail'] === 'string' ? row['contactEmail'] : '';
    const contactPhone = typeof row['contactPhone'] === 'string' ? row['contactPhone'] : '';
    
    if (contactName || contactEmail || contactPhone) {
      contacts = [{
        name: contactName,
        email: contactEmail,
        phone: contactPhone,
        isPrimary: true,
      }];
    }
  }
  
  return {
    _id: id,
    name: typeof row['name'] === 'string' ? row['name'] : '',
    logoUrl: typeof row['logoUrl'] === 'string' ? row['logoUrl'] : undefined,
    location: typeof row['location'] === 'string' ? row['location'] : undefined,
    contacts,
    isActive: typeof row['isActive'] === 'boolean' ? row['isActive'] : undefined,
    createdAt: typeof row['createdAt'] === 'string' ? row['createdAt'] : undefined,
    updatedAt: typeof row['updatedAt'] === 'string' ? row['updatedAt'] : undefined,
  };
}

function appendParams(params: HttpParams, q: ListAgenciesQuery): HttpParams {
  let p = params;
  if (q.createdBy) p = p.set('createdBy', q.createdBy);
  if (q.page != null && q.page >= 1) p = p.set('page', String(q.page));
  if (q.limit != null && q.limit >= 1) p = p.set('limit', String(Math.min(100, q.limit)));
  if (q.isActive === true || q.isActive === false) p = p.set('isActive', String(q.isActive));
  if (q.search?.trim()) p = p.set('search', q.search.trim());
  if (q.name?.trim() && !q.search?.trim()) p = p.set('name', q.name.trim());
  if (q.location?.trim() && !q.search?.trim()) p = p.set('location', q.location.trim());
  if (q.sortBy) p = p.set('sortBy', q.sortBy);
  if (q.sortOrder) p = p.set('sortOrder', q.sortOrder);
  return p;
}

@Injectable({ providedIn: 'root' })
export class AdminAgencyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin/agencies`;

  /**
   * GET /api/admin/agencies — list with filters (Bearer admin token).
   */
  listAgencies(query: ListAgenciesQuery): Observable<ListAgenciesResult> {
    const params = appendParams(new HttpParams(), query);
    return this.http.get<ListAgenciesApiResponse>(this.baseUrl, { params }).pipe(
      map((res) => {
        if (res.success === false) {
          throw new Error(res.message ?? 'Could not load agencies');
        }
        const data = res.data;
        const rawList = data?.agencies ?? data?.items ?? [];
        const agencies = rawList
          .map((row) => normalizeAgencyRow(row))
          .filter((a): a is AgencyListItem => a != null);
        const pg = data?.pagination;
        const page = pg?.page ?? query.page ?? 1;
        const limit = pg?.limit ?? query.limit ?? 20;
        const total = pg?.total ?? data?.total ?? agencies.length;
        const totalPages =
          pg?.totalPages ?? (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
        return { agencies, page, limit, total, totalPages };
      }),
      catchError((err) => throwError(() => err))
    );
  }

  /**
   * POST /api/admin/agencies — create (Bearer admin token).
   */
  createAgency(payload: CreateAgencyPayload): Observable<AgencyListItem> {
    const body = {
      name: payload.name.trim(),
      ...(payload.logoUrl?.trim() ? { logoUrl: payload.logoUrl.trim() } : {}),
      ...(payload.location?.trim() ? { location: payload.location.trim() } : {}),
      contacts: payload.contacts.map(contact => ({
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        isPrimary: contact.isPrimary,
      })),
    };

    return this.http.post<CreateAgencyApiResponse>(this.baseUrl, body).pipe(
      map((res) => {
        if (res.success === false) {
          throw new Error(res.message ?? 'Could not create agency');
        }
        const d = res.data;
        const raw = isRecord(d) && 'agency' in d ? d['agency'] : d;
        const agency = normalizeAgencyRow(raw);
        if (!agency) {
          throw new Error(res.message ?? 'Invalid create agency response');
        }
        return agency;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  /**
   * DELETE /api/admin/agencies/:id — remove agency (Bearer admin token).
   */
  deleteAgency(id: string): Observable<void> {
    const url = `${this.baseUrl}/${encodeURIComponent(id)}`;
    return this.http.delete<{ success?: boolean; message?: string } | null>(url).pipe(
      map((body) => {
        if (body && typeof body === 'object' && body.success === false) {
          throw new Error(body.message ?? 'Could not delete agency');
        }
      }),
      catchError((err) => throwError(() => err))
    );
  }
}
