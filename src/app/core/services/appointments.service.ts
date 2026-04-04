import { formatDate } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AppointmentListItem,
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
  const lower = raw.trim().toLowerCase();
  if (
    lower === 'confirmed' ||
    lower === 'pending' ||
    lower === 'completed' ||
    lower === 'cancelled' ||
    lower === 'rescheduled'
  ) {
    return lower;
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

/** Parses `date` (ISO, day in UTC) with optional `time` ("HH:mm") as local wall-clock that day. */
function formatAppointmentDateTime(
  dateRaw: unknown,
  timeRaw: unknown
): { date: string; time: string } {
  const dateStr = dateRaw != null ? String(dateRaw) : '';
  const timeStr = timeRaw != null ? String(timeRaw).trim() : '';

  if (!dateStr) {
    return { date: '—', time: '—' };
  }

  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '—', time: '—' };
  }

  const y = parsed.getUTCFullYear();
  const mo = parsed.getUTCMonth();
  const da = parsed.getUTCDate();

  if (timeStr && /^\d{1,2}:\d{2}/.test(timeStr)) {
    const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
    const local = new Date(y, mo, da, hh || 0, mm || 0, 0, 0);
    return {
      date: formatDate(local, 'd MMM yyyy', 'en-US'),
      time: formatDate(local, 'h:mm a', 'en-US')
    };
  }

  return {
    date: formatDate(parsed, 'd MMM yyyy', 'en-US'),
    time: formatDate(parsed, 'h:mm a', 'en-US')
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
  let listingOwner: unknown = null;

  if (propertyId && typeof propertyId === 'object') {
    const p = propertyId as Record<string, unknown>;
    property =
      pickString(p, 'listingTitle', 'title') ||
      pickString(p, 'fullAddress') ||
      'Property';
    area = pickString(p, 'neighborhood', 'city', 'area') || '—';
    listingOwner = p['userId'];
  }

  const appointmentUser = o['userId'];

  const agentName = personName(appointmentUser);
  const agentPhone = personPhone(appointmentUser);

  const clientName = personName(listingOwner);
  const clientPhone = personPhone(listingOwner);

  const { date: dateDisplay, time: timeDisplay } = formatAppointmentDateTime(
    o['date'],
    o['time']
  );

  const status = normalizeStatus(String(o['status'] ?? 'pending'));
  const type =
    pickString(o, 'appointmentType', 'type', 'purpose', 'visitType') || 'Appointment';

  const role = roleLabel(appointmentUser);

  const fallbackPhone = agentPhone || clientPhone || '—';

  return {
    id,
    property,
    area,
    date: dateDisplay,
    type,
    client: clientName || undefined,
    clientPhone: clientPhone || undefined,
    agent: agentName || undefined,
    agentPhone: agentPhone || undefined,
    role,
    phone: fallbackPhone,
    time: timeDisplay,
    status,
    isRescheduled: Boolean(o['isRescheduled'] ?? o['rescheduled'])
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
}
