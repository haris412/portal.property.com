import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, take } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminAgencyService, AgencyListItem, AgencyUserItem } from '../../../core/services/admin-agency.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';

@Component({
  selector: 'app-admin-add-agency-user-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-add-agency-user-page.component.html',
  styleUrl: './admin-add-agency-user-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAddAgencyUserPageComponent {
  private readonly fb            = inject(FormBuilder);
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly adminAgency   = inject(AdminAgencyService);
  private readonly userService   = inject(UserService);
  private readonly notifications = inject(NotificationService);

  readonly submitting      = signal(false);
  readonly loadingUser     = signal(false);
  readonly agencies        = signal<AgencyListItem[]>([]);
  readonly agenciesLoading = signal(false);
  readonly isEditMode      = signal(false);

  private editUserId = '';

  readonly form = this.fb.nonNullable.group({
    agencyId:    ['', Validators.required],
    firstName:   ['', [Validators.required, Validators.maxLength(60)]],
    lastName:    ['', [Validators.required, Validators.maxLength(60)]],
    email:       ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
  });

  constructor() {
    this.loadAgencies();

    // Reacts on first load AND when Angular reuses this component (same route, different params)
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.editUserId = params.get('userId') ?? '';
      this.isEditMode.set(this.editUserId.length > 0);
      this.resetForm();
    });
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  get userInitials(): string {
    const f = this.form.controls.firstName.value?.trim();
    const l = this.form.controls.lastName.value?.trim();
    if (f && l) return (f[0] + l[0]).toUpperCase();
    return f ? f.slice(0, 2).toUpperCase() : 'U';
  }

  get fullName(): string {
    const f = this.form.controls.firstName.value?.trim();
    const l = this.form.controls.lastName.value?.trim();
    return [f, l].filter(Boolean).join(' ') || 'New user';
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const editMode = this.isEditMode();
    const { agencyId, firstName, lastName, email, phoneNumber } =
      this.form.getRawValue();

    const request$: Observable<AgencyUserItem> = editMode
      ? this.adminAgency.updateAgencyUser(agencyId, this.editUserId, {
          firstName:   firstName.trim()   || undefined,
          lastName:    lastName.trim()    || undefined,
          email:       email.trim()       || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
        })
      : this.adminAgency.createAgencyUser(agencyId, {
          firstName:   firstName.trim(),
          lastName:    lastName.trim(),
          email:       email.trim(),
          phoneNumber: phoneNumber.trim(),
          roleName:    'Agent',
        });

    this.submitting.set(true);
    request$.pipe(take(1)).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success(
          editMode ? 'User updated successfully.' : 'User created and invite sent.',
        );
        void this.router.navigate(['/admin/users']);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.notifications.error(apiErrorSummary(err));
      },
    });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private resetForm(): void {
    this.form.reset({}, { emitEvent: false });
    this.form.controls.agencyId.enable({ emitEvent: false });

    if (this.isEditMode()) {
      this.loadUserForEdit();
    } else {
      this.tryPreselectAgency();
    }
  }

  private loadAgencies(): void {
    this.agenciesLoading.set(true);
    this.adminAgency
      .listAgencies({ isActive: true, limit: 100, sortBy: 'name', sortOrder: 'asc' })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (result) => {
          this.agencies.set(result.agencies);
          this.agenciesLoading.set(false);
          this.tryPreselectAgency();
        },
        error: () => {
          this.agenciesLoading.set(false);
          this.notifications.error('Could not load agencies.');
        },
      });
  }

  private tryPreselectAgency(): void {
    if (this.isEditMode()) return;
    const agencyId = this.route.snapshot.queryParamMap.get('agencyId');
    if (!agencyId) return;
    if (this.agencies().some((a) => a._id === agencyId)) {
      this.form.controls.agencyId.setValue(agencyId);
      this.form.controls.agencyId.disable({ emitEvent: false });
    }
  }

  private loadUserForEdit(): void {
    this.loadingUser.set(true);
    this.userService.getUserById(this.editUserId).pipe(take(1)).subscribe({
      next: (user) => {
        this.form.patchValue({
          agencyId:    user.agency?._id ?? '',
          firstName:   user.firstName,
          lastName:    user.lastName,
          email:       user.email,
          phoneNumber: user.phoneNumber ?? '',
        });
        this.form.controls.agencyId.disable({ emitEvent: false });
        this.loadingUser.set(false);
      },
      error: (err: unknown) => {
        this.notifications.error(apiErrorSummary(err));
        this.loadingUser.set(false);
      },
    });
  }
}
