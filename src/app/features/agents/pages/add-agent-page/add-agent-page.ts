import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { AgentsService } from '../../../../core/services/agents.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import type { AgentListItem } from '../../../../core/models/agent.models';

@Component({
  selector: 'app-add-agent-page',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-agent-page.html',
  styleUrl: './add-agent-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAgentPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly agentsApi = inject(AgentsService);
  private readonly notifications = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  readonly submitting = signal(false);
  readonly loadingAgent = signal(false);
  readonly isEditMode = signal(false);

  readonly agencyId = this.auth.getCurrentUser()?.agencyId?.trim() ?? '';

  private editAgentId = '';
  private loadedAgent: AgentListItem | null = null;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.editAgentId = params.get('agentId')?.trim() ?? '';
      this.isEditMode.set(this.editAgentId.length > 0);
      this.resetForm();
    });
  }

  get userInitials(): string {
    const f = this.form.controls.firstName.value?.trim();
    const l = this.form.controls.lastName.value?.trim();
    if (f && l) {
      return (f[0] + l[0]).toUpperCase();
    }
    return f ? f.slice(0, 2).toUpperCase() : 'A';
  }

  get fullName(): string {
    const f = this.form.controls.firstName.value?.trim();
    const l = this.form.controls.lastName.value?.trim();
    return [f, l].filter(Boolean).join(' ') || (this.translate.instant('agents.form.newAgent') as string);
  }

  submit(): void {
    if (!this.agencyId) {
      this.notifications.error(this.translate.instant('agents.errors.noAgency') as string);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, phoneNumber } = this.form.getRawValue();
    const editMode = this.isEditMode();

    this.submitting.set(true);

    const request$ = editMode
      ? this.agentsApi.updateAgent({
          _id: this.editAgentId,
          agencyId: this.agencyId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          displayName: this.loadedAgent?.displayName,
          profileImageUrl: this.loadedAgent?.profileImageUrl,
          location: this.loadedAgent?.location,
        })
      : this.agentsApi.createAgent({
          agencyId: this.agencyId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
        });

    request$.pipe(take(1)).subscribe({
      next: () => {
        this.submitting.set(false);
        const key = editMode ? 'agents.form.updateSuccess' : 'agents.form.createSuccess';
        this.notifications.success(this.translate.instant(key) as string);
        void this.router.navigate(['/agents']);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.notifications.error(apiErrorSummary(err));
      },
    });
  }

  private resetForm(): void {
    this.form.reset({}, { emitEvent: false });
    this.loadedAgent = null;

    if (this.isEditMode()) {
      this.form.controls.email.disable({ emitEvent: false });
      this.loadAgentForEdit();
      return;
    }

    this.form.controls.email.enable({ emitEvent: false });
  }

  private loadAgentForEdit(): void {
    if (!this.editAgentId) {
      return;
    }

    this.loadingAgent.set(true);
    this.agentsApi.getAgentById(this.editAgentId).pipe(take(1)).subscribe({
      next: (agent) => {
        this.loadedAgent = agent;
        this.form.patchValue({
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          phoneNumber: agent.phoneNumber ?? '',
        });
        this.loadingAgent.set(false);
      },
      error: (err: unknown) => {
        this.loadingAgent.set(false);
        this.notifications.error(apiErrorSummary(err));
        void this.router.navigate(['/agents']);
      },
    });
  }
}
