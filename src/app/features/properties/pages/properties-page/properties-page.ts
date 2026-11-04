import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { ColDef, GridApi, ICellRendererParams } from 'ag-grid-community';
import { finalize } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { AddListingService } from '../../../../core/services/add-listing.service';
import { apiErrorSummary } from '../../../../core/http/parse-http-api-error';
import {
  mapPropertyDocumentToGridRow,
  PROPERTIES_LIST_INITIAL_PAGE_SIZE,
  type PropertiesListResult,
  type PropertyListingRow,
} from '../../../../core/models/properties-list.model';
import { PageHeaderComponent, PageHeaderAction } from '../../../../shared/ui/page-header/page-header';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { DataGridComponent } from '../../../../shared/ui/data-grid/data-grid.component';
import { gridActionsColumnDef } from '../../../../shared/ui/grid-row-menu-cell/grid-row-menu-cell.component';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  SHARED_BATHROOM_OPTIONS,
  SHARED_KITCHEN_OPTIONS,
} from '../../../../core/models/shared-listing.model';
import {
  EMPTY_PROPERTIES_LIST_FILTERS,
  TENANT_PREFERENCE_FILTER_OPTIONS,
  propertiesListFiltersToQuery,
  propertiesListFiltersToQueryParams,
  readPropertiesListFilters,
  type ListingTypeFilter,
  type PropertiesListFilters,
} from '../../properties-filters';

const SHARED_BADGE_PILL =
  'display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;' +
  'background:color-mix(in srgb, var(--primary) 12%, transparent);color:var(--primary);';

