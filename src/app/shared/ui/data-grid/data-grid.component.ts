import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  type ColDef,
  type GridApi,
  type GridOptions,
  type GridReadyEvent,
  type RowSelectionOptions,
} from 'ag-grid-community';

const DEFAULT_COL_DEF: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  flex: 1,
  minWidth: 120,
};

@Component({
  selector: 'app-data-grid',
  imports: [AgGridAngular],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'region',
    'aria-label': 'Data table',
  },
})
export class DataGridComponent<TData = unknown> {
  readonly rowData = input<TData[]>([]);
  readonly columnDefs = input<ColDef[]>([]);
  readonly defaultColDef = input<ColDef>({});
  readonly heightPx = input(480);
  readonly pagination = input(true);
  readonly paginationPageSize = input(25);
  readonly rowSelection = input<RowSelectionOptions['mode']>('singleRow');
  readonly gridOptionsInput = input<GridOptions>({});

  readonly rowClickedEvent = output<TData>();
  readonly gridReady = output<GridApi>();

  readonly gridOptions = computed<GridOptions>(() => ({
    rowHeight: 80,
    rowStyle: { maxHeight: '72px' },
    rowSelection: {
      mode: this.rowSelection(),
    },
    headerHeight: 56,
    pagination: this.pagination(),
    paginationPageSize: this.paginationPageSize(),
    suppressRowClickSelection: true,
    rowClassRules: {
      'clickable-row': () => true,
    },
    animateRows: true,
    suppressCellFocus: true,
    ...this.gridOptionsInput(),
  }));

  readonly mergedDefaultColDef = computed<ColDef>(() => ({
    ...DEFAULT_COL_DEF,
    ...this.defaultColDef(),
  }));

  onGridReady(event: GridReadyEvent): void {
    this.gridReady.emit(event.api);
  }

  onRowClicked(event: { data?: TData }): void {
    if (event.data !== undefined) {
      this.rowClickedEvent.emit(event.data);
    }
  }
}