import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, startWith } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AuthService } from '../../../../core/services/auth.service';
import { PasswordResetFlowService } from '../../../../core/services/password-reset-flow.service';

@Component({
  selector: 'app-forgot-password-verify-otp',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormFieldErrorComponent
  ],
  templateUrl: './forgot-password-verify-otp.component.html',
  styleUrl: './forgot-password-verify-otp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordVerifyOtpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Public for template: `flow.email()` keeps the reactive graph explicit. */
  readonly flow = inject(PasswordResetFlowService);

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly resendLoading = signal(false);
  readonly resendHint = signal<string | null>(null);
  readonly otpValid = signal(false);

  readonly canSubmit = computed(() => this.otpValid() && !this.loading());

  readonly form = this.fb.nonNullable.group({
    otp: [
      '',
      [Validators.required, Validators.pattern(/^\d{6}$/), Validators.minLength(6), Validators.maxLength(6)]
    ]
  });

  constructor() {
    const otpCtrl = this.form.controls.otp;
    otpCtrl.valueChanges
      .pipe(startWith(otpCtrl.value), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.otpValid.set(otpCtrl.valid));
  }

  onOtpInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    this.form.controls.otp.setValue(digits, { emitEvent: true });
    input.value = digits;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const email = this.flow.email();
    if (!email) {
      void this.router.navigate(['/forgot-password']);
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const otp = this.form.getRawValue().otp;
    this.auth
      .verifyPasswordResetOtp(email, otp)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: ({ resetToken }) => {
          this.flow.setResetToken(resetToken);
          void this.router.navigate(['/forgot-password', 'new-password']);
        },
        error: (err: unknown) => {
          this.error.set(
            (err as { message?: string }).message ??
              'Invalid or expired code. Please try again.'
          );
        }
      });
  }

  resend(): void {
    const email = this.flow.email();
    if (!email) {
      void this.router.navigate(['/forgot-password']);
      return;
    }
    this.resendHint.set(null);
    this.error.set(null);
    this.resendLoading.set(true);
    this.auth
      .forgotPassword(email)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.resendLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.resendHint.set('A new code has been sent to your email.');
        },
        error: (err: unknown) => {
          this.error.set(
            (err as { message?: string }).message ??
              'Could not resend code. Please try again.'
          );
        }
      });
  }
}
