import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
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
  selector: 'app-forgot-password-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormFieldErrorComponent
  ],
  templateUrl: './forgot-password-request.component.html',
  styleUrl: './forgot-password-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly flow = inject(PasswordResetFlowService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly emailValid = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  constructor() {
    const emailCtrl = this.form.controls.email;
    emailCtrl.valueChanges
      .pipe(startWith(emailCtrl.value), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emailValid.set(emailCtrl.valid));
  }

  ngOnInit(): void {
    this.flow.clear();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.loading.set(true);
    const email = this.form.getRawValue().email.trim();
    this.auth
      .forgotPassword(email)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.flow.setEmail(email);
          void this.router.navigate(['/forgot-password', 'verify-otp']);
        },
        error: (err: unknown) => {
          this.error.set(
            (err as { message?: string }).message ??
              'Could not send reset email. Please try again.'
          );
        }
      });
  }
}
