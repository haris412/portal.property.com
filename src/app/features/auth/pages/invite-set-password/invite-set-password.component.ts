import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, startWith, take } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AuthService } from '../../../../core/services/auth.service';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-invite-set-password',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FormFieldErrorComponent,
  ],
  templateUrl: './invite-set-password.component.html',
  styleUrl: './invite-set-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteSetPasswordComponent {
  private readonly fb         = inject(FormBuilder);
  private readonly auth       = inject(AuthService);
  private readonly router     = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Invite token from the link: /accept-invite?token=abc123 */
  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  readonly verifying    = signal(true);
  readonly tokenValid   = signal(false);
  readonly hidePassword = signal(true);
  readonly hideConfirm  = signal(true);
  readonly submitting   = signal(false);
  readonly formOk       = signal(false);
  readonly submitError  = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: [passwordMatchValidator('password', 'confirmPassword')] },
  );

  readonly canSubmit = computed(() => this.formOk() && !this.submitting());

  constructor() {
    if (!this.token) {
      void this.router.navigate(['/auth']);
      return;
    }

    this.auth.verifyInviteToken(this.token).pipe(take(1)).subscribe({
      next: () => {
        this.verifying.set(false);
        this.tokenValid.set(true);
        this.watchFormValidity();
      },
      error: (err: unknown) => {
        this.auth.setRedirectMessage(apiErrorSummary(err));
        void this.router.navigate(['/auth']);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitError.set(null);
    this.submitting.set(true);

    this.auth.inviteSetPassword(this.token, this.form.getRawValue().password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/auth']),
        error: (err: unknown) => this.submitError.set(apiErrorSummary(err)),
      });
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private watchFormValidity(): void {
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed(this.destroyRef))
      .subscribe(() =>
        this.formOk.set(
          this.form.controls.password.valid &&
          this.form.controls.confirmPassword.valid &&
          !this.form.hasError('passwordMismatch'),
        ),
      );
  }
}
