import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { take } from 'rxjs';
import { AdminAgencyService, AgencyListItem } from '../../../core/services/admin-agency.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';

const ROLES = ['Agent', 'Buyer', 'Seller'] as const;

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
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly adminAgency = inject(AdminAgencyService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly roles = ROLES;
  readonly submitting = signal(false);
  readonly showPassword = signal(false);
  readonly agencies = signal<AgencyListItem[]>([]);
  readonly agenciesLoading = signal(false);

  readonly form = this.fb.nonNullable.group({
    agencyId:    ['', Validators.required],
    firstName:   ['', [Validators.required, Validators.maxLength(60)]],
    lastName:    ['', [Validators.required, Validators.maxLength(60)]],
    email:       ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    password:    ['', [Validators.required, Validators.minLength(6)]],
    roleName:    ['Agent'],
  });

  constructor() {
    this.loadAgencies();
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
          this.preselectAgencyFromRoute();
        },
        error: () => {
          this.agenciesLoading.set(false);
          this.notifications.error('Could not load agencies');
        },
      });
  }

  private preselectAgencyFromRoute(): void {
    const agencyId = this.route.snapshot.queryParamMap.get('agencyId');
    if (!agencyId) return;
    const exists = this.agencies().some((a) => a._id === agencyId);
    if (exists) {
      this.form.controls.agencyId.setValue(agencyId);
      this.form.controls.agencyId.disable();
    }
  }

  get userInitials(): string {
    const first = this.form.controls.firstName.value?.trim();
    const last  = this.form.controls.lastName.value?.trim();
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first)         return first.slice(0, 2).toUpperCase();
    return 'U';
  }

  get fullName(): string {
    const first = this.form.controls.firstName.value?.trim();
    const last  = this.form.controls.lastName.value?.trim();
    return [first, last].filter(Boolean).join(' ') || 'New user';
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { agencyId, firstName, lastName, email, phoneNumber, password, roleName } = this.form.getRawValue();

    this.submitting.set(true);
    this.adminAgency
      .createAgencyUser(agencyId, {
        firstName:   firstName.trim(),
        lastName:    lastName.trim(),
        email:       email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        roleName:    roleName || 'Agent',
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notifications.success('User created successfully');
          void this.router.navigate(['/admin/users']);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.notifications.error(apiErrorSummary(err));
        },
      });
  }
}
