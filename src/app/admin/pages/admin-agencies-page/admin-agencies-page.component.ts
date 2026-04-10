import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ColDef,
  GridOptions,
  ICellRendererParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { debounceTime, distinctUntilChanged, filter, merge, switchMap, take } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PageHeaderComponent, PageHeaderAction } from '../../../shared/ui/page-header/page-header';
import { InfoBannerComponent } from '../../../shared/ui/info-banner/info-banner';
import { DataGridComponent } from '../../../shared/ui/data-grid/data-grid.component';
import { gridActionsColumnDef } from '../../../shared/ui/grid-row-menu-cell/grid-row-menu-cell.component';
import { ConfirmationDialogService } from '../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import {
  AdminAgencyService,
  AgencySortBy,
  AgencySortOrder,
  AgencyListItem,
  ListAgenciesQuery,
  ListAgenciesResult,
} from '../../../core/services/admin-agency.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';
import type { AdminAgenciesResolved } from '../../resolvers/admin-agencies.resolver';

const AGENCY_STATUS_PILL_BASE =
  'display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;';

function agencyStatusCellRenderer(p: ICellRendererParams<AgencyListItem>): HTMLElement {
  const d = p.data;
  const el = document.createElement('span');
  if (d?.isActive === true) {
    el.textContent = 'Active';
    el.style.cssText = AGENCY_STATUS_PILL_BASE + 'background:rgba(34,197,94,0.15);color:#15803d;';
  } else if (d?.isActive === false) {
    el.textContent = 'Inactive';
    el.style.cssText = AGENCY_STATUS_PILL_BASE + 'background:rgba(148,163,184,0.25);color:#475569;';
  } else {
    el.textContent = '—';
    el.style.color = '#64748b';
  }
  return el;
}

const AGENCY_LOGO_IMG_STYLE =
  'width:40px;height:40px;border-radius:10px;object-fit:cover;border:1px solid #ead9d0;background:#fff;';
const AGENCY_LOGO_FALLBACK_STYLE =
  'display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:rgba(31,22,48,0.06);color:#64748b;';
/** Simple building icon (Material-style domain) for when there is no logo or the image fails. */
const AGENCY_LOGO_FALLBACK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>';

function agencyLogoCellRenderer(p: ICellRendererParams<AgencyListItem>): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;';

  const showFallback = (): void => {
    wrap.innerHTML = '';
    const fb = document.createElement('div');
    fb.setAttribute('aria-hidden', 'true');
    fb.style.cssText = AGENCY_LOGO_FALLBACK_STYLE;
    fb.innerHTML = AGENCY_LOGO_FALLBACK_SVG;
    wrap.appendChild(fb);
  };

  const url = p.data?.logoUrl?.trim();
  if (url) {
    const img = document.createElement('img');
    img.alt = '';
    img.src = url;
    img.style.cssText = AGENCY_LOGO_IMG_STYLE;
    img.addEventListener('error', showFallback, { once: true });
    wrap.appendChild(img);
  } else {
    showFallback();
  }

  return wrap;
}

