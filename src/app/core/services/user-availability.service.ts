import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AgentDayAvailability } from '../models/profile.models';

function normalizeDayName(day: string): string {
  return day.trim().toLowerCase();
}

function normalizeDay(raw: unknown): AgentDayAvailability | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const day = o['day'] ?? o['dayOfWeek'];
  if (day === undefined || day === null) return null;
  return {
    day: String(day),
    enabled: Boolean(o['enabled'] ?? o['isAvailable'] ?? false),
    startTime: String(o['startTime'] ?? o['start'] ?? o['start_time'] ?? '09:00'),
    endTime: String(o['endTime'] ?? o['end'] ?? o['end_time'] ?? '18:00')
  };
}

function extractWeekFromBody(body: unknown): AgentDayAvailability[] {
  if (!body || typeof body !== 'object') return [];
  const root = body as Record<string, unknown>;
  const rawData = root['data'] !== undefined ? root['data'] : root;

  let week: unknown = null;
  if (Array.isArray(rawData)) {
    week = rawData;
  } else if (rawData && typeof rawData === 'object') {
    const payload = rawData as Record<string, unknown>;
    week = payload['week'] ?? payload['days'] ?? payload['availability'] ?? null;
  }

  if (!Array.isArray(week)) return [];

  const out: AgentDayAvailability[] = [];
  for (const item of week) {
    const n = normalizeDay(item);
    if (n) out.push(n);
  }
  return out;
}

export function defaultWeekAvailability(): AgentDayAvailability[] {
  return [
    { day: 'Monday', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Friday', enabled: true, startTime: '09:00', endTime: '18:00' },
    { day: 'Saturday', enabled: true, startTime: '10:00', endTime: '15:00' },
    { day: 'Sunday', enabled: false, startTime: '10:00', endTime: '15:00' }
  ];
}

/** Merges API days onto the default week order and labels. */
export function mergeWeekWithDefaults(
  apiDays: AgentDayAvailability[],
  defaults: AgentDayAvailability[]
): AgentDayAvailability[] {
  const byDay = new Map<string, AgentDayAvailability>();
  for (const d of apiDays) {
    byDay.set(normalizeDayName(d.day), { ...d, day: d.day });
  }
  return defaults.map((def) => {
    const hit = byDay.get(normalizeDayName(def.day));
    return hit
      ? { ...def, ...hit, day: def.day }
      : def;
  });
}

@Injectable({ providedIn: 'root' })
export class UserAvailabilityService {
  private readonly http = inject(HttpClient);
  private readonly base = `/users`;

  private url(userId: string | null): string {
    return userId
      ? `${this.base}/${encodeURIComponent(userId)}/availability`
      : `${this.base}/me/availability`;
  }

  getAvailability(userId: string | null): Observable<AgentDayAvailability[]> {
    return this.http.get<ApiResponse<unknown> | unknown>(this.url(userId)).pipe(
      map((res) => extractWeekFromBody(res))
    );
  }

  updateAvailability(userId: string | null, week: AgentDayAvailability[]): Observable<unknown> {
    return this.http.put<unknown>(this.url(userId), { week });
  }
}
