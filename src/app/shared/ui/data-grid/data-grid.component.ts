import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';

const DEFAULT_COL_DEF: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  flex: 1,
  minWidth: 120,
};

/**
 * Thin wrapper around AG Grid Community for consistent sizing, defaults, and module setup.
 * Register `AllCommunityModule` once in `app.config.ts` (already done).
 *
 * For a reusable ⋮ row menu, use `GridRowMenuCellRendererComponent` and `gridActionsColumnDef`
 * from `../grid-row-menu-cell/` (pass the component as `cellRenderer` — do not add it here; AG Grid
 * loads it dynamically, so it is not a template import).
 */
@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGridComponent<TData = unknown> {
  /** Table rows (replace with API data later). */
  readonly rowData = input<TData[]>([]);

  readonly columnDefs = input<ColDef<TData>[]>([]);

  /** Merged over {@link DEFAULT_COL_DEF}; pass `{}` to use defaults only. */
  readonly defaultColDef = input<ColDef<TData>>({});

  /** Total height of the grid including header (px). */
  readonly heightPx = input(480);

  readonly pagination = input(true);

  readonly paginationPageSize = input(25);

  /** Extra grid options; avoid setting `rowData` / `columnDefs` here — use inputs instead. */
  readonly gridOptions = input<GridOptions<TData>>({});

  readonly gridReady = output<GridApi<TData>>();

  readonly mergedDefaultColDef = computed(
    (): ColDef<TData> =>
      ({
        ...DEFAULT_COL_DEF,
        ...this.defaultColDef(),
      }) as ColDef<TData>
  );

  readonly mergedGridOptions = computed((): GridOptions<TData> => ({
    animateRows: true,
    suppressCellFocus: true,
    ...this.gridOptions(),
  }));

  onGridReady(event: GridReadyEvent<TData>): void {
    this.gridReady.emit(event.api);
  }
}
