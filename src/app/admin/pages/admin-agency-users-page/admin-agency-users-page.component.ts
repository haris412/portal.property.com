import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, merge, startWith, switchMap, take } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type {
  ColDef,
  GridApi,
  GridOptions,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';

import { PageHeaderComponent, PageHeaderAction } from '../../../shared/ui/page-header/page-header';
import { InfoBannerComponent } from '../../../shared/ui/info-banner/info-banner';
import { DataGridComponent } from '../../../shared/ui/data-grid/data-grid.component';
import { gridActionsColumnDef, GridRowMenuItem, GridRowMenuContext } from '../../../shared/ui/grid-row-menu-cell/grid-row-menu-cell.component';
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
  const translate = p.context?.translate as TranslateService | undefined;
  const t = (k: string) => translate?.instant(k) ?? k;
  const el = document.createElement('span');
  el.textContent = p.data?.isActive ? t('users.statuses.active') : t('users.statuses.inactive');
  el.style.cssText = p.data?.isActive
    ? PILL + 'background:rgba(34,197,94,0.15);color:#15803d;'
    : PILL + 'background:rgba(148,163,184,0.25);color:#475569;';
  return el;
}

function verifiedCellRenderer(p: ICellRendererParams<UserListItem>): HTMLElement {
  const translate = p.context?.translate as TranslateService | undefined;
  const t = (k: string) => translate?.instant(k) ?? k;
  const el = document.createElement('span');
  el.textContent = p.data?.isEmailVerified
    ? t('users.emailStatuses.verified')
    : t('users.emailStatuses.unverified');
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
    TranslateModule,
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
  private readonly translate     = inject(TranslateService);

  private gridApi: GridApi<UserListItem> | null = null;

  private readonly langChange$ = toSignal(
    this.translate.onLangChange.pipe(startWith(null)),
    { initialValue: null }
  );

  // ── State ──────────────────────────────────────────────────────────────────
  readonly loading    = signal(false);
  readonly loadError  = signal<string | null>(null);
  readonly users      = signal<UserListItem[]>([]);
  readonly total      = signal(0);
  readonly page       = signal(1);
  readonly totalPages = signal(1);

  // ── Header ─────────────────────────────────────────────────────────────────
  readonly headerActions = computed<PageHeaderAction[]>(() => {
    void this.langChange$();
    const t = (k: string) => this.translate.instant(k);
    return [
      { id: 'add-user', label: t('users.create'),  variant: 'flat',    icon: 'person_add' },
      { id: 'refresh',  label: t('base.refresh'),   variant: 'stroked', icon: 'refresh' },
    ];
  });

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
      headerValueGetter: () => this.translate.instant('users.tc.user'),
      flex: 2,
      minWidth: 180,
      valueGetter: (p) => p.data ? `${p.data.firstName} ${p.data.lastName}\n${p.data.email}` : '',
      cellStyle: { lineHeight: '1.45', fontSize: '0.92rem', whiteSpace: 'pre-line' },
    },
    {
      field: 'phoneNumber',
      headerValueGetter: () => this.translate.instant('users.tc.phone'),
      flex: 1.2,
      minWidth: 140,
      valueFormatter: (p: ValueFormatterParams<UserListItem>) =>
        typeof p.value === 'string' && p.value ? p.value : '—',
    },
    {
      colId: 'agency',
      headerValueGetter: () => this.translate.instant('users.tc.agency'),
      flex: 1.5,
      minWidth: 140,
      valueGetter: (p) => p.data?.agency?.name?.trim() || '—',
    },
    {
      colId: 'role',
      headerValueGetter: () => this.translate.instant('users.tc.role'),
      flex: 1,
      minWidth: 100,
      valueGetter: (p) => p.data?.role?.name?.trim() || '—',
    },
    {
      colId: 'status',
      headerValueGetter: () => this.translate.instant('users.tc.status'),
      width: 110,
      flex: 0,
      cellRenderer: statusCellRenderer,
    },
    {
      colId: 'verified',
      headerValueGetter: () => this.translate.instant('users.tc.email'),
      width: 110,
      flex: 0,
      cellRenderer: verifiedCellRenderer,
    },
    {
      field: 'createdAt',
      headerValueGetter: () => this.translate.instant('users.tc.createdAt'),
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
      translate: this.translate,
      menuItems: this.buildMenuItems(),
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

    this.translate.onLangChange
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        (this.gridOptions.context as GridRowMenuContext).menuItems = this.buildMenuItems();
        this.gridApi?.refreshHeader();
        this.gridApi?.refreshCells({ force: true, columns: ['status', 'verified'] });
      });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  onGridReady(api: GridApi<UserListItem>): void {
    this.gridApi = api;
  }

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
  private buildMenuItems(): GridRowMenuItem[] {
    const t = (k: string) => this.translate.instant(k);
    return [
      {
        label: t('users.actions.copyId'),
        icon: 'content_copy',
        action: async (id: string) => {
          try {
            await navigator.clipboard.writeText(id);
            this.notifications.success(t('users.messages.idCopied'));
          } catch {
            this.notifications.warning(t('users.messages.clipboardError'));
          }
        },
      },
      {
        label: t('users.actions.edit'),
        icon: 'edit',
        action: (id: string, rowData?: unknown) => {
          const agencyId = (rowData as UserListItem | undefined)?.agency?._id;
          void this.router.navigate(['/admin/add-user'], {
            queryParams: { userId: id, ...(agencyId ? { agencyId } : {}) },
          });
        },
      },
      {
        label: t('users.actions.resendInvite'),
        icon: 'forward_to_inbox',
        hidden: (rowData: unknown) => (rowData as UserListItem | undefined)?.isActive === true,
        action: (id: string, rowData?: unknown) => this.resendInvite(id, rowData as UserListItem),
      },
      {
        label: t('users.actions.delete'),
        icon: 'delete_outline',
        action: (id: string) => this.deleteUser(id),
      },
    ];
  }

  private resendInvite(userId: string, user: UserListItem): void {
    const agencyId = user?.agency?._id;
    if (!agencyId) {
      this.notifications.error(this.translate.instant('users.messages.noAgency'));
      return;
    }

    this.adminAgency.resendInvite(agencyId, userId).pipe(take(1)).subscribe({
      next: () => this.notifications.success(this.translate.instant('users.messages.inviteResent')),
      error: (err: unknown) => this.notifications.error(apiErrorSummary(err)),
    });
  }

  private deleteUser(id: string): void {
    const t = (k: string) => this.translate.instant(k);
    this.confirmDialog
      .confirm({
        title: t('users.confirm.deleteTitle'),
        message: t('users.confirm.deleteMessage'),
        confirmLabel: t('users.confirm.deleteConfirm'),
        cancelLabel: t('users.confirm.deleteCancel'),
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
          this.notifications.success(t('users.messages.deleted'));
          this.fetchUsers();
        },
        error: (err: unknown) => this.notifications.error(apiErrorSummary(err)),
      });
  }

  private fetchUsers(): void {
    const adminId = this.adminAuth.getCurrentAdminUser()?._id;
    if (!adminId) {
      this.loadError.set(this.translate.instant('users.messages.notSignedIn'));
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
