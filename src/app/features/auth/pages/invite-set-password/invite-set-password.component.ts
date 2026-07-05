import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, map, startWith, take } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormFieldErrorComponent } from '../../../../shared/ui/form-field-error/form-field-error.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AgentsService } from '../../../../core/services/agents.service';
import { passwordMatchValidator } from '../../../../shared/validators/password-match.validator';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-invite-set-password',
  standalone: true,
  imports: [
    NgTemplateOutlet,
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
  private readonly fb            = inject(FormBuilder);
  private readonly auth          = inject(AuthService);
  private readonly agentsApi     = inject(AgentsService);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly translate     = inject(TranslateService);

  /** Public invite link: /accept-invite?token=... */
  readonly embedded = this.route.snapshot.data['embedded'] === true;

  /** Invite token from query string (public invite flow only). */
  readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

  /** Agent id from route (agency admin embedded flow). */
  readonly agentId = this.route.snapshot.paramMap.get('agentId')?.trim() ?? '';

  readonly agencyId = this.auth.getCurrentUser()?.agencyId?.trim() ?? '';

  readonly agentName = signal(
    (typeof history.state?.['agentName'] === 'string' ? history.state['agentName'] : '').trim(),
  );

  readonly verifying   = signal(true);
  readonly tokenValid  = signal(false);
  readonly loadError   = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly hideConfirm  = signal(true);
  readonly submitting   = signal(false);
  readonly formOk       = signal(false);
  readonly submitError  = signal<string | null>(null);

  readonly cancelLink = this.embedded ? '/agents' : '/auth';

  readonly form = this.fb.nonNullable.group(
    {
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: [passwordMatchValidator('password', 'confirmPassword')] },
  );

  readonly canSubmit = computed(() => this.formOk() && !this.submitting());

  constructor() {
    if (this.embedded) {
      this.initEmbeddedFlow();
      return;
    }
    this.initPublicInviteFlow();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitError.set(null);
    this.submitting.set(true);

    const password = this.form.getRawValue().password;
    const request$ = this.embedded
      ? this.agentsApi.setAgentPassword({
          _id: this.agentId,
          agencyId: this.agencyId,
          password,
        }).pipe(map(() => undefined))
      : this.auth.inviteSetPassword(this.token, password);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          if (this.embedded) {
            this.notifications.success(
              this.translate.instant('agents.messages.passwordSet') as string,
            );
          }
          void this.router.navigate([this.cancelLink]);
        },
        error: (err: unknown) => this.submitError.set(apiErrorSummary(err)),
      });
  }

  private initEmbeddedFlow(): void {
    if (!this.agentId) {
      this.verifying.set(false);
      this.loadError.set(this.translate.instant('agents.errors.invalidAgent') as string);
      return;
    }

    if (!this.agencyId) {
      this.verifying.set(false);
      this.loadError.set(this.translate.instant('agents.errors.noAgency') as string);
      return;
    }

    if (this.agentName()) {
      this.readyForPassword();
      return;
    }

    this.agentsApi.getAgentById(this.agentId, this.agencyId).pipe(take(1)).subscribe({
      next: (agent) => {
        const name = [agent.firstName, agent.lastName].filter(Boolean).join(' ').trim();
        if (name) {
          this.agentName.set(name);
        }
        this.readyForPassword();
      },
      error: (err: unknown) => {
        this.verifying.set(false);
        this.loadError.set(apiErrorSummary(err));
      },
    });
  }

  private initPublicInviteFlow(): void {
    if (!this.token) {
      void this.router.navigate(['/auth']);
      return;
    }

    this.auth.verifyInviteToken(this.token).pipe(take(1)).subscribe({
      next: () => this.readyForPassword(),
      error: (err: unknown) => {
        this.auth.setRedirectMessage(apiErrorSummary(err));
        void this.router.navigate(['/auth']);
      },
    });
  }

  private readyForPassword(): void {
    this.verifying.set(false);
    this.tokenValid.set(true);
    this.watchFormValidity();
  }

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
