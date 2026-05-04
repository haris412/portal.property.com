import { formatDate } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AppointmentListItem,
  AppointmentApiProperty,
  AppointmentApiUser,
  AppointmentStatus
} from '../models/appointment.models';

function pickString(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return '';
}

function personName(u: unknown): string {
  if (!u || typeof u !== 'object') return '';
  const o = u as Record<string, unknown>;
  const first = pickString(o, 'firstName');
  const last = pickString(o, 'lastName');
  return [first, last].filter(Boolean).join(' ').trim();
}

function personPhone(u: unknown): string {
  if (!u || typeof u !== 'object') return '';
  return pickString(u as Record<string, unknown>, 'phoneNumber', 'phone');
}

function roleLabel(user: unknown): string {
  if (!user || typeof user !== 'object') return '—';
  const o = user as Record<string, unknown>;
  const r = o['role'];
  if (r && typeof r === 'object') {
    return pickString(r as Record<string, unknown>, 'name') || '—';
  }
  if (typeof r === 'string') return r;
  return '—';
}

function normalizeStatus(raw: string): AppointmentStatus {
  const lower = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (
    lower === 'in_progress' ||
    lower === 'inprogress' ||
    lower === 'confirmed' ||
    lower === 'pending' ||
    lower === 'completed' ||
    lower === 'rejected' ||
    lower === 'cancelled' ||
    lower === 'rescheduled'
  ) {
    if (lower === 'in_progress' || lower === 'inprogress') {
      return 'in_progress';
    }
    return lower as AppointmentStatus;
  }
  return 'pending';
}

