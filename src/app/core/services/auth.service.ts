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

export interface User {
  _id: string;
  email: string;
  name?: string;
  role?: string;
}


function toStoredUser(raw: Record<string, unknown>): User {
  const id = (raw['_id'] ?? raw['id']) as string;
  const email = (raw['email'] ?? '') as string;
  const name =
    (raw['name'] as string) ||
    [raw['firstName'], raw['lastName']].filter(Boolean).join(' ').trim() ||
    undefined;
  const r = raw['role'];
  const role = typeof r === 'object' && r && 'name' in r ? (r as { name: string }).name : (r as string);
  return { _id: id, email, name, role };
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
  user: User;
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

  /** Synchronous snapshot for query params, etc. Prefer `currentUser$` when reacting to auth changes. */
  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }

  getUserId(): string | null {
    const u = this.getCurrentUser();
    return u?._id ?? null;
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
    const stored = this.storage?.getItem(REFRESH_KEY);
    if (stored) this.loadStoredUser();
   
  }

  private loadStoredUser(): void {
    const raw = this.storage?.getItem(USER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const user = toStoredUser(parsed);
        this.userSubject.next(user);
        this.storage?.setItem(USER_KEY, JSON.stringify(user));
      } catch { /* ignore */ }
    }
  }

  private storeAuthData(data: AuthApiResponse): void {
    if (!this.storage || !data.accessToken || !data.refreshToken || !data.user) return;
    this.accessToken = data.accessToken;
    const user = toStoredUser((data.user ?? {}) as unknown as Record<string, unknown>);
    this.storage.setItem(REFRESH_KEY, data.refreshToken);
    this.storage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  getAccessToken(): string | null {
    return this.accessToken;
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
            return throwError(
              () => ({ message: response.message ?? fallback })
            );
          }
          const data = (response.data ?? response) as AuthApiResponse;
          this.storeAuthData(data);
          return of({ user: data.user });
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
        `${environment.apiUrl}/api/auth/register`,
        payload
      )
      .pipe(
        switchMap((res) => {
          if (res.success === false) return throwError(() => ({ message: res.message ?? fallback }));
          const user = (res.data ?? res).user;
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
    this.storage?.clear();
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
    this.storage?.clear();
    this.router.navigate(['/auth']);
  }

  /**
   * Verifies email using the token (and optional email) from the verification link.
   * All failures emit error with shape { message: string }.
   */
  verifyEmail(
    token: string,
    email?: string | null
  ): Observable<{ success: boolean }> {
    const fallback =
      'This link is invalid or has expired. Please request a new verification email.';
    const body: VerifyEmailRequestBody = email?.trim()
      ? { token, email: email.trim() }
      : { token };
    return this.http
      .post<VerifyEmailResponse>(
        `${environment.apiUrl}/api/auth/verify-email`,
        body
      )
      .pipe(
        map((res) => ({ success: res.success ?? true })),
        catchError((err: unknown) =>
          throwError(() => ({ message: this.getAuthMessage(err, fallback) }))
        )
      );
  }

  /** Normalize API/HTTP error to a single message for callers. */
  private getAuthMessage(err: unknown, fallback: string): string {
    if (err == null || typeof err !== 'object') return fallback;
    if (err instanceof Error) return err.message || fallback;
    const e = err as {
      error?: { message?: string; errors?: Array<{ msg?: string }> };
      message?: string;
    };
    return (
      e.error?.message ??
      e.error?.errors?.[0]?.msg ??
      e.message ??
      fallback
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
}
