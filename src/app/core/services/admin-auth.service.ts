import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  of,
  switchMap,
  throwError,
  tap,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginPayload, User, toStoredUser } from './auth.service';

export const ADMIN_REFRESH_KEY = 'adminRefreshToken';
export const ADMIN_USER_KEY = 'adminUser';

interface AuthApiResponse {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

/** True when API user payload has role.name === 'Admin'. */
export function isAdminRoleFromPayload(user: unknown): boolean {
  if (user == null || typeof user !== 'object') return false;
  const r = (user as Record<string, unknown>)['role'];
  if (typeof r === 'object' && r != null && 'name' in r) {
    return (r as { name: string }).name === 'Admin';
  }
  return r === 'Admin';
}

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private accessToken: string | null = null;
  private readonly userSubject = new BehaviorSubject<User | null>(null);

  readonly currentAdminUser$ = this.userSubject.asObservable();

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  constructor() {
    if (this.storage?.getItem(ADMIN_REFRESH_KEY)) {
      this.loadStoredAdminUser();
    }
  }

  getCurrentAdminUser(): User | null {
    return this.userSubject.getValue();
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /** Used by the auth interceptor to route refresh failures to the correct session. */
  peekRefreshToken(): string | null {
    return this.storage?.getItem(ADMIN_REFRESH_KEY) ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  /** Session is valid in memory (after login or refresh). */
  isAdminSession(): boolean {
    const u = this.getCurrentAdminUser();
    const role = u?.role?.trim().toLowerCase();
    return this.isLoggedIn() && role === 'admin';
  }

  private loadStoredAdminUser(): void {
    const raw = this.storage?.getItem(ADMIN_USER_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const user = toStoredUser(parsed);
      this.userSubject.next(user);
      this.storage?.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }

  private storeAuthData(data: AuthApiResponse): void {
    if (!this.storage || !data.accessToken || !data.refreshToken || !data.user) return;
    this.accessToken = data.accessToken;
    const user = toStoredUser(data.user);
    this.storage.setItem(ADMIN_REFRESH_KEY, data.refreshToken);
    this.storage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearAdminStorageOnly(): void {
    this.accessToken = null;
    this.userSubject.next(null);
    this.storage?.removeItem(ADMIN_REFRESH_KEY);
    this.storage?.removeItem(ADMIN_USER_KEY);
  }

  login(payload: LoginPayload): Observable<{ user: User }> {
    const fallback = 'Login failed. Please try again.';
    return this.http
      .post<
        {
          success?: boolean;
          data?: AuthApiResponse;
          reason?: string;
          message?: string;
        } & AuthApiResponse
      >(`${environment.apiUrl}/api/auth/login`, payload)
      .pipe(
        switchMap((response) => {
          if (response.success === false) {
            return throwError(() => ({ message: response.message ?? fallback }));
          }
          const data = (response.data ?? response) as AuthApiResponse;
          const rawUser = data.user;
          if (!isAdminRoleFromPayload(rawUser)) {
            return throwError(() => ({
              message:
                'Access denied. This account does not have administrator privileges.',
              code: 'NOT_ADMIN' as const,
            }));
          }
          this.storeAuthData({ ...data, user: rawUser });
          return of({ user: toStoredUser(rawUser) });
        }),
        catchError((err: unknown) => {
          if (
            typeof err === 'object' &&
            err !== null &&
            (err as { code?: string }).code === 'NOT_ADMIN'
          ) {
            return throwError(() => err);
          }
          return throwError(() => ({ message: this.getAuthMessage(err, fallback) }));
        })
      );
  }

  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http
        .post(
          `${environment.apiUrl}/api/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .subscribe({ error: () => {} });
    }
    this.clearAdminStorageOnly();
    void this.router.navigate(['/admin/auth']);
  }

  /** Called when refresh fails or session is invalid (e.g. interceptor). */
  clearSessionAndRedirectToAdminLogin(): void {
    this.clearAdminStorageOnly();
    void this.router.navigate(['/admin/auth']);
  }

  refreshAccessToken(): Observable<string> {
    const refresh = this.storage?.getItem(ADMIN_REFRESH_KEY);
    if (!refresh) {
      return of('').pipe(tap(() => this.clearSessionAndRedirectToAdminLogin()));
    }

    return this.http
      .post<{ data?: { accessToken?: string }; accessToken?: string }>(
        `${environment.apiUrl}/api/auth/refresh-token`,
        { refreshToken: refresh }
      )
      .pipe(
        tap((response) => {
          const at = response.data?.accessToken ?? response.accessToken;
          if (at) this.accessToken = at;
        }),
        switchMap((response) => {
          const at = response.data?.accessToken ?? response.accessToken;
          if (at) return of(at);
          this.clearSessionAndRedirectToAdminLogin();
          return of('');
        }),
        catchError(() => {
          this.clearSessionAndRedirectToAdminLogin();
          return of('');
        })
      );
  }

  tryRestoreSession(): Promise<void> {
    if (this.accessToken) return Promise.resolve();
    const refresh = this.storage?.getItem(ADMIN_REFRESH_KEY);
    if (!refresh) return Promise.resolve();

    return new Promise((resolve) => {
      this.refreshAccessToken().subscribe({ next: () => resolve(), error: () => resolve() });
    });
  }

  private getAuthMessage(err: unknown, fallback: string): string {
    if (err == null || typeof err !== 'object') return fallback;
    if (err instanceof Error) return err.message || fallback;
    const e = err as {
      error?: { message?: string; errors?: Array<{ msg?: string }> };
      message?: string;
    };
    return (
      e.error?.message ?? e.error?.errors?.[0]?.msg ?? e.message ?? fallback
    );
  }
}
