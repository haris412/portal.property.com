import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, switchMap, map, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

interface RolesApiResponse {
  success?: boolean;
  data?: { roles?: string[] };
}

interface UserApiResponse {
  success?: boolean;
  data?: { user?: Record<string, unknown> };
}

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  location?: string;
  role?: string;
  agencyName?: string;
}

/** Stored in localStorage — no PII (no email, no phone). */
interface StoredSession {
  _id: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

/** Maps full API user payload to in-memory User (login response or GET /api/users/:id). */
export function fromApiUser(raw: Record<string, unknown>): User {
  const id = ((raw['_id'] ?? raw['id']) as string) || '';
  const email = (raw['email'] as string | undefined) ?? '';
  const firstName = (raw['firstName'] as string | undefined)?.trim() || undefined;
  const lastName = (raw['lastName'] as string | undefined)?.trim() || undefined;
  const name = [firstName, lastName].filter(Boolean).join(' ') || undefined;
  const phoneNumber = (raw['phoneNumber'] as string | undefined)?.trim() || undefined;
  const profileImageUrl = (raw['profileImageUrl'] as string | undefined) || undefined;
  const location = (raw['location'] as string | undefined)?.trim() || undefined;
  const r = raw['role'];
  const role = typeof r === 'object' && r && 'name' in r
    ? (r as { name: string }).name
    : (r as string | undefined);
  const agency = raw['agency'];
  const agencyName = typeof agency === 'object' && agency && 'name' in agency
    ? (agency as { name: string }).name || undefined
    : undefined;
  return { _id: id, email, firstName, lastName, name, phoneNumber, profileImageUrl, location, role, agencyName };
}

/** Extracts session data to persist in localStorage — names only, no email/phone. */
function toStoredSession(raw: Record<string, unknown>): StoredSession {
  const id = ((raw['_id'] ?? raw['id']) as string) || '';
  const r = raw['role'];
  const role = typeof r === 'object' && r && 'name' in r
    ? (r as { name: string }).name
    : (r as string | undefined);
  const firstName = (raw['firstName'] as string | undefined)?.trim() || undefined;
  const lastName = (raw['lastName'] as string | undefined)?.trim() || undefined;
  return { _id: id, role, firstName, lastName };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName: string;
  phoneNumber: string;
  location?: string;
}

interface AuthApiResponse {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

interface VerifyEmailRequestBody {
  token: string;
  email?: string;
}

interface VerifyEmailResponse {
  success?: boolean;
}

interface ForgotPasswordResponse {
  success?: boolean;
  message?: string;
}

interface VerifyPasswordResetOtpResponse {
  success?: boolean;
  message?: string;
  data?: { resetToken?: string };
  resetToken?: string;
}

interface ResetPasswordResponse {
  success?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private accessToken: string | null = null;
  private userSubject = new BehaviorSubject<User | null>(null);
  private redirectMessage: string | null = null;

  currentUser$ = this.userSubject.asObservable();

  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }

  getUserId(): string | null {
    return this.getCurrentUser()?._id ?? null;
  }

  setRedirectMessage(message: string): void {
    this.redirectMessage = message;
  }

  getAndClearRedirectMessage(): string | null {
    const msg = this.redirectMessage;
    this.redirectMessage = null;
    return msg;
  }

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  private roles$ = this.http.get<RolesApiResponse>(`${environment.apiUrl}/api/auth/roles`).pipe(
    map((response) => response.data?.roles ?? []),
    catchError(() => of([])),
    shareReplay(1)
  );

  getRoles(): Observable<string[]> {
    return this.roles$;
  }

  constructor() {
    if (this.storage?.getItem(REFRESH_KEY)) {
      this.loadStoredSession();
    }
  }

  /** Seeds in-memory user from localStorage — names available immediately, no API call. */
  private loadStoredSession(): void {
    const session = this.getStoredSession();
    if (session?._id) {
      const name = [session.firstName, session.lastName].filter(Boolean).join(' ') || undefined;
      this.userSubject.next({
        _id: session._id,
        email: '',
        role: session.role,
        firstName: session.firstName,
        lastName: session.lastName,
        name,
      });
    }
  }

  private getStoredSession(): StoredSession | null {
    const raw = this.storage?.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredSession; } catch { return null; }
  }

  private storeAuthData(data: AuthApiResponse): void {
    if (!this.storage || !data.accessToken || !data.refreshToken || !data.user) return;
    this.accessToken = data.accessToken;
    // Full user lives in memory only
    this.userSubject.next(fromApiUser(data.user));
    // Only minimal session stored in localStorage — no PII
    this.storage.setItem(REFRESH_KEY, data.refreshToken);
    this.storage.setItem(USER_KEY, JSON.stringify(toStoredSession(data.user)));
  }


  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(payload: LoginPayload): Observable<{ user: User }> {
    const fallback = 'Login failed. Please try again.';
    return this.http
      .post<{ success?: boolean; data?: AuthApiResponse; reason?: string; message?: string } & AuthApiResponse>(
        `${environment.apiUrl}/api/auth/login`, payload
      )
      .pipe(
        switchMap((response) => {
          if (response.success === false) {
            return throwError(() => ({ message: response.message ?? fallback }));
          }
          const data = (response.data ?? response) as AuthApiResponse;
          this.storeAuthData(data);
          return of({ user: fromApiUser(data.user) });
        }),
        catchError((err: unknown) =>
          throwError(() => ({ message: this.getAuthMessage(err, fallback) }))
        )
      );
  }

