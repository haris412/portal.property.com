import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { fromApiUser, User } from './auth.service';

// ── List users ────────────────────────────────────────────────────────────────

export interface ListUsersQuery {
  createdBy?: string;
  agency?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'firstName' | 'lastName';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  role?: { name: string };
  agency?: { _id?: string; name: string; logoUrl?: string; isActive?: boolean };
  createdBy?: { firstName: string; lastName: string; email: string };
  createdAt?: string;
}

export interface ListUsersResult {
  users: UserListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Update user ───────────────────────────────────────────────────────────────

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  location?: string;
}

// ── Internal API shapes ───────────────────────────────────────────────────────

interface ListUsersApiResponse {
  success?: boolean;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
  count?: number;
  data?: {
    users?: unknown[];
    pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
  };
}

interface UpdateUserApiResponse {
  success?: boolean;
  message?: string;
  data?: { user?: Record<string, unknown> };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeUserRow(raw: unknown): UserListItem | null {
  if (!isRecord(raw)) return null;
  const id = raw['_id'] ?? raw['id'];
  if (typeof id !== 'string' || !id) return null;

  const role = isRecord(raw['role'])
    ? { name: String(raw['role']['name'] ?? '') }
    : undefined;

  const agency = isRecord(raw['agency'])
    ? {
        _id:      typeof raw['agency']['_id'] === 'string' ? raw['agency']['_id'] : undefined,
        name:     String(raw['agency']['name'] ?? ''),
        logoUrl:  typeof raw['agency']['logoUrl'] === 'string' ? raw['agency']['logoUrl'] : undefined,
        isActive: typeof raw['agency']['isActive'] === 'boolean' ? raw['agency']['isActive'] : undefined,
      }
    : undefined;

  const cb = raw['createdBy'];
  const createdBy = isRecord(cb)
    ? {
        firstName: String(cb['firstName'] ?? ''),
        lastName:  String(cb['lastName'] ?? ''),
        email:     String(cb['email'] ?? ''),
      }
    : undefined;

  return {
    _id:             id,
    firstName:       typeof raw['firstName'] === 'string' ? raw['firstName'] : '',
    lastName:        typeof raw['lastName']  === 'string' ? raw['lastName']  : '',
    email:           typeof raw['email']     === 'string' ? raw['email']     : '',
    phoneNumber:     typeof raw['phoneNumber'] === 'string' ? raw['phoneNumber'] : undefined,
    isActive:        typeof raw['isActive']  === 'boolean' ? raw['isActive']  : true,
    isEmailVerified: typeof raw['isEmailVerified'] === 'boolean' ? raw['isEmailVerified'] : false,
    role,
    agency,
    createdBy,
    createdAt: typeof raw['createdAt'] === 'string' ? raw['createdAt'] : undefined,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  listUsers(query: ListUsersQuery): Observable<ListUsersResult> {
    let params = new HttpParams();
    if (query.createdBy)             params = params.set('createdBy',  query.createdBy);
    if (query.agency)                params = params.set('agency',     query.agency);
    if (query.role)                  params = params.set('role',       query.role);
    if (query.search?.trim())        params = params.set('search',     query.search.trim());
    if (query.isActive != null)      params = params.set('isActive',   String(query.isActive));
    if (query.page != null)          params = params.set('page',       String(query.page));
    if (query.limit != null)         params = params.set('limit',      String(Math.min(100, query.limit)));
    if (query.sortBy)                params = params.set('sortBy',     query.sortBy);
    if (query.sortOrder)             params = params.set('sortOrder',  query.sortOrder);

    return this.http.get<ListUsersApiResponse>(this.baseUrl, { params }).pipe(
      map((res) => {
        if (res.success === false) throw new Error(res.message ?? 'Could not load users');
        const rawList = res.data?.users ?? [];
        const users = rawList.map(normalizeUserRow).filter((u): u is UserListItem => u !== null);
        const pg = res.data?.pagination;
        const page       = pg?.page       ?? res.page       ?? query.page  ?? 1;
        const limit      = pg?.limit                        ?? query.limit ?? 20;
        const total      = pg?.total      ?? res.total      ?? users.length;
        const totalPages = pg?.totalPages ?? res.totalPages ?? Math.max(1, Math.ceil(total / limit));
        return { users, page, limit, total, totalPages };
      }),
      catchError((err) => throwError(() => err))
    );
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .put<UpdateUserApiResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload)
      .pipe(
        map((res) => {
          if (res.success === false) throw new Error(res.message ?? 'Could not update profile');
          const raw = res.data?.user;
          if (!raw) throw new Error('Invalid response from server');
          return fromApiUser(raw);
        }),
        catchError((err) => throwError(() => err))
      );
  }

  getUserById(id: string): Observable<UserListItem> {
    return this.http
      .get<{ success?: boolean; message?: string; data?: { user?: unknown } }>(
        `${this.baseUrl}/${encodeURIComponent(id)}`
      )
      .pipe(
        map((res) => {
          if (res.success === false) throw new Error(res.message ?? 'Could not load user');
          const user = normalizeUserRow(res.data?.user);
          if (!user) throw new Error('Invalid response from server');
          return user;
        }),
        catchError((err) => throwError(() => err))
      );
  }

  deleteUser(id: string): Observable<void> {
    return this.http
      .delete<{ success: boolean; message?: string }>(`${this.baseUrl}/${encodeURIComponent(id)}`)
      .pipe(
        map((res) => {
          if (res.success === false) throw new Error(res.message ?? 'Could not delete user');
        }),
        catchError((err) => throwError(() => err))
      );
  }
}
