import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

@Component({
  selector: 'app-admin-login-card',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    FormFieldErrorComponent,
  ],
  templateUrl: './admin-login-card.component.html',
  styleUrls: ['../admin-auth-card.shared.scss', './admin-login-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginCardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly router = inject(Router);

  readonly hidePassword = signal(true);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  /** After password step succeeds, show OTP field on the same screen. */
  readonly otpStep = signal(false);
  private readonly bothFieldsFilled = signal(false);
  private readonly otpReady = signal(false);

  readonly form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
    otp: [''],
  });

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const { identifier, password, otp } = this.form.getRawValue();
        const filled =
          (identifier?.trim() ?? '').length > 0 && (password?.length ?? 0) > 0;
        this.bothFieldsFilled.set(filled);
        const digits = (otp ?? '').replace(/\D/g, '');
        this.otpReady.set(digits.length === 5);
      });
  }

  readonly canSubmit = computed(() => {
    if (this.loading()) return false;
    if (this.otpStep()) {
      return this.otpReady();
    }
    return this.bothFieldsFilled();
  });

  readonly primaryActionLabel = computed(() => {
    if (this.loading()) {
      return this.otpStep() ? 'Verifying…' : 'Sending code…';
    }
    return this.otpStep() ? 'Verify & sign in' : 'Log in';
  });

  submit(): void {
    if (this.otpStep()) {
      this.verifyOtp();
      return;
    }
    this.requestOtp();
  }

  private requestOtp(): void {
    if (this.form.invalid) {
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
        error: (err: { message?: string; code?: string }) => {
          this.handleLoginError(err);
        },
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
        next: () => void this.router.navigate(['/admin/dashboard']),
        error: (err: { message?: string; code?: string }) => {
          if (err?.code === 'NOT_ADMIN') {
            void this.router.navigate(['/admin/access-denied'], {
              queryParams: { code: 'not_admin' },
            });
            return;
          }
          this.error.set(err?.message ?? 'Could not complete sign-in. Please try again.');
        },
      });
  }

  backToCredentials(): void {
    this.adminAuth.clearAdminLoginChallenge();
    this.otpStep.set(false);
    this.form.controls.otp.reset('');
    this.form.controls.otp.clearValidators();
    this.form.controls.otp.updateValueAndValidity();
    this.error.set(null);
  }

  private handleLoginError(err: { message?: string; code?: string }): void {
    if (err?.code === 'NOT_ADMIN') {
      void this.router.navigate(['/admin/access-denied'], {
        queryParams: { code: 'not_admin' },
      });
      return;
    }
    this.error.set(err?.message ?? 'Login failed. Please try again.');
  }
}