  register(payload: RegisterPayload): Observable<{ user: User; message?: string }> {
    const fallback = 'Registration failed. Please try again.';
    return this.http
      .post<{ success?: boolean; message?: string; data?: AuthApiResponse } & AuthApiResponse>(
        `${environment.apiUrl}/api/auth/register`, payload
      )
      .pipe(
        switchMap((res) => {
          if (res.success === false) return throwError(() => ({ message: res.message ?? fallback }));
          const user = fromApiUser(((res.data ?? res).user ?? {}) as Record<string, unknown>);
          return of({ user, message: res.message });
        }),
        catchError((err: unknown) => throwError(() => ({ message: this.getAuthMessage(err, fallback) })))
      );
  }

  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({ error: () => {} });
    }
    this.accessToken = null;
    this.userSubject.next(null);
    this.storage?.removeItem(REFRESH_KEY);
    this.storage?.removeItem(USER_KEY);
    this.router.navigate(['/auth']);
  }

  refreshAccessToken(): Observable<string> {
    const refresh = this.storage?.getItem(REFRESH_KEY);
    if (!refresh) return of('').pipe(tap(() => this.clearAndRedirect()));

    return this.http.post<{ data?: { accessToken?: string }; accessToken?: string }>(
      `${environment.apiUrl}/api/auth/refresh-token`,
      { refreshToken: refresh }
    ).pipe(
      tap((response) => {
        const at = response.data?.accessToken ?? response.accessToken;
        if (at) this.accessToken = at;
      }),
      switchMap((response) => {
        const at = response.data?.accessToken ?? response.accessToken;
        if (at) return of(at);
        this.clearAndRedirect();
        return of('');
      }),
      catchError(() => {
        this.clearAndRedirect();
        return of('');
      })
    );
  }

  private clearAndRedirect(): void {
    this.accessToken = null;
    this.userSubject.next(null);
    this.storage?.removeItem(REFRESH_KEY);
    this.storage?.removeItem(USER_KEY);
    this.router.navigate(['/auth']);
  }

  peekRefreshToken(): string | null {
    return this.storage?.getItem(REFRESH_KEY) ?? null;
  }

  forgotPassword(email: string): Observable<void> {
    const fallback = 'Could not send reset email. Please try again.';
    return this.http
      .post<ForgotPasswordResponse>(`${environment.apiUrl}/api/auth/forgot-password`, { email: email.trim() })
      .pipe(
        switchMap((res) => {
          if (res.success === false) return throwError(() => ({ message: res.message ?? fallback }));
          return of(undefined);
        }),
        catchError((err: unknown) => throwError(() => ({ message: this.getAuthMessage(err, fallback) })))
      );
  }

  verifyPasswordResetOtp(email: string, otp: string): Observable<{ resetToken: string }> {
    const fallback = 'Invalid or expired code. Please try again.';
    return this.http
      .post<VerifyPasswordResetOtpResponse>(
        `${environment.apiUrl}/api/auth/verify-password-reset-otp`,
        { email: email.trim(), otp: otp.trim() }
      )
      .pipe(
        switchMap((res) => {
          if (res.success === false) return throwError(() => ({ message: res.message ?? fallback }));
          const token = res.data?.resetToken ?? res.resetToken;
          if (!token) return throwError(() => ({ message: fallback }));
          return of({ resetToken: token });
        }),
        catchError((err: unknown) => throwError(() => ({ message: this.getAuthMessage(err, fallback) })))
      );
  }

  resetPassword(resetToken: string, password: string): Observable<void> {
    const fallback = 'Could not reset password. Please start again.';
    return this.http
      .post<ResetPasswordResponse>(`${environment.apiUrl}/api/auth/reset-password`, { resetToken, password })
      .pipe(
        switchMap((res) => {
          if (res.success === false) return throwError(() => ({ message: res.message ?? fallback }));
          return of(undefined);
        }),
        catchError((err: unknown) => throwError(() => ({ message: this.getAuthMessage(err, fallback) })))
      );
  }

  verifyEmail(token: string, email?: string | null): Observable<{ success: boolean }> {
    const fallback = 'This link is invalid or has expired. Please request a new verification email.';
    const body: VerifyEmailRequestBody = email?.trim() ? { token, email: email.trim() } : { token };
    return this.http
      .post<VerifyEmailResponse>(`${environment.apiUrl}/api/auth/verify-email`, body)
      .pipe(
        map((res) => ({ success: res.success ?? true })),
        catchError((err: unknown) => throwError(() => ({ message: this.getAuthMessage(err, fallback) })))
      );
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  tryRestoreSession(): Promise<void> {
    if (this.accessToken) return Promise.resolve();
    const refresh = this.storage?.getItem(REFRESH_KEY);
    if (!refresh) return Promise.resolve();

    return new Promise((resolve) => {
      this.refreshAccessToken().subscribe({ next: () => resolve(), error: () => resolve() });
    });
  }

  /** Call this when full profile data is needed (e.g. profile page). */
  fetchUserProfile(id: string): Observable<void> {
    return this.http
      .get<UserApiResponse>(`${environment.apiUrl}/api/users/${encodeURIComponent(id)}`)
      .pipe(
        map((res) => {
          const raw = res.data?.user;
          if (raw) this.userSubject.next(fromApiUser(raw));
        }),
        catchError(() => of(undefined))
      );
  }

  private getAuthMessage(err: unknown, fallback: string): string {
    if (err == null || typeof err !== 'object') return fallback;
    if (err instanceof Error) return err.message || fallback;
    const e = err as { error?: { message?: string; errors?: Array<{ msg?: string }> }; message?: string };
    return e.error?.message ?? e.error?.errors?.[0]?.msg ?? e.message ?? fallback;
  }
}
