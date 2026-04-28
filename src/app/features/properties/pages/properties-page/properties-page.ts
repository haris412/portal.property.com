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
import type { ColDef, GridApi } from 'ag-grid-community';
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

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    SectionCardComponent,
    DataGridComponent,
    InfoBannerComponent,
    TranslateModule,
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

  headerActions: PageHeaderAction[] = [];
  propertyColumnDefs: ColDef<PropertyListingRow>[] = [];
  gridOptions: { context: { menuItems: { label: string; icon: string; action: (id: string) => void }[] } } = { context: { menuItems: [] } };

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
      { field: 'price',        headerValueGetter: () => t('properties.tc.price'),    width: 120 },
      { field: 'status',       headerValueGetter: () => t('properties.tc.status'),   width: 120 },
      { field: 'lister',       headerValueGetter: () => t('properties.tc.listedBy'), flex: 1, minWidth: 140 },
      gridActionsColumnDef<PropertyListingRow>({ width: 64, maxWidth: 72 }),
    ];

    this.gridOptions = {
      context: {
        menuItems: [
          {
            label: t('properties.actions.edit'),
            icon: 'edit',
            action: (id: string) => { void this.router.navigate(['/add-listing', id]); },
          },
        ],
      },
    };

    const initial = this.route.snapshot.data['initialList'] as PropertiesListResult;
    this.applyListResult(initial);
  }

  onHeaderAction(actionId: string): void {
    if (actionId === 'add-listing') {
      void this.router.navigate(['/add-listing']);
    }
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