function extractAppointmentRows(body: unknown): unknown[] {
  if (!body || typeof body !== 'object') return [];
  const root = body as Record<string, unknown>;
  const data = root['data'] !== undefined ? root['data'] : root;

  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const nested = d['appointments'] ?? d['items'] ?? d['results'];
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

/**
 * Same instant used for list date/time labels and {@link AppointmentListItem.scheduledStartMs}.
 * API `date` is read as UTC calendar day; optional `time` is local wall-clock on that day.
 */
function resolveAppointmentLocalInstant(dateRaw: unknown, timeRaw: unknown): Date | null {
  const dateStr = dateRaw != null ? String(dateRaw) : '';
  const timeStr = timeRaw != null ? String(timeRaw).trim() : '';

  if (!dateStr) {
    return null;
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const y = parsed.getUTCFullYear();
  const mo = parsed.getUTCMonth();
  const da = parsed.getUTCDate();

  if (timeStr && /^\d{1,2}:\d{2}/.test(timeStr)) {
    const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
    return new Date(y, mo, da, hh || 0, mm || 0, 0, 0);
  }

  return parsed;
}

/** Parses `date` (ISO, day in UTC) with optional `time` ("HH:mm") as local wall-clock that day. */
function formatAppointmentDateTime(
  dateRaw: unknown,
  timeRaw: unknown
): { date: string; time: string } {
  const instant = resolveAppointmentLocalInstant(dateRaw, timeRaw);
  if (!instant) {
    return { date: '—', time: '—' };
  }

  return {
    date: formatDate(instant, 'd MMM yyyy', 'en-US'),
    time: formatDate(instant, 'h:mm a', 'en-US')
  };
}

function mapApiToListItem(raw: unknown): AppointmentListItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const id = String(o['_id'] ?? o['id'] ?? '');
  if (!id) return null;

  const propertyId = o['propertyId'];
  let property = 'Property';
  let area = '—';
  let listingPropertyId: string | undefined;
  let listingOwner: unknown = null;
  let propertyObj: AppointmentApiProperty | undefined;

  if (propertyId && typeof propertyId === 'object') {
    const p = propertyId as Record<string, unknown>;
    const pid = String(p['_id'] ?? '');
    if (pid) listingPropertyId = pid;
    property =
      pickString(p, 'listingTitle', 'title') ||
      pickString(p, 'fullAddress') ||
      'Property';
    area = pickString(p, 'neighborhood', 'city', 'area') || '—';
    listingOwner = p['userId'];

    propertyObj = {
      _id: pid || undefined,
      listingTitle: pickString(p, 'listingTitle', 'title') || undefined,
      fullAddress: pickString(p, 'fullAddress') || undefined,
      neighborhood: pickString(p, 'neighborhood') || undefined,
      city: pickString(p, 'city') || undefined,
      price:
        typeof p['price'] === 'number'
          ? (p['price'] as number)
          : undefined,
      propertyType: pickString(p, 'propertyType') || undefined,
      purpose: pickString(p, 'purpose') || undefined,
      status: pickString(p, 'status') || undefined
    };
  }

  const appointmentUser = o['userId'];
  let userObj: AppointmentApiUser | undefined;
  if (appointmentUser && typeof appointmentUser === 'object') {
    const u = appointmentUser as Record<string, unknown>;
    const roleRaw = u['role'];
    const roleObj =
      roleRaw && typeof roleRaw === 'object'
        ? (roleRaw as Record<string, unknown>)
        : null;

    userObj = {
      _id: pickString(u, '_id', 'id') || undefined,
      email: pickString(u, 'email') || undefined,
      firstName: pickString(u, 'firstName') || undefined,
      lastName: pickString(u, 'lastName') || undefined,
      phoneNumber: pickString(u, 'phoneNumber', 'phone') || undefined,
      role: roleObj
        ? {
            _id: pickString(roleObj, '_id', 'id') || undefined,
            name: pickString(roleObj, 'name') || undefined
          }
        : undefined
    };
  }

  const clientNameFromApi = pickString(o, 'clientName');
  const clientPhoneFromApi = pickString(o, 'clientPhoneNumber', 'clientPhone');
  const clientEmailFromApi = pickString(o, 'clientEmail');

  const clientName = clientNameFromApi || personName(appointmentUser);
  const clientPhone = clientPhoneFromApi || personPhone(appointmentUser);

  const agentName = personName(listingOwner);
  const agentPhone = personPhone(listingOwner);

  const { date: dateDisplay, time: timeDisplay } = formatAppointmentDateTime(
    o['date'],
    o['time']
  );

  const scheduledInstant = resolveAppointmentLocalInstant(o['date'], o['time']);
  const scheduledStartMs = scheduledInstant ? scheduledInstant.getTime() : undefined;

  const status = normalizeStatus(String(o['status'] ?? 'pending'));
  const type =
    pickString(o, 'appointmentType', 'type', 'purpose', 'visitType') || 'Appointment';

  const role = roleLabel(appointmentUser);

  const fallbackPhone = clientPhone || agentPhone || '—';

  const createdAt =
    o['createdAt'] != null ? String(o['createdAt']) : undefined;
  const updatedAt =
    o['updatedAt'] != null ? String(o['updatedAt']) : undefined;

  const appointmentLink =
    pickString(o, 'appointmentLink', 'appointment_link') || undefined;

  return {
    id,
    property,
    area,
    date: dateDisplay,
    type,
    clientName: clientName || undefined,
    clientEmail: clientEmailFromApi || undefined,
    clientPhoneNumber: clientPhone || undefined,
    agent: agentName || undefined,
    agentPhone: agentPhone || undefined,
    listingPropertyId,
    user: userObj,
    propertyObj,
    role,
    phone: fallbackPhone,
    time: timeDisplay,
    scheduledStartMs,
    status,
    appointmentLink,
    isRescheduled: Boolean(o['isRescheduled'] ?? o['rescheduled']),
    createdAt,
    updatedAt
  };
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/appointments`;

  getByUserId(userId: string): Observable<AppointmentListItem[]> {
    const url = `${this.base}/user/${encodeURIComponent(userId)}`;
    return this.http.get<unknown>(url).pipe(
      map((body) => {
        const rows = extractAppointmentRows(body);
        const out: AppointmentListItem[] = [];
        for (const row of rows) {
          const item = mapApiToListItem(row);
          if (item) out.push(item);
        }
        return out;
      })
    );
  }

  /**
   * PATCH `/api/appointments/:id/status` — updates status and optionally persists the video room URL.
   * Backend status values may be PascalCase (e.g. `Confirmed`).
   */
  updateAppointmentStatus(
    appointmentId: string,
    status: string,
    appointmentLink?: string | null
  ): Observable<unknown> {
    const url = `${this.base}/${encodeURIComponent(appointmentId)}/status`;
    const body: Record<string, unknown> = { status };
    if (appointmentLink != null && String(appointmentLink).trim() !== '') {
      body['appointmentLink'] = String(appointmentLink).trim();
    }
    return this.http.patch<unknown>(url, body);
  }

  /** Status-only update (cancel / reject). Same endpoint as {@link updateAppointmentStatus} without a link. */
  patchStatus(appointmentId: string, status: string): Observable<unknown> {
    return this.updateAppointmentStatus(appointmentId, status);
  }
}
