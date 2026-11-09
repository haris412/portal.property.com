import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string | null;
  isRead: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getNotificationItems(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];

  for (const key of ['notifications', 'items', 'data']) {
    const value = response[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      const nested = getNotificationItems(value);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function readText(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function normalizeNotification(value: unknown, index: number): AppNotification | null {
  if (!isRecord(value)) return null;

  const rawDate = value['createdAt'] ?? value['timestamp'] ?? value['date'];
  const parsedDate = typeof rawDate === 'string' || typeof rawDate === 'number'
    ? new Date(rawDate)
    : null;
  const isValidDate = parsedDate !== null && !Number.isNaN(parsedDate.getTime());
  const readValue = value['isRead'] ?? value['read'];

  return {
    id: readText(value, ['_id', 'id', 'notificationId']) ?? `notification-${index}`,
    title: readText(value, ['title', 'subject']) ?? 'Notification',
    message: readText(value, ['message', 'body', 'description', 'content']) ?? '',
    createdAt: isValidDate ? parsedDate.toISOString() : null,
    isRead: typeof readValue === 'boolean' ? readValue : value['status'] === 'read',
  };
}

function parseUnreadCount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Math.max(0, Math.floor(Number(value)));
  }
  if (!isRecord(value)) return null;

  for (const key of ['unreadCount', 'unread', 'count', 'data']) {
    if (key in value) {
      const count = parseUnreadCount(value[key]);
      if (count !== null) return count;
    }
  }

  return null;
}

@Injectable({ providedIn: 'root' })
export class AppNotificationsService {
  private readonly http = inject(HttpClient);
  private readonly itemsState = signal<AppNotification[]>([]);
  private readonly unreadCountState = signal(0);
  private readonly hasLoaded = signal(false);
  private request$: Observable<AppNotification[]> | null = null;
  private unreadCountRequest$: Observable<number> | null = null;

  readonly items = this.itemsState.asReadonly();
  readonly unreadCount = this.unreadCountState.asReadonly();

  load(force = false): Observable<AppNotification[]> {
    if (this.request$) return this.request$;
    if (this.hasLoaded() && !force) return of(this.itemsState());

    this.request$ = this.http.get<unknown>('/notifications').pipe(
      map((response) => getNotificationItems(response)
        .map((item, index) => normalizeNotification(item, index))
        .filter((item): item is AppNotification => item !== null)),
      tap((items) => {
        this.itemsState.set(items);
        this.hasLoaded.set(true);
      }),
      finalize(() => {
        this.request$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.request$;
  }

  refreshUnreadCount(): Observable<number> {
    if (this.unreadCountRequest$) return this.unreadCountRequest$;

    this.unreadCountRequest$ = this.http.get<unknown>('/notifications/unread-count').pipe(
      map((response) => parseUnreadCount(response) ?? 0),
      tap((count) => this.unreadCountState.set(count)),
      finalize(() => {
        this.unreadCountRequest$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.unreadCountRequest$;
  }

  markRead(id: string): Observable<void> {
    return this.http.patch<void>(`/notifications/${encodeURIComponent(id)}/read`, {}).pipe(
      tap(() => {
        let changed = false;
        this.itemsState.update((items) => items.map((item) => {
          if (item.id !== id || item.isRead) return item;
          changed = true;
          return { ...item, isRead: true };
        }));
        if (changed) {
          this.unreadCountState.update((count) => Math.max(0, count - 1));
        }
      }),
    );
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>('/notifications/read-all', {}).pipe(
      tap(() => {
        this.itemsState.update((items) => items.map((item) => ({ ...item, isRead: true })));
        this.unreadCountState.set(0);
      }),
    );
  }
}