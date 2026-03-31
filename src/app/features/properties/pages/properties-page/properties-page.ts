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
import type { ColDef } from 'ag-grid-community';
import { finalize } from 'rxjs/operators';
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
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    SectionCardComponent,
    DataGridComponent,
    InfoBannerComponent,
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

  readonly pageSize = PROPERTIES_LIST_INITIAL_PAGE_SIZE;

  readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'add-listing', label: 'Add listing', variant: 'flat', icon: 'add' },
  ];

  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly propertyRows = signal<PropertyListingRow[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly total = signal(0);

  readonly propertyColumnDefs: ColDef<PropertyListingRow>[] = [
    { field: 'title', headerName: 'Title', flex: 2, minWidth: 160 },
    { field: 'city', headerName: 'City' },
    { field: 'neighborhood', headerName: 'Area' },
    { field: 'purpose', headerName: 'Purpose', width: 130 },
    { field: 'price', headerName: 'Price', width: 120 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'lister', headerName: 'Listed by', flex: 1, minWidth: 140 },
  ];

  ngOnInit(): void {
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
            errorMessage: apiErrorSummary(err) || 'Could not load properties.',
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
