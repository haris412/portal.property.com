import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, merge, switchMap, take } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { ColDef, GridOptions, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

import { PageHeaderComponent, PageHeaderAction } from '../../../shared/ui/page-header/page-header';
import { InfoBannerComponent } from '../../../shared/ui/info-banner/info-banner';
import { DataGridComponent } from '../../../shared/ui/data-grid/data-grid.component';
import { gridActionsColumnDef } from '../../../shared/ui/grid-row-menu-cell/grid-row-menu-cell.component';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { AdminAgencyService } from '../../../core/services/admin-agency.service';
import { UserService, UserListItem } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationDialogService } from '../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';

// ── Cell renderers ────────────────────────────────────────────────────────────

const PILL =
  'display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;';

function statusCellRenderer(p: ICellRendererParams<UserListItem>): HTMLElement {
  const el = document.createElement('span');
  el.textContent = p.data?.isActive ? 'Active' : 'Inactive';
  el.style.cssText = p.data?.isActive
    ? PILL + 'background:rgba(34,197,94,0.15);color:#15803d;'
    : PILL + 'background:rgba(148,163,184,0.25);color:#475569;';
  return el;
}

function verifiedCellRenderer(p: ICellRendererParams<UserListItem>): HTMLElement {
  const el = document.createElement('span');
  el.textContent = p.data?.isEmailVerified ? 'Verified' : 'Unverified';
  el.style.cssText = p.data?.isEmailVerified
    ? PILL + 'background:rgba(59,130,246,0.12);color:#1d4ed8;'
    : PILL + 'background:rgba(251,191,36,0.15);color:#92400e;';
  return el;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-agency-users-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    InfoBannerComponent,
    DataGridComponent,
  ],
  templateUrl: './admin-agency-users-page.component.html',
  styleUrl: './admin-agency-users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAgencyUsersPageComponent {
  private readonly fb            = inject(FormBuilder);
  private readonly router        = inject(Router);
  private readonly adminAuth     = inject(AdminAuthService);
  private readonly adminAgency   = inject(AdminAgencyService);
  private readonly userService   = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmationDialogService);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly loading    = signal(false);
  readonly loadError  = signal<string | null>(null);
  readonly users      = signal<UserListItem[]>([]);
  readonly total      = signal(0);
  readonly page       = signal(1);
  readonly totalPages = signal(1);

  // ── Header ─────────────────────────────────────────────────────────────────
  readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'add-user', label: 'Add User', variant: 'flat',    icon: 'person_add' },
    { id: 'refresh',  label: 'Refresh',  variant: 'stroked', icon: 'refresh' },
  ];

  // ── Filters ────────────────────────────────────────────────────────────────
  readonly filterForm = this.fb.nonNullable.group({
    search:    [''],
    role:      ['all'],
    isActive:  ['all' as 'all' | 'true' | 'false'],
    sortBy:    ['createdAt' as 'createdAt' | 'updatedAt' | 'firstName' | 'lastName'],
    sortOrder: ['desc' as 'asc' | 'desc'],
    limit:     [20],
  });

  // ── Grid ───────────────────────────────────────────────────────────────────
  readonly defaultColDef: ColDef<UserListItem> = {
    sortable: false, filter: false, resizable: true, flex: 1, minWidth: 100,
  };

  readonly columnDefs: ColDef<UserListItem>[] = [
    {
      colId: 'user',
      headerName: 'User',
      flex: 2,
      minWidth: 180,
      valueGetter: (p) => p.data ? `${p.data.firstName} ${p.data.lastName}\n${p.data.email}` : '',
      cellStyle: { lineHeight: '1.45', fontSize: '0.92rem', whiteSpace: 'pre-line' },
    },
    {
      field: 'phoneNumber',
      headerName: 'Phone',
      flex: 1.2,
      minWidth: 140,
      valueFormatter: (p: ValueFormatterParams<UserListItem>) =>
        typeof p.value === 'string' && p.value ? p.value : '—',
    },
    {
      colId: 'agency',
      headerName: 'Agency',
      flex: 1.5,
      minWidth: 140,
      valueGetter: (p) => p.data?.agency?.name?.trim() || '—',
    },
    {
      colId: 'role',
      headerName: 'Role',
      flex: 1,
      minWidth: 100,
      valueGetter: (p) => p.data?.role?.name?.trim() || '—',
    },
    {
      colId: 'status',
      headerName: 'Status',
      width: 110,
      flex: 0,
      cellRenderer: statusCellRenderer,
    },
    {
      colId: 'verified',
      headerName: 'Email',
      width: 110,
      flex: 0,
      cellRenderer: verifiedCellRenderer,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      flex: 0,
      valueFormatter: (p: ValueFormatterParams<UserListItem, string | undefined>) => {
        if (!p.value) return '—';
        const d = new Date(p.value);
        return isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      },
    },
    gridActionsColumnDef<UserListItem>({ maxWidth: 64 }),
  ];

  readonly gridOptions: GridOptions<UserListItem> = {
    context: {
      menuItems: [
        {
          label: 'Copy user ID',
          icon: 'content_copy',
          action: async (id: string) => {
            try {
              await navigator.clipboard.writeText(id);
              this.notifications.success('User ID copied to clipboard.');
            } catch {
              this.notifications.warning('Could not copy to clipboard.');
            }
          },
        },
        {
          label: 'Edit user',
          icon: 'edit',
          action: (id: string, rowData?: unknown) => {
            const agencyId = (rowData as UserListItem | undefined)?.agency?._id;
            void this.router.navigate(['/admin/add-user'], {
              queryParams: { userId: id, ...(agencyId ? { agencyId } : {}) },
            });
          },
        },
        {
          label: 'Resend invite',
          icon: 'forward_to_inbox',
          hidden: (rowData: unknown) => (rowData as UserListItem | undefined)?.isActive === true,
          action: (id: string, rowData?: unknown) => this.resendInvite(id, rowData as UserListItem),
        },
        {
          label: 'Delete user',
          icon: 'delete_outline',
          action: (id: string) => this.deleteUser(id),
        },
      ],
    },
  };

  // ── Constructor ────────────────────────────────────────────────────────────
  constructor() {
    this.fetchUsers();

    this.filterForm.controls.search.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => { this.page.set(1); this.fetchUsers(); });

    merge(
      this.filterForm.controls.role.valueChanges,
      this.filterForm.controls.isActive.valueChanges,
      this.filterForm.controls.sortBy.valueChanges,
      this.filterForm.controls.sortOrder.valueChanges,
      this.filterForm.controls.limit.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => { this.page.set(1); this.fetchUsers(); });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  onHeaderAction(id: string): void {
    if (id === 'add-user') void this.router.navigate(['/admin/add-user']);
    if (id === 'refresh')  this.fetchUsers();
  }

  goPrev(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.fetchUsers();
  }

  goNext(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.fetchUsers();
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private resendInvite(userId: string, user: UserListItem): void {
    const agencyId = user?.agency?._id;
    if (!agencyId) {
      this.notifications.error('Cannot resend invite: agency not found for this user.');
      return;
    }

    this.adminAgency.resendInvite(agencyId, userId).pipe(take(1)).subscribe({
      next: () => this.notifications.success('Invite resent successfully.'),
      error: (err: unknown) => this.notifications.error(apiErrorSummary(err)),
    });
  }

  private deleteUser(id: string): void {
    this.confirmDialog
      .confirm({
        title: 'Delete User',
        message: 'This will permanently delete the user. This action cannot be undone.',
        confirmLabel: 'Delete',
        tone: 'warn',
        icon: 'delete_outline',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.userService.deleteUser(id)),
        take(1),
      )
      .subscribe({
        next: () => {
          this.notifications.success('User deleted successfully.');
          this.fetchUsers();
        },
        error: (err: unknown) => this.notifications.error(apiErrorSummary(err)),
      });
  }

  private fetchUsers(): void {
    const adminId = this.adminAuth.getCurrentAdminUser()?._id;
    if (!adminId) {
      this.loadError.set('You must be signed in as an admin.');
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    const f = this.filterForm.getRawValue();

    this.userService.listUsers({
      createdBy:  adminId,
      search:     f.search.trim() || undefined,
      role:       f.role !== 'all'     ? f.role     : undefined,
      isActive:   f.isActive !== 'all' ? f.isActive === 'true' : undefined,
      page:       this.page(),
      limit:      f.limit,
      sortBy:     f.sortBy,
      sortOrder:  f.sortOrder,
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.users.set(result.users);
          this.total.set(result.total);
          this.page.set(result.page);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loadError.set(apiErrorSummary(err));
          this.users.set([]);
          this.loading.set(false);
        },
      });
  }
}
