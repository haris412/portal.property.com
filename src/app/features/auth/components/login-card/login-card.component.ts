import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FeatureCardComponent } from '../../../../shared/ui/feature-card/feature-card.component';
import { SocialButtonComponent } from '../../../../shared/ui/social-button/social-button.component';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { FeatureItem } from '../../../../core/models/auth.models';
import { AuthService } from '../../../../core/services/auth.service';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-login-card',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    FeatureCardComponent,
    SocialButtonComponent,
    FormFieldErrorComponent,
  ],
  templateUrl: './login-card.component.html',
  styleUrl: './login-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginCardComponent {
  /** Pass true from admin portal — enables OTP flow via AdminAuthService */
  @Input() isAdmin = false;

  private readonly fb        = inject(FormBuilder);
  private readonly auth      = inject(AuthService);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router    = inject(Router);

  readonly hidePassword = signal(true);
  readonly error        = signal<string | null>(null);
  readonly loading      = signal(false);

  /** Admin only: flips to true after credentials are verified, shows OTP field */
  readonly otpStep = signal(false);

  private readonly bothFieldsFilled = signal(false);
  private readonly otpReady         = signal(false);

  readonly features = signal<FeatureItem[]>([
    { icon: 'favorite_border', title: 'Saved properties',  description: 'Return to your shortlisted homes and rental picks instantly.' },
    { icon: 'videocam',        title: 'Video tours',       description: 'Resume property walkthroughs and media uploads from the dashboard.' },
    { icon: 'apartment',       title: 'Manage listings',   description: 'Track buyer inquiries, schedule visits and update listing details.' },
  ]);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
    otp:        [''], // admin only — validator added dynamically on OTP step
  });

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() => {
        const { identifier, password, otp } = this.form.getRawValue();
        this.bothFieldsFilled.set(identifier.trim().length > 0 && password.length > 0);
        this.otpReady.set(otp.replace(/\D/g, '').length === 5);
      });
  }

  readonly canSubmit = computed(() => {
    if (this.loading()) return false;
    if (this.isAdmin && this.otpStep()) return this.otpReady();
    return this.bothFieldsFilled();
  });

  readonly primaryActionLabel = computed(() => {
    if (!this.isAdmin) return this.loading() ? 'Signing in…' : 'Log in';
    if (this.loading()) return this.otpStep() ? 'Verifying…' : 'Sending code…';
    return this.otpStep() ? 'Verify & sign in' : 'Log in';
  });

  submit(): void {
    if (this.isAdmin) {
      this.otpStep() ? this.verifyOtp() : this.requestOtp();
    } else {
      this.agentLogin();
    }
  }

  backToCredentials(): void {
    this.adminAuth.clearAdminLoginChallenge();
    this.otpStep.set(false);
    this.form.controls.otp.reset('');
    this.form.controls.otp.clearValidators();
    this.form.controls.otp.updateValueAndValidity();
    this.error.set(null);
  }

  // ── Agent login ────────────────────────────────────────────────────────────

  private agentLogin(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.error.set(null);
    this.loading.set(true);
    const { identifier, password } = this.form.getRawValue();
    this.auth.login({ email: identifier.trim(), password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  () => void this.router.navigate(['/dashboard']),
        error: (err: unknown) => this.error.set((err as { message?: string } | null)?.message ?? 'Login failed. Please try again.'),
      });
  }

  // ── Admin login (two-step: credentials → OTP) ──────────────────────────────

  private requestOtp(): void {
    if (this.form.controls.identifier.invalid || this.form.controls.password.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const { identifier, password } = this.form.getRawValue();
    this.adminAuth
      .requestAdminLoginOtp({ email: identifier.trim(), password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.otpStep.set(true);
          this.form.controls.otp.setValidators([Validators.required]);
          this.form.controls.otp.updateValueAndValidity();
        },
        error: (err: unknown) => this.handleAdminError(err as { message?: string; code?: string }),
      });
  }

  private verifyOtp(): void {
    const digits = this.form.controls.otp.getRawValue().replace(/\D/g, '');
    if (digits.length !== 5) {
      this.form.controls.otp.markAsTouched();
      this.error.set('Enter the 5-digit code from your email.');
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    this.adminAuth
      .verifyAdminLoginOtp(digits)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  () => void this.router.navigate(['/admin/dashboard']),
        error: (err: unknown) => {
          const e = err as { message?: string; code?: string };
          if (e?.code === 'NOT_ADMIN') {
            void this.router.navigate(['/admin/access-denied'], { queryParams: { code: 'not_admin' } });
            return;
          }
          this.error.set(e?.message ?? 'Could not complete sign-in. Please try again.');
        },
      });
  }

  private handleAdminError(err: { message?: string; code?: string } | null | undefined): void {
    if (err?.code === 'NOT_ADMIN') {
      void this.router.navigate(['/admin/access-denied'], { queryParams: { code: 'not_admin' } });
      return;
    }
    this.error.set(err?.message ?? 'Login failed. Please try again.');
  }
}
