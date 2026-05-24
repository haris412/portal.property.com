import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
import { LoginPayload, User, fromApiUser } from './auth.service';

export const ADMIN_REFRESH_KEY = 'adminRefreshToken';
export const ADMIN_USER_KEY = 'adminUser';
/** Short-lived token between admin login step 1 (password) and step 2 (OTP). */
export const ADMIN_CHALLENGE_TOKEN_KEY = 'adminChallengeToken';

const adminAuthApiBase = `${environment.apiUrl}/api/auth`;

interface AuthApiResponse {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

interface AdminLoginStep1Body {
  success?: boolean;
  message?: string;
  data?: { challengeToken?: string };
  challengeToken?: string;
}

interface AdminLoginVerifyBody {
  success?: boolean;
  message?: string;
  data?: AuthApiResponse;
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
    return this.isLoggedIn() && (u?.roles?.some(r => r.toLowerCase() === 'admin') ?? false);
  }

  private loadStoredAdminUser(): void {
    const raw = this.storage?.getItem(ADMIN_USER_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const user = fromApiUser(parsed);
      this.userSubject.next(user);
      this.storage?.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }

  private storeAuthData(data: AuthApiResponse): void {
    if (!this.storage || !data.accessToken || !data.refreshToken || !data.user) return;
    this.accessToken = data.accessToken;
    const user = fromApiUser(data.user);
    this.storage.setItem(ADMIN_REFRESH_KEY, data.refreshToken);
    this.storage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearAdminStorageOnly(): void {
    this.accessToken = null;
    this.userSubject.next(null);
    this.storage?.removeItem(ADMIN_REFRESH_KEY);
    this.storage?.removeItem(ADMIN_USER_KEY);
    this.clearAdminLoginChallenge();
  }

  /**
   * Step 1: POST /api/auth/admin/login — sends OTP; persists `challengeToken` for step 2.
   */
  requestAdminLoginOtp(payload: LoginPayload): Observable<void> {
    const fallback = 'Could not start sign-in. Please try again.';
    return this.http
      .post<AdminLoginStep1Body>(`${adminAuthApiBase}/admin/login`, payload)
      .pipe(
        switchMap((response) => {
          if (response.success === false) {
            return throwError(() => ({ message: response.message ?? fallback }));
          }
          const token =
            response.data?.challengeToken ?? response.challengeToken ?? '';
          if (!token) {
            return throwError(() => ({
              message: response.message ?? fallback,
            }));
          }
          this.persistChallengeToken(token);
          return of(undefined);
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

  /**
   * Step 2: POST /api/auth/admin/login/verify — exchanges OTP + stored challenge for session.
   */
  verifyAdminLoginOtp(otpRaw: string): Observable<{ user: User }> {
    const fallback = 'Could not complete sign-in. Please try again.';
    const challengeToken = this.getChallengeToken();
    const otp = otpRaw.replace(/\D/g, '');
    if (!challengeToken) {
      return throwError(() => ({
        message: 'Sign-in session expired. Please enter your email and password again.',
      }));
    }
    if (otp.length !== 5) {
      return throwError(() => ({
        message: 'Enter the 5-digit code from your email.',
      }));
    }

    return this.http
      .post<AdminLoginVerifyBody>(
        `${adminAuthApiBase}/admin/login/verify`,
        { challengeToken, otp }
      )
      .pipe(
        switchMap((response) => {
          if (response.success === false) {
            return throwError(() => ({ message: response.message ?? fallback }));
          }
          const data = (response.data ?? response) as AuthApiResponse;
          const rawUser = data.user;
          if (!rawUser) {
            return throwError(() => ({ message: fallback }));
          }
          if (!isAdminRoleFromPayload(rawUser)) {
            return throwError(() => ({
              message:
                'Access denied. This account does not have administrator privileges.',
              code: 'NOT_ADMIN' as const,
            }));
          }
          this.clearAdminLoginChallenge();
          this.storeAuthData({ ...data, user: rawUser });
          return of({ user: fromApiUser(rawUser) });
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

  /** Remove challenge token (e.g. user goes back to email/password step). */
  clearAdminLoginChallenge(): void {
    this.storage?.removeItem(ADMIN_CHALLENGE_TOKEN_KEY);
  }

  private persistChallengeToken(token: string): void {
    this.storage?.setItem(ADMIN_CHALLENGE_TOKEN_KEY, token);
  }

  private getChallengeToken(): string | null {
    return this.storage?.getItem(ADMIN_CHALLENGE_TOKEN_KEY) ?? null;
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
    if (err instanceof HttpErrorResponse) {
      if (err.status === 429) {
        return this.messageFromHttpBody(err.error) ?? 'Too many attempts, please try again later';
      }
      return this.messageFromHttpBody(err.error) ?? err.message ?? fallback;
    }
    if (err == null || typeof err !== 'object') return fallback;
    const e = err as {
      error?: { message?: string; errors?: Array<{ msg?: string }> };
      message?: string;
    };
    const fromPayload =
      e.message ??
      e.error?.message ??
      e.error?.errors?.[0]?.msg ??
      (err instanceof Error ? err.message : undefined);
    if (fromPayload) return fromPayload;
    return fallback;
  }

  private messageFromHttpBody(body: unknown): string | null {
    if (typeof body === 'string' && body.trim()) return body.trim();
    if (body == null || typeof body !== 'object') return null;
    const o = body as {
      message?: string;
      errors?: Array<{ msg?: string }>;
    };
    if (o.message) return o.message;
    if (o.errors?.[0]?.msg) return o.errors[0].msg ?? null;
    return null;
  }
}
