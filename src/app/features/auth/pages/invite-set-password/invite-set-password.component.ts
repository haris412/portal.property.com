import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AuthService } from '../../../../core/services/auth.service';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';

@Component({
  selector: 'app-invite-set-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    FormFieldErrorComponent,
  ],
  templateUrl: './invite-set-password.component.html',
  styleUrl: './invite-set-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteSetPasswordComponent {
  private readonly fb     = inject(FormBuilder);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  /** Invite token from the link: /accept-invite?token=abc123 */
  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  readonly hidePassword = signal(true);
  readonly hideConfirm  = signal(true);
  readonly error        = signal<string | null>(null);
  readonly loading      = signal(false);
  readonly formOk       = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: [passwordMatchValidator('password', 'confirmPassword')] },
  );

  readonly canSubmit = computed(() => this.formOk() && !this.loading());

  constructor() {
    if (!this.token) {
      void this.router.navigate(['/auth']);
      return;
    }

    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed())
      .subscribe(() =>
        this.formOk.set(
          this.form.controls.password.valid &&
          this.form.controls.confirmPassword.valid &&
          !this.form.hasError('passwordMismatch'),
        ),
      );
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.error.set(null);
    this.loading.set(true);

    this.auth.inviteSetPassword(this.token, this.form.getRawValue().password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.auth.setRedirectMessage('Your account is ready. Sign in with your email and new password.');
          void this.router.navigate(['/auth']);
        },
        error: (err: unknown) => {
          const msg = (err as { message?: string }).message ?? '';
          // Already accepted → no point showing an error, just send to login
          if (msg.toLowerCase().includes('already accepted')) {
            this.auth.setRedirectMessage('Invite already accepted. Please sign in.');
            void this.router.navigate(['/auth']);
            return;
          }
          this.error.set(msg || 'Could not set password. Please try again.');
        },
      });
  }
}