@Component({
  selector: 'app-admin-agencies-page',
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
  templateUrl: './admin-agencies-page.component.html',
  styleUrl: './admin-agencies-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAgenciesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminAuth = inject(AdminAuthService);
  private readonly adminAgency = inject(AdminAgencyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly notifications = inject(NotificationService);
  private readonly confirmation = inject(ConfirmationDialogService);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly agencies = signal<AgencyListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'add-agency', label: 'Add Agency', variant: 'flat', icon: 'add' },
    { id: 'refresh', label: 'Refresh', variant: 'stroked', icon: 'refresh' },
  ];

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    isActive: ['all' as 'all' | 'true' | 'false'],
    sortBy: ['createdAt' as AgencySortBy],
    sortOrder: ['desc' as AgencySortOrder],
    limit: [20, [Validators.min(1), Validators.max(100)]],
  });

  /** Server-driven list: sorting/filtering use the form above, not AG Grid. */
  readonly agencyDefaultColDef: ColDef<AgencyListItem> = {
    sortable: false,
    filter: false,
    resizable: true,
    flex: 1,
    minWidth: 100,
  };

  readonly agencyColumnDefs: ColDef<AgencyListItem>[] = [
    {
      colId: 'logo',
      headerName: '',
      width: 72,
      maxWidth: 80,
      flex: 0,
      pinned: 'left',
      cellRenderer: agencyLogoCellRenderer,
    },
    {
      colId: 'agency',
      headerName: 'Agency',
      flex: 2,
      minWidth: 160,
      wrapText: true,
      autoHeight: true,
      valueGetter: (p: ValueGetterParams<AgencyListItem>) => {
        const d = p.data;
        if (!d) return '';
        const name = d.name?.trim() || '—';
        return `${name}\n${d._id}`;
      },
      cellStyle: { lineHeight: '1.45', fontSize: '0.92rem', whiteSpace: 'pre-line' },
    },
    {
      field: 'location',
      headerName: 'Location',
      flex: 1.2,
      minWidth: 120,
      valueFormatter: (p: ValueFormatterParams<AgencyListItem>) => {
        const v = p.value;
        return typeof v === 'string' && v.trim() ? v : '—';
      },
    },
    {
      colId: 'contact',
      headerName: 'Contacts',
      flex: 2,
      minWidth: 200,
      wrapText: true,
      autoHeight: true,
      valueGetter: (p: ValueGetterParams<AgencyListItem>) => {
        const d = p.data;
        if (!d) return '';
        
        const contacts = d.contacts || [];
        if (contacts.length === 0) return '—';
        
        return contacts.map(c => {
          const parts = [];
          if (c.name?.trim()) parts.push(c.name.trim());
          if (c.email?.trim()) parts.push(c.email.trim());
          if (c.phone?.trim()) parts.push(c.phone.trim());
          return parts.join(' • ');
        }).join('\n');
      },
      cellStyle: { lineHeight: '1.45', fontSize: '0.92rem', whiteSpace: 'pre-line' },
      cellRenderer: (p: ICellRendererParams<AgencyListItem>) => {
        const d = p.data;
        if (!d || !d.contacts || d.contacts.length === 0) {
          const el = document.createElement('span');
          el.textContent = '—';
          el.style.color = '#64748b';
          return el;
        }

        const container = document.createElement('div');
        container.style.cssText = 'display: flex; flex-direction: column; gap: 4px; padding: 4px 0;';

        d.contacts.forEach((contact, index) => {
          const contactEl = document.createElement('div');
          contactEl.style.cssText = 'display: flex; align-items: flex-start; gap: 6px;';
          
          // Primary indicator
          if (contact.isPrimary) {
            const starEl = document.createElement('span');
            starEl.innerHTML = '★';
            starEl.style.cssText = 'color: #fbbf24; font-size: 12px; line-height: 1.4; font-weight: 600;';
            contactEl.appendChild(starEl);
          }

          // Contact details
          const detailsEl = document.createElement('div');
          detailsEl.style.cssText = 'flex: 1; line-height: 1.4;';
          
          const parts = [];
          if (contact.name?.trim()) parts.push(`<strong>${contact.name.trim()}</strong>`);
          if (contact.email?.trim()) parts.push(contact.email.trim());
          if (contact.phone?.trim()) parts.push(contact.phone.trim());
          
          detailsEl.innerHTML = parts.join('<br>');
          contactEl.appendChild(detailsEl);
          
          container.appendChild(contactEl);
        });

        return container;
      },
    },
    {
      colId: 'status',
      headerName: 'Status',
      width: 118,
      maxWidth: 130,
      flex: 0,
      cellRenderer: agencyStatusCellRenderer,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 200,
      flex: 0,
      valueFormatter: (p: ValueFormatterParams<AgencyListItem, string | undefined>) => {
        const v = p.value;
        if (!v) return '—';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      },
    },
    gridActionsColumnDef<AgencyListItem>({ maxWidth: 64 }),
  ];

  readonly agencyGridOptions: GridOptions<AgencyListItem> = {
    context: {
      menuItems: [
        {
          label: 'Edit agency',
          icon: 'edit',
          action: (id: string) => {
            void this.router.navigate(['/admin/add-agency'], { queryParams: { agencyId: id } });
          },
        },
        {
          label: 'Add user',
          icon: 'person_add',
          action: (id: string) => {
            void this.router.navigate(['/admin/add-user'], { queryParams: { agencyId: id } });
          },
        },
        {
          label: 'Copy agency ID',
          icon: 'content_copy',
          action: async (id: string) => {
            try {
              await navigator.clipboard.writeText(id);
              this.notifications.success('Agency ID copied to clipboard.');
            } catch {
              this.notifications.warning('Could not copy to clipboard.');
            }
          },
        },
        {
          label: 'Delete agency',
          icon: 'delete_outline',
          action: (id: string, row?: unknown) => this.confirmDeleteAgency(id, row),
        },
      ],
    },
  };

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const resolved = data['adminAgencies'] as AdminAgenciesResolved | undefined;
      if (!resolved) return;
      this.syncFormFromQueryParams();
      this.applyResolved(resolved);
    });

    this.filterForm.controls.search.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.fetchList();
      });

    merge(
      this.filterForm.controls.isActive.valueChanges,
      this.filterForm.controls.sortBy.valueChanges,
      this.filterForm.controls.sortOrder.valueChanges,
      this.filterForm.controls.limit.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(1);
        this.fetchList();
      });
  }

  private confirmDeleteAgency(rowId: string, rowData?: unknown): void {
    const row = rowData as AgencyListItem | undefined;
    const name = row?.name?.trim() || 'this agency';

    this.confirmation
      .confirm({
        title: 'Delete agency?',
        message: `Delete "${name}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        tone: 'warn',
        icon: 'warning',
      })
      .pipe(
        take(1),
        filter((ok: boolean): ok is true => ok === true),
        switchMap(() => this.adminAgency.deleteAgency(rowId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.notifications.success('Agency deleted');
          this.fetchList();
        },
        error: (err: unknown) => {
          this.notifications.error(apiErrorSummary(err));
        },
      });
  }

  onHeaderAction(id: string): void {
    if (id === 'add-agency') {
      void this.router.navigate(['/admin/add-agency']);
      return;
    }
    if (id === 'refresh') {
      this.fetchList();
    }
  }

  goPrev(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.fetchList();
  }

  goNext(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.fetchList();
  }

  private syncFormFromQueryParams(): void {
    const q = this.route.snapshot.queryParamMap;
    const is = q.get('isActive');
    const sortRaw = q.get('sortBy') ?? 'createdAt';
    const sortBy: AgencySortBy = ['createdAt', 'updatedAt', 'name'].includes(sortRaw)
      ? (sortRaw as AgencySortBy)
      : 'createdAt';
    this.filterForm.patchValue(
      {
        search: q.get('search') ?? '',
        isActive: is === 'true' ? 'true' : is === 'false' ? 'false' : 'all',
        sortBy,
        sortOrder: q.get('sortOrder') === 'asc' ? 'asc' : 'desc',
        limit: Math.min(100, Math.max(1, Number(q.get('limit') ?? '20') || 20)),
      },
      { emitEvent: false }
    );
    this.page.set(Math.max(1, Number(q.get('page') ?? '1') || 1));
  }

  private applyResolved(data: AdminAgenciesResolved): void {
    this.applyResult(data.result);
    this.loadError.set(data.errorMessage);
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  private applyResult(r: ListAgenciesResult): void {
    this.agencies.set(r.agencies);
    this.total.set(r.total);
    this.page.set(r.page);
    this.totalPages.set(r.totalPages);
  }

  private fetchList(): void {
    const user = this.adminAuth.getCurrentAdminUser();
    if (!user?._id) {
      this.loadError.set('You must be signed in as an admin.');
      this.agencies.set([]);
      this.cdr.markForCheck();
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    const f = this.filterForm.getRawValue();
    const isActive = f.isActive === 'all' ? undefined : f.isActive === 'true';
    const lim = Math.min(100, Math.max(1, Number(f.limit) || 20));

    const q: ListAgenciesQuery = {
      createdBy: user._id,
      page: this.page(),
      limit: lim,
      isActive,
      search: f.search.trim() || undefined,
      sortBy: f.sortBy,
      sortOrder: f.sortOrder,
    };

    this.adminAgency.listAgencies(q).subscribe({
      next: (r) => {
        this.agencies.set(r.agencies);
        this.total.set(r.total);
        this.page.set(r.page);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.loadError.set(apiErrorSummary(err));
        this.agencies.set([]);
        this.cdr.markForCheck();
      },
    });
  }
}
