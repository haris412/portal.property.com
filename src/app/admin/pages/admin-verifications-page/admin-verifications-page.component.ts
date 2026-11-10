import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

import { PageHeaderComponent, PageHeaderAction } from '../../../shared/ui/page-header/page-header';
import { InfoBannerComponent } from '../../../shared/ui/info-banner/info-banner';
import { DataGridComponent } from '../../../shared/ui/data-grid/data-grid.component';
import {
  AgentVerificationService,
  IdentityStatus,
  VerificationListItem,
} from '../../../core/services/agent-verification.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';

const PILL =
  'display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.03em;';

function statusStyle(status: IdentityStatus | undefined): string {
  if (status === 'verified') {
    return PILL + 'background:color-mix(in srgb, var(--success) 15%, transparent);color:var(--success);';
  }
  if (status === 'rejected') {
    return PILL + 'background:color-mix(in srgb, var(--error) 14%, transparent);color:var(--error);';
  }
  return PILL + 'background:color-mix(in srgb, var(--warning) 16%, transparent);color:var(--warning);';
}

@Component({
  selector: 'app-admin-verifications-page',
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
  templateUrl: './admin-verifications-page.component.html',
  styleUrl: './admin-verifications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminVerificationsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AgentVerificationService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly rows = signal<VerificationListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  readonly headerActions: PageHeaderAction[] = [
    { id: 'refresh', label: 'Refresh', variant: 'stroked', icon: 'refresh' },
  ];

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: ['pending' as 'pending' | 'verified' | 'rejected' | 'all'],
  });

  readonly defaultColDef: ColDef<VerificationListItem> = {
    sortable: false,
    filter: false,
    resizable: true,
    flex: 1,
    minWidth: 110,
  };

  readonly columnDefs: ColDef<VerificationListItem>[] = [
    {
      colId: 'name',
      headerValueGetter: () => this.translate.instant('verification.admin.columns.name'),
      flex: 1.6,
      minWidth: 180,
      valueGetter: (params) => params.data?.displayName || '—',
    },
    {
      field: 'email',
      headerValueGetter: () => this.translate.instant('base.email'),
      minWidth: 180,
    },
    {
      field: 'phoneNumber',
      headerValueGetter: () => this.translate.instant('base.phone'),
      valueFormatter: (params: ValueFormatterParams<VerificationListItem>) =>
        params.value ? String(params.value) : '—',
    },
    {
      colId: 'agency',
      headerValueGetter: () => this.translate.instant('base.agency'),
      valueGetter: (params) => params.data?.agency?.name?.trim() || '—',
    },
    {
      colId: 'status',
      headerValueGetter: () => this.translate.instant('base.status'),
      width: 130,
      flex: 0,
      cellRenderer: (params: ICellRendererParams<VerificationListItem>) => {
        const el = document.createElement('span');
        const status = params.data?.status ?? 'pending';
        el.textContent = this.translate.instant(`verification.status.${status}`);
        el.style.cssText = statusStyle(status);
        return el;
      },
    },
    {
      colId: 'submittedAt',
      headerValueGetter: () => this.translate.instant('verification.admin.columns.submitted'),
      minWidth: 160,
      valueGetter: (params) => this.formatWhen(params.data?.submittedAt ?? null),
    },
  ];

  constructor() {
    this.headerActions[0].label = this.translate.instant('base.refresh');
    this.fetch();
    this.filterForm.valueChanges.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => {
      this.page.set(1);
      this.fetch();
    });
  }

  onHeaderAction(id: string): void {
    if (id === 'refresh') this.fetch();
  }

  openRow(row: VerificationListItem): void {
    void this.router.navigate([row.userId], { relativeTo: this.route });
  }

  goPrev(): void {
    if (this.page() <= 1) return;
    this.page.update((page) => page - 1);
    this.fetch();
  }

  goNext(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((page) => page + 1);
    this.fetch();
  }

  private fetch(): void {
    const { search, status } = this.filterForm.getRawValue();
    this.loading.set(true);
    this.loadError.set(null);
    this.api
      .list({
        status,
        search: search.trim(),
        page: this.page(),
        limit: 20,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.verifications ?? []);
          this.total.set(result.total ?? 0);
          this.totalPages.set(result.totalPages || 1);
          this.loading.set(false);
        },
        error: (error) => {
          this.rows.set([]);
          this.loadError.set(apiErrorSummary(error));
          this.loading.set(false);
        },
      });
  }

  private formatWhen(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  }
}
