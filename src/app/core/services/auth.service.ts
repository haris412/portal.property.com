import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { hasPrimaryAgencyAdminRole } from '../models/role.models';
import { SubscriptionSessionStorageService } from './subscription-session-storage.service';
import { IUser } from '../interfaces/user.interface';
import { IAccountSignUp } from '../interfaces/account.interface';

// ── Storage keys ──────────────────────────────────────────────────────────────

const REFRESH_KEY = 'refreshToken';
const USER_KEY    = 'user';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  location?: string;
  roles: string[];
  agencyName?: string;
  agencyId?: string;
}
interface StoredSession {
  _id: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  agencyId?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface AuthApiResponse {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

interface SimpleApiResponse {
  success?: boolean;
  message?: string;
}

interface VerifyPasswordResetOtpResponse extends SimpleApiResponse {
  data?: { resetToken?: string };
  resetToken?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLikelyObjectId(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value);
}

/** Handles `roles: [{name}]`, `roles: ['Agent']`, and legacy `role: string | {name}` shapes. */
function extractRoles(raw: Record<string, unknown>): string[] {
  const arr = raw['roles'];
  if (Array.isArray(arr) && arr.length > 0) {
    return arr
      .map((r) => {
        if (typeof r === 'string') {
          const name = r.trim();
          return name && !isLikelyObjectId(name) ? name : '';
        }
        if (typeof r === 'object' && r != null) {
          return (r as Record<string, unknown>)['name'] as string | undefined;
        }
        return '';
      })
      .map((name) => name?.trim() ?? '')
      .filter(Boolean);
  }
  const r = raw['role'];
  if (typeof r === 'object' && r != null && 'name' in r) {
    const name = String((r as { name: unknown }).name ?? '').trim();
    return name ? [name] : [];
  }
  if (typeof r === 'string' && r.trim() && !isLikelyObjectId(r.trim())) {
    return [r.trim()];
  }

  const roleName = raw['roleName'];
  if (typeof roleName === 'string' && roleName.trim() && !isLikelyObjectId(roleName.trim())) {
    return [roleName.trim()];
  }

  return [];
}

function mergeRoleLists(...lists: Array<string[] | undefined>): string[] {
  const merged = new Set<string>();
  for (const list of lists) {
    for (const role of list ?? []) {
      const trimmed = role.trim();
      if (trimmed) {
        merged.add(trimmed);
      }
    }
  }
  return [...merged];
}

function extractAgencyId(raw: Record<string, unknown>): string | undefined {
  const agency = raw['agency'];
  if (typeof agency === 'object' && agency != null && '_id' in agency) {
    const fromAgency = String((agency as { _id?: unknown })._id ?? '').trim();
    if (fromAgency) {
      return fromAgency;
    }
  }

  const agencyIdRaw = raw['agencyId'];
  if (typeof agencyIdRaw === 'string' && agencyIdRaw.trim()) {
    return agencyIdRaw.trim();
  }
  if (typeof agencyIdRaw === 'object' && agencyIdRaw != null && '_id' in agencyIdRaw) {
    return String((agencyIdRaw as { _id?: unknown })._id ?? '').trim() || undefined;
  }

  return undefined;
}

export function fromApiUser(raw: Record<string, unknown>): User {
  const firstName = (raw['firstName'] as string | undefined)?.trim() || undefined;
  const lastName  = (raw['lastName']  as string | undefined)?.trim() || undefined;
  const agency    = raw['agency'];
  const agencyId  = extractAgencyId(raw);
  const roles     = extractRoles(raw);
  return {
    _id: ((raw['_id'] ?? raw['id']) as string) || '',
    email: (raw['email'] as string | undefined) ?? '',
    firstName,
    lastName,
    name:            [firstName, lastName].filter(Boolean).join(' ') || undefined,
    phoneNumber:     (raw['phoneNumber']     as string | undefined)?.trim() || undefined,
    profileImageUrl: (raw['profileImageUrl'] as string | undefined)        || undefined,
    location:        (raw['location']        as string | undefined)?.trim() || undefined,
    roles,
    agencyName:      typeof agency === 'object' && agency != null && 'name' in agency
                       ? (agency as { name: string }).name || undefined
                       : undefined,
    agencyId,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly subscriptionSession = inject(SubscriptionSessionStorageService);
  readonly userData = signal<IUser | null>(null);
  readonly activeSegment  = signal<'signup' | 'login'>('login');
  private accessToken: string | null = null;
  private redirectMessage: string | null = null;

  private readonly userSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  constructor() {
    if (this.storage?.getItem(REFRESH_KEY)) this.loadStoredSession();
  }

  getRoles(){
    return this.http
        .get<{ success?: boolean; data?: { roles?: string[] } }>(`${environment.apiUrl}/api/auth/roles`)
        .pipe(
          map((res) => {
            return res.data?.roles ?? []
          }),
          catchError(() => of([] as string[])),
          shareReplay(1),
        );
  }
  // ── Getters ────────────────────────────────────────────────────────────────

  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }
  getUserId(): string | null {
    return this.getCurrentUser()?._id ?? null;
  }
  isLoggedIn(): boolean {
    return !!this.accessToken;
  }
  getAccessToken(): string | null {
    return this.accessToken;
  }
  peekRefreshToken(): string | null {
    return this.storage?.getItem(REFRESH_KEY) ?? null;
  }
  hasRole(role: string): boolean {
    return this.getCurrentUser()?.roles?.includes(role) ?? false;
  }

  /** Primary Agency Admin — can manage agency agents (agencyId required for API calls). */
  canManageAgencyAgents(): boolean {
    return hasPrimaryAgencyAdminRole(this.getCurrentUser()?.roles);
  }

  // getRoles(): Observable<string[]> {
  //   return this.roles$;
  // }

  setRedirectMessage(message: string): void {
    this.redirectMessage = message;
  }
  getAndClearRedirectMessage(): string | null {
    const msg = this.redirectMessage;
    this.redirectMessage = null;
    return msg;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  login(payload: LoginPayload): Observable<{ user: User }> {
    const fallback = 'Login failed. Please try again.';
    return this.http
      .post<
        { success?: boolean; data?: AuthApiResponse; message?: string } & AuthApiResponse
      >(`${environment.apiUrl}/api/auth/login`, payload)
      .pipe(
        switchMap((res) => {
          if (res.success === false)
            return throwError(() => ({ message: res.message ?? fallback }));
          const data = (res.data ?? res) as AuthApiResponse;
          this.storeAuthData(data);
          return of({ user: fromApiUser(data.user) });
        }),
        catchError((err: unknown) =>
          throwError(() => ({ message: this.getAuthMessage(err, fallback) })),
        ),
      );
  }

  register(payload: IAccountSignUp): Observable<{ user: User; message?: string }> {
    const fallback = 'Registration failed. Please try again.';
    return this.http
      .post<
        { success?: boolean; message?: string; data?: AuthApiResponse } & AuthApiResponse
      >(`${environment.apiUrl}/api/auth/register`, payload)
      .pipe(
        switchMap((res) => {
          if (res.success === false)
            return throwError(() => ({ message: res.message ?? fallback }));
          const user = fromApiUser(((res.data ?? res).user ?? {}) as Record<string, unknown>);
          return of({ user, message: res.message });
        }),
        catchError((err: unknown) =>
          throwError(() => ({ message: this.getAuthMessage(err, fallback) })),
        ),
      );
  }

  logout(): void {
    if (this.accessToken) {
      this.http
        .post(
          `${environment.apiUrl}/api/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${this.accessToken}` } },
        )
        .subscribe({ error: () => {} });
    }
    this.clearSession();
    void this.router.navigate(['/auth']);
  }

  refreshAccessToken(): Observable<string> {
    const refresh = this.storage?.getItem(REFRESH_KEY);
    if (!refresh) {
      this.clearAndRedirect();
      return of('');
    }

    return this.http
      .post<{
        data?: { accessToken?: string };
        accessToken?: string;
      }>(`${environment.apiUrl}/api/auth/refresh-token`, { refreshToken: refresh })
      .pipe(
        map((res) => res.data?.accessToken ?? res.accessToken ?? ''),
        tap((at) => (at ? (this.accessToken = at) : this.clearAndRedirect())),
        catchError(() => {
          this.clearAndRedirect();
          return of('');
        }),
      );
  }

  tryRestoreSession(): Promise<void> {
    if (this.accessToken || !this.storage?.getItem(REFRESH_KEY)) return Promise.resolve();
    return new Promise((resolve) => {
      this.refreshAccessToken().subscribe({ next: () => resolve(), error: () => resolve() });
    });
  }

  checkTokenValidityAndExpiry(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/auth/verify-token`, data);
  }
  // ── Password reset ─────────────────────────────────────────────────────────

  forgotPassword(email: string): Observable<void> {
    return this.postVoid(
      `${environment.apiUrl}/api/auth/forgot-password`,
      { email: email.trim() },
      'Could not send reset email. Please try again.',
    );
  }

  verifyPasswordResetOtp(email: string, otp: string): Observable<{ resetToken: string }> {
    const fallback = 'Invalid or expired code. Please try again.';
    return this.http
      .post<VerifyPasswordResetOtpResponse>(
        `${environment.apiUrl}/api/auth/verify-password-reset-otp`,
        { email: email.trim(), otp: otp.trim() },
      )
      .pipe(
        switchMap((res) => {
          if (res.success === false)
            return throwError(() => ({ message: res.message ?? fallback }));
          const token = res.data?.resetToken ?? res.resetToken;
          if (!token) return throwError(() => ({ message: fallback }));
          return of({ resetToken: token });
        }),
        catchError((err: unknown) =>
          throwError(() => ({ message: this.getAuthMessage(err, fallback) })),
        ),
      );
  }

  resetPassword(resetToken: string, password: string): Observable<void> {
    return this.postVoid(
      `${environment.apiUrl}/api/auth/reset-password`,
      { resetToken, password },
      'Could not reset password. Please start again.',
    );
  }

  // ── Invite flow ────────────────────────────────────────────────────────────

  /** POST /api/auth/verify-invite-token — checks if the invite token is valid before showing the form. */
  verifyInviteToken(token: string): Observable<void> {
    return this.postVoid(
      `${environment.apiUrl}/api/auth/verify-invite-token`,
      { token },
      'This invite link is invalid or has expired.',
    );
  }

  /** POST /api/auth/invite-set-password — activates account using the token from the invite link. */
  inviteSetPassword(token: string, password: string): Observable<void> {
    return this.postVoid(
      `${environment.apiUrl}/api/auth/invite-set-password`,
      { token, password },
      'Could not set password. Please try again.',
    );
  }

  // ── Email verification ─────────────────────────────────────────────────────

  verifyEmail(token: string, email?: string | null): Observable<{ success: boolean }> {
    const fallback =
      'This link is invalid or has expired. Please request a new verification email.';
    const body = email?.trim() ? { token, email: email.trim() } : { token };
    return this.http
      .post<SimpleApiResponse>(`${environment.apiUrl}/api/auth/verify-email`, body)
      .pipe(
        map((res) => ({ success: res.success ?? true })),
        catchError((err: unknown) =>
          throwError(() => ({ message: this.getAuthMessage(err, fallback) })),
        ),
      );
  }

  // ── Agency ────────────────────────────────────────────────────────────────

  checkAgencyNameAvailable(name: string): Observable<boolean> {
    return this.http
      .get<{
        success?: boolean;
        data?: { available?: boolean };
      }>(`${environment.apiUrl}/api/auth/check-agency-name`, { params: { name: name.trim() } })
      .pipe(
        map((res) => res.data?.available ?? true),
        catchError(() => of(true)),
      );
  }

  // ── Profile ────────────────────────────────────────────────────────────────

  fetchUserProfile(id: string): Observable<void> {
    return this.http
      .get<{
        success?: boolean;
        data?: { user?: Record<string, unknown> };
      }>(`${environment.apiUrl}/api/users/${encodeURIComponent(id)}`)
      .pipe(
        map((res) => {
          if (!res.data?.user) {
            return;
          }
          const fresh = fromApiUser(res.data.user);
          const current = this.getCurrentUser();
          const merged: User = {
            ...current,
            ...fresh,
            email: fresh.email || current?.email || '',
            roles: mergeRoleLists(current?.roles, fresh.roles),
            agencyId: fresh.agencyId ?? current?.agencyId ?? extractAgencyId(res.data.user),
          };
          this.userSubject.next(merged);
          this.persistStoredSession(merged);
        }),
        catchError(() => of(undefined)),
      );
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /**
   * Shared helper for fire-and-forget POST endpoints that only return
   * `{ success, message }` — avoids repeating the same switchMap+catchError pipe.
   */
  private postVoid(url: string, body: unknown, fallback: string): Observable<void> {
    return this.http.post<SimpleApiResponse>(url, body).pipe(
      switchMap((res) =>
        res.success === false
          ? throwError(() => ({ message: res.message ?? fallback }))
          : of(undefined),
      ),
      catchError((err: unknown) =>
        throwError(() => ({ message: this.getAuthMessage(err, fallback) })),
      ),
    );
  }

  /** Seeds in-memory user from localStorage — names available immediately, no API call. */
  private loadStoredSession(): void {
    const raw = this.storage?.getItem(USER_KEY);
    if (!raw) return;
    try {
      const s = JSON.parse(raw) as StoredSession;
      if (!s._id) return;
      this.userSubject.next({
        _id: s._id,
        email: '',
        roles: s.roles ?? [],
        firstName: s.firstName,
        lastName: s.lastName,
        name: [s.firstName, s.lastName].filter(Boolean).join(' ') || undefined,
        agencyId: s.agencyId,
      });
    } catch {
      /* ignore corrupt data */
    }
  }

  private storeAuthData(data: AuthApiResponse): void {
    if (!this.storage || !data.accessToken || !data.refreshToken || !data.user) return;
    this.accessToken = data.accessToken;
    const user = fromApiUser(data.user);
    const existing = this.getCurrentUser();
    const merged: User = {
      ...user,
      roles: mergeRoleLists(existing?.roles, user.roles),
      agencyId: user.agencyId ?? existing?.agencyId ?? extractAgencyId(data.user),
    };
    this.userSubject.next(merged);
    this.storage.setItem(REFRESH_KEY, data.refreshToken);
    this.persistStoredSession(merged);
  }

  private persistStoredSession(user: User): void {
    if (!this.storage || !user._id) {
      return;
    }
    const existing = this.readStoredSession();
    const session: StoredSession = {
      _id: user._id,
      roles: user.roles?.length ? user.roles : (existing?.roles ?? []),
      firstName: user.firstName ?? existing?.firstName,
      lastName: user.lastName ?? existing?.lastName,
      agencyId: user.agencyId ?? existing?.agencyId,
    };
    this.storage.setItem(USER_KEY, JSON.stringify(session));
  }

  private readStoredSession(): StoredSession | null {
    const raw = this.storage?.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    this.accessToken = null;
    this.userSubject.next(null);
    this.storage?.removeItem(REFRESH_KEY);
    this.storage?.removeItem(USER_KEY);
    this.subscriptionSession.clear();
  }

  private clearAndRedirect(): void {
    this.clearSession();
    void this.router.navigate(['/auth']);
  }

  private getAuthMessage(err: unknown, fallback: string): string {
    if (err == null || typeof err !== 'object') return fallback;
    if (err instanceof Error) return err.message || fallback;
    const e = err as {
      error?: { message?: string; errors?: Array<{ msg?: string }> };
      message?: string;
    };
    return e.error?.message ?? e.error?.errors?.[0]?.msg ?? e.message ?? fallback;
  }
}

// ── Agency name availability validator ────────────────────────────────────────

/** Fires on blur (control uses updateOn: 'blur') — one API call per focus-out. Fails open on network errors. */
export function agencyNameAvailableValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const name = (control.value ?? '').toString().trim();
    if (name.length < 2) return of(null);

    return authService.checkAgencyNameAvailable(name).pipe(
      map((available) => (available ? null : { agencyNameTaken: true })),
      catchError(() => of(null)),
    );
  };
}
