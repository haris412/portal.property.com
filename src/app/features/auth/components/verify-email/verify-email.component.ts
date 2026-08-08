import {
    Component,
    OnDestroy,
    OnInit,
    inject,
    PLATFORM_ID,
  } from '@angular/core';
  import { isPlatformBrowser } from '@angular/common';
  import { ActivatedRoute, Router } from '@angular/router';
  import { Subscription } from 'rxjs';
  import { take } from 'rxjs';
  import { MatButtonModule } from '@angular/material/button';
  import { MatIconModule } from '@angular/material/icon';
  import { AuthService } from '../../../../core/services/auth.service';
  
  export type VerifyState =
    | 'loading'
    | 'success'
    | 'error'
    | 'missing_params';
  
  const ERROR_MESSAGE_MAX_LENGTH = 500;
  const REDIRECT_DELAY_MS = 3000;
  
  interface VerificationParams {
    token: string | null;
    email: string | null;
  }
  
  /**
   * Reads token and email from the verification URL.
   * Uses raw query string in browser so '+' in token is not decoded as space.
   */
  function getVerificationParams(
    route: ActivatedRoute,
    isBrowser: boolean
  ): VerificationParams {
    const fromSnapshot = (): VerificationParams => ({
      token: route.snapshot.queryParamMap.get('token')?.trim() ?? null,
      email: route.snapshot.queryParamMap.get('email')?.trim() ?? null,
    });
  
    if (!isBrowser || typeof window === 'undefined' || !window.location?.search) {
      return fromSnapshot();
    }
  
    const search = window.location.search;
    const tokenMatch = search.match(/[?&]token=([^&]*)/);
    const emailMatch = search.match(/[?&]email=([^&]*)/);
  
    const decode = (raw: string): string => {
      try {
        return decodeURIComponent(raw).trim();
      } catch {
        return raw.trim();
      }
    };
  
    return {
      token: tokenMatch ? decode(tokenMatch[1]) || null : null,
      email: emailMatch ? decode(emailMatch[1]) || null : null,
    };
  }
  
  @Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './verify-email.html',
    styleUrl: './verify-email.scss',
  })
  export class VerifyEmailComponent implements OnDestroy, OnInit {
    state: VerifyState = 'loading';
    errorMessage = '';
  
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);
    private readonly platformId = inject(PLATFORM_ID);
  
    private subscription: Subscription | null = null;
    private redirectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private requestSent = false;
  
    ngOnInit(): void {
      if (this.requestSent) return;
  
      const { token, email } = getVerificationParams(
        this.route,
        isPlatformBrowser(this.platformId)
      );
  
      if (!token) {
        this.state = 'missing_params';
        this.errorMessage = 'Invalid verification link. Please use the link from your email.';
        return;
      }
  
      this.requestSent = true;
      this.subscription = this.auth
        .verifyEmail(token, email)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.state = 'success';
            this.scheduleRedirect();
          },
          error: (err: unknown) => {
            this.state = 'error';
            const fallback =
              'This link is invalid or has expired. Please request a new verification email.';
            const msg = (err as { message?: string }).message ?? fallback;
            this.errorMessage =
              msg.length > ERROR_MESSAGE_MAX_LENGTH
                ? msg.slice(0, ERROR_MESSAGE_MAX_LENGTH) + '…'
                : msg;
          },
        });
    }
  
    ngOnDestroy(): void {
      this.subscription?.unsubscribe();
      if (this.redirectTimeoutId != null) {
        clearTimeout(this.redirectTimeoutId);
        this.redirectTimeoutId = null;
      }
    }
  
    goToLogin(): void {
      this.router.navigate(['/auth']);
    }
  
    private scheduleRedirect(): void {
      this.redirectTimeoutId = setTimeout(() => {
        this.redirectTimeoutId = null;
        this.router.navigate(['/auth']);
      }, REDIRECT_DELAY_MS);
    }
  }
  