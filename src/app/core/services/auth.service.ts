import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthState } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private authState = signal<AuthState>({
    user: this.loadUserFromStorage(),
    token: this.loadTokenFromStorage(),
    isAuthenticated: !!this.loadTokenFromStorage(),
  });

  readonly currentUser = computed(() => this.authState().user);
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly token = computed(() => this.authState().token);

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginCredentials): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>('/api/auth/login', credentials)
      .pipe(
        tap((response) => {
          if (response.success) {
            this.setAuthState(response.data.user, response.data.token);
          }
        }),
        catchError((error) => throwError(() => error))
      );
  }

  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/auth/login']);
  }

  private setAuthState(user: User, token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.authState.set({ user, token, isAuthenticated: true });
  }

  private clearAuthState(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authState.set({ user: null, token: null, isAuthenticated: false });
  }

  private loadTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUserFromStorage(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
