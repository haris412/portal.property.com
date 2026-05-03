import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { PropertyAlert, AlertPurpose, CreateAlertPayload, UpdateAlertPayload } from '../models/alert.models';

// ── API response shapes ───────────────────────────────────────────────────────

interface GetAlertsApiResponse {
  success?: boolean;
  message?: string;
  errors?: string[];
  count?: number;
  data?: { alerts?: unknown[] };
}

interface MutateAlertApiResponse {
  success?: boolean;
  message?: string;
  errors?: string[];
  data?: { alert?: unknown };
}

interface DeleteAlertApiResponse {
  success?: boolean;
  message?: string;
  errors?: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractMessage(res: { message?: string; errors?: string[] }, fallback: string): string {
  return res.errors?.[0] ?? res.message ?? fallback;
}

const VALID_PURPOSES = new Set<string>(['For Sale', 'For Rent', 'Any']);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeAlert(raw: unknown): PropertyAlert | null {
  if (!isRecord(raw)) return null;
  const id = raw['_id'];
  if (typeof id !== 'string' || !id) return null;

  const purposeRaw = raw['purpose'];
  const purpose = (typeof purposeRaw === 'string' && VALID_PURPOSES.has(purposeRaw))
    ? purposeRaw as AlertPurpose
    : null;

  return {
    _id:          id,
    purpose,
    city:         typeof raw['city']         === 'string' ? raw['city']         : null,
    neighborhood: typeof raw['neighborhood'] === 'string' ? raw['neighborhood'] : null,
    propertyType: typeof raw['propertyType'] === 'string' ? raw['propertyType'] : null,
    subtype:      typeof raw['subtype']      === 'string' ? raw['subtype']      : null,
    minPrice:     typeof raw['minPrice']     === 'number' ? raw['minPrice']     : null,
    maxPrice:     typeof raw['maxPrice']     === 'number' ? raw['maxPrice']     : null,
    minBedrooms:  typeof raw['minBedrooms']  === 'number' ? raw['minBedrooms']  : null,
    isActive:     typeof raw['isActive']     === 'boolean' ? raw['isActive']    : true,
    createdAt:    typeof raw['createdAt']    === 'string' ? raw['createdAt']    : undefined,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/alerts`;

  private readonly _alerts    = signal<PropertyAlert[]>([]);
  private readonly _loading   = signal(false);
  private readonly _loadError = signal<string | null>(null);

  readonly alerts    = this._alerts.asReadonly();
  readonly loading   = this._loading.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  loadMine(): Observable<void> {
    this._loading.set(true);
    this._loadError.set(null);

    return this.http.get<GetAlertsApiResponse>(`${this.baseUrl}/mine`).pipe(
      map((res) => {
        if (res.success === false) throw new Error(extractMessage(res, 'Could not load alerts'));
        const list = (res.data?.alerts ?? [])
          .map(normalizeAlert)
          .filter((a): a is PropertyAlert => a !== null);
        this._alerts.set(list);
        this._loading.set(false);
      }),
      catchError((err: unknown) => {
        this._loading.set(false);
        this._loadError.set((err instanceof Error) ? err.message : 'Could not load alerts');
        return throwError(() => err);
      })
    );
  }

  create(payload: CreateAlertPayload): Observable<PropertyAlert> {
    return this.http.post<MutateAlertApiResponse>(this.baseUrl, payload).pipe(
      map((res) => {
        if (res.success === false) throw new Error(extractMessage(res, 'Could not create alert'));
        const alert = normalizeAlert(res.data?.alert);
        if (!alert) throw new Error('Invalid response from server');
        this._alerts.update((list) => [alert, ...list]);
        return alert;
      })
    );
  }

  update(id: string, payload: UpdateAlertPayload): Observable<PropertyAlert> {
    return this.http
      .put<MutateAlertApiResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`, payload)
      .pipe(
        map((res) => {
          if (res.success === false) throw new Error(extractMessage(res, 'Could not update alert'));
          const alert = normalizeAlert(res.data?.alert);
          if (!alert) throw new Error('Invalid response from server');
          this._alerts.update((list) => list.map((a) => (a._id === id ? alert : a)));
          return alert;
        })
      );
  }

  toggle(id: string, isActive: boolean): Observable<PropertyAlert> {
    return this.update(id, { isActive });
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<DeleteAlertApiResponse>(`${this.baseUrl}/${encodeURIComponent(id)}`)
      .pipe(
        map((res) => {
          if (res.success === false) throw new Error(extractMessage(res, 'Could not delete alert'));
          this._alerts.update((list) => list.filter((a) => a._id !== id));
        })
      );
  }
}