function listingTypeCellRenderer(p: ICellRendererParams<PropertyListingRow>): HTMLElement {
  const el = document.createElement('span');
  const badge = p.data?.sharedBadge;
  if (badge) {
    el.textContent = badge;
    el.style.cssText = SHARED_BADGE_PILL;
  } else {
    el.textContent = (p.context?.wholeLabel as string | undefined) ?? 'Whole property';
    el.style.color = 'var(--font-secondary)';
  }
  return el;
}

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    SectionCardComponent,
    DataGridComponent,
    InfoBannerComponent,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './properties-page.html',
  styleUrl: './properties-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly addListing = inject(AddListingService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  readonly pageSize = PROPERTIES_LIST_INITIAL_PAGE_SIZE;

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly propertyRows = signal<PropertyListingRow[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly total = signal(0);
  readonly filters = signal<PropertiesListFilters>(EMPTY_PROPERTIES_LIST_FILTERS);

  readonly listingTypeOptions: readonly { value: ListingTypeFilter; labelKey: string }[] = [
    { value: 'any',    labelKey: 'properties.filters.any'    },
    { value: 'whole',  labelKey: 'properties.filters.whole'  },
    { value: 'shared', labelKey: 'properties.filters.shared' },
  ];
  readonly bathroomOptions         = SHARED_BATHROOM_OPTIONS;
  readonly kitchenOptions          = SHARED_KITCHEN_OPTIONS;
  readonly tenantPreferenceOptions = TENANT_PREFERENCE_FILTER_OPTIONS;

  headerActions: PageHeaderAction[] = [];
  propertyColumnDefs: ColDef<PropertyListingRow>[] = [];
  gridOptions: { context: { wholeLabel?: string; menuItems: { label: string; icon: string; action: (id: string) => void }[] } } = { context: { menuItems: [] } };

  private gridApi: GridApi | null = null;

  onGridReady(api: GridApi): void {
    this.gridApi = api;
  }

  ngOnInit(): void {
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.gridApi?.refreshHeader());

    const t = (key: string) => this.translate.instant(key) as string;

    this.headerActions = [
      { id: 'add-listing', label: t('properties.actions.addListing'), variant: 'flat', icon: 'add' },
    ];

    this.propertyColumnDefs = [
      { field: 'title',        headerValueGetter: () => t('properties.tc.title'),    flex: 2, minWidth: 160 },
      { field: 'city',         headerValueGetter: () => t('properties.tc.city') },
      { field: 'neighborhood', headerValueGetter: () => t('properties.tc.area') },
      { field: 'purpose',      headerValueGetter: () => t('properties.tc.purpose'),  width: 130 },
      { field: 'sharedBadge',  headerValueGetter: () => t('properties.tc.listingType'), width: 160, cellRenderer: listingTypeCellRenderer },
      { field: 'price',        headerValueGetter: () => t('properties.tc.price'),    width: 120 },
      { field: 'status',       headerValueGetter: () => t('properties.tc.status'),   width: 120 },
      { field: 'lister',       headerValueGetter: () => t('properties.tc.listedBy'), flex: 1, minWidth: 140 },
      gridActionsColumnDef<PropertyListingRow>({ width: 64, maxWidth: 72 }),
    ];

    this.gridOptions = {
      context: {
        wholeLabel: t('properties.filters.whole'),
        menuItems: [
          {
            label: t('properties.actions.edit'),
            icon: 'edit',
            action: (id: string) => { void this.router.navigate(['/add-listing', id]); },
          },
        ],
      },
    };

    this.filters.set(readPropertiesListFilters(this.route.snapshot.queryParamMap));

    const initial = this.route.snapshot.data['initialList'] as PropertiesListResult;
    this.applyListResult(initial);
  }

  onHeaderAction(actionId: string): void {
    if (actionId === 'add-listing') {
      void this.router.navigate(['/add-listing']);
    }
  }

  onListingTypeChange(listingType: ListingTypeFilter): void {
    // the shared-only filters would silently force isShared=true server-side, so drop them otherwise
    this.applyFilters(listingType === 'shared'
      ? { ...this.filters(), listingType }
      : { ...EMPTY_PROPERTIES_LIST_FILTERS, listingType });
  }

  onSharedFilterChange<K extends Exclude<keyof PropertiesListFilters, 'listingType'>>(key: K, value: PropertiesListFilters[K]): void {
    this.applyFilters({ ...this.filters(), [key]: value || null });
  }

  onMinRoomsChange(raw: string): void {
    const n = Number(raw);
    this.onSharedFilterChange('minRoomsAvailable', raw !== '' && Number.isInteger(n) && n >= 1 ? n : null);
  }

  clearFilters(): void {
    this.applyFilters(EMPTY_PROPERTIES_LIST_FILTERS);
  }

  private applyFilters(next: PropertiesListFilters): void {
    this.filters.set(next);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: propertiesListFiltersToQueryParams(next),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.loadPage(1);
  }

  goPrev(): void {
    const p = this.page();
    if (p > 1) this.loadPage(p - 1);
  }

  goNext(): void {
    const p = this.page();
    const max = this.totalPages();
    if (max > 0 && p < max) this.loadPage(p + 1);
  }

  private loadPage(pageIndex: number): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.addListing
      .getProperties({
        page: pageIndex,
        limit: this.pageSize,
        listedBy: this.auth.getUserId() ?? undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...propertiesListFiltersToQuery(this.filters()),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => this.applyListResult(res),
        error: (err: unknown) => {
          this.applyListResult({
            success: false,
            properties: [],
            count: 0,
            total: 0,
            page: 1,
            totalPages: 0,
            errorMessage: apiErrorSummary(err) || this.translate.instant('properties.messages.loadError') as string,
          });
        },
      });
  }

  private applyListResult(res: PropertiesListResult): void {
    if (res.errorMessage) {
      this.loadError.set(res.errorMessage);
      this.propertyRows.set([]);
      this.page.set(1);
      this.totalPages.set(0);
      this.total.set(0);
      return;
    }

    this.loadError.set(null);
    this.propertyRows.set(res.properties.map(mapPropertyDocumentToGridRow));
    this.page.set(res.page);
    this.totalPages.set(res.totalPages);
    this.total.set(res.total);
  }
}
