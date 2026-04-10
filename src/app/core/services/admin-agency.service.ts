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

/** Body for POST /api/admin/agencies/:agencyId/users */
export interface CreateAgencyUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  displayName?: string;
  profileImageUrl?: string;
  roleName?: string;
}

export interface AgencyUserItem {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phoneNumber: string;
  profileImageUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  role?: { _id: string; name: string };
  agency?: { _id: string; name: string; logoUrl?: string };
  createdAt?: string;
}

/** Body for PATCH /api/admin/agencies/:agencyId/users/:userId */
export interface UpdateAgencyUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  displayName?: string;
  profileImageUrl?: string;
  location?: string;
  roleName?: string;
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
   * GET /api/admin/agencies/:id — fetch single agency (Bearer admin token).
   */
  getAgencyById(id: string): Observable<AgencyListItem> {
    return this.http
      .get<{ success?: boolean; message?: string; data?: { agency?: unknown } }>(
        `${this.baseUrl}/${encodeURIComponent(id)}`
      )
      .pipe(
        map((res) => {
          if (res.success === false) throw new Error(res.message ?? 'Could not load agency');
          const agency = normalizeAgencyRow(res.data?.agency);
          if (!agency) throw new Error('Invalid response from server');
          return agency;
        }),
        catchError((err) => throwError(() => err))
      );
  }

  /**
   * PATCH /api/admin/agencies/:id — update agency (Bearer admin token).
   */
  updateAgency(id: string, payload: Partial<CreateAgencyPayload>): Observable<AgencyListItem> {
    return this.http
      .patch<CreateAgencyApiResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload)
      .pipe(
        map((res) => {
          if (res.success === false) throw new Error(res.message ?? 'Could not update agency');
          const d = res.data;
          const raw = isRecord(d) && 'agency' in d ? d['agency'] : d;
          const agency = normalizeAgencyRow(raw);
          if (!agency) throw new Error('Invalid response from server');
          return agency;
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
   * POST /api/admin/agencies/:agencyId/users — create user for agency (Bearer admin token).
   */
  createAgencyUser(agencyId: string, payload: CreateAgencyUserPayload): Observable<AgencyUserItem> {
    const url = `${this.baseUrl}/${encodeURIComponent(agencyId)}/users`;
    return this.http.post<{ success?: boolean; message?: string; data?: { user?: unknown } }>(url, payload).pipe(
      map((res) => {
        if (res.success === false) throw new Error(res.message ?? 'Could not create user');
        const raw = res.data?.user;
        if (!isRecord(raw)) throw new Error('Invalid response from server');
        return {
          _id:              typeof raw['_id'] === 'string' ? raw['_id'] : '',
          email:            typeof raw['email'] === 'string' ? raw['email'] : '',
          firstName:        typeof raw['firstName'] === 'string' ? raw['firstName'] : '',
          lastName:         typeof raw['lastName'] === 'string' ? raw['lastName'] : '',
          displayName:      typeof raw['displayName'] === 'string' ? raw['displayName'] : undefined,
          phoneNumber:      typeof raw['phoneNumber'] === 'string' ? raw['phoneNumber'] : '',
          profileImageUrl:  typeof raw['profileImageUrl'] === 'string' ? raw['profileImageUrl'] : undefined,
          isActive:         typeof raw['isActive'] === 'boolean' ? raw['isActive'] : true,
          isEmailVerified:  typeof raw['isEmailVerified'] === 'boolean' ? raw['isEmailVerified'] : true,
          role:             isRecord(raw['role']) ? { _id: String(raw['role']['_id'] ?? ''), name: String(raw['role']['name'] ?? '') } : undefined,
          agency:           isRecord(raw['agency']) ? { _id: String(raw['agency']['_id'] ?? ''), name: String(raw['agency']['name'] ?? ''), logoUrl: typeof raw['agency']['logoUrl'] === 'string' ? raw['agency']['logoUrl'] : undefined } : undefined,
          createdAt:        typeof raw['createdAt'] === 'string' ? raw['createdAt'] : undefined,
        } satisfies AgencyUserItem;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  /**
   * PATCH /api/admin/agencies/:agencyId/users/:userId — update agency user (Bearer admin token).
   */
  updateAgencyUser(agencyId: string, userId: string, payload: UpdateAgencyUserPayload): Observable<AgencyUserItem> {
    const url = `${this.baseUrl}/${encodeURIComponent(agencyId)}/users/${encodeURIComponent(userId)}`;
    return this.http.patch<{ success?: boolean; message?: string; data?: { user?: unknown } }>(url, payload).pipe(
      map((res) => {
        if (res.success === false) throw new Error(res.message ?? 'Could not update user');
        const raw = res.data?.user;
        if (!isRecord(raw)) throw new Error('Invalid response from server');
        return {
          _id:             typeof raw['_id'] === 'string' ? raw['_id'] : '',
          email:           typeof raw['email'] === 'string' ? raw['email'] : '',
          firstName:       typeof raw['firstName'] === 'string' ? raw['firstName'] : '',
          lastName:        typeof raw['lastName'] === 'string' ? raw['lastName'] : '',
          displayName:     typeof raw['displayName'] === 'string' ? raw['displayName'] : undefined,
          phoneNumber:     typeof raw['phoneNumber'] === 'string' ? raw['phoneNumber'] : '',
          profileImageUrl: typeof raw['profileImageUrl'] === 'string' ? raw['profileImageUrl'] : undefined,
          isActive:        typeof raw['isActive'] === 'boolean' ? raw['isActive'] : true,
          isEmailVerified: typeof raw['isEmailVerified'] === 'boolean' ? raw['isEmailVerified'] : false,
          role:    isRecord(raw['role'])   ? { _id: String(raw['role']['_id'] ?? ''),   name: String(raw['role']['name'] ?? '') }   : undefined,
          agency:  isRecord(raw['agency']) ? { _id: String(raw['agency']['_id'] ?? ''), name: String(raw['agency']['name'] ?? ''), logoUrl: typeof raw['agency']['logoUrl'] === 'string' ? raw['agency']['logoUrl'] : undefined } : undefined,
          createdAt: typeof raw['createdAt'] === 'string' ? raw['createdAt'] : undefined,
        } satisfies AgencyUserItem;
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
