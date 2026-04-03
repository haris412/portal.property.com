import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Generic AG Grid “⋮” row actions cell. Reuse everywhere with {@link gridActionsColumnDef}
 * and pass `context: { menuItems: [...] }` ({@link GridRowMenuContext}) from the page
 * so each grid can define its own menu options.
 */
export interface GridRowMenuItem {
  label: string;
  /** Material icon ligature name, e.g. `edit`, `content_copy`. */
  icon: string;
  /** Receives row id from `data.id` or `data._id`. */
  action: (rowId: string) => void;
}

/**
 * Set on the grid’s `gridOptions.context` (or `[gridOptions]`) together with
 * {@link gridActionsColumnDef}.
 */
export interface GridRowMenuContext {
  menuItems: GridRowMenuItem[];
  /** Accessible label for the ⋮ trigger (default: `Row actions`). */
  menuTriggerAriaLabel?: string;
}

type RowData = { id?: string; _id?: string } | null | undefined;

function rowIdFromData(data: RowData): string {
  if (data == null) return '';
  const v = data.id ?? data._id;
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Standard pinned actions column using {@link GridRowMenuCellRendererComponent}.
 * Override width, `colId`, etc. via `overrides` when needed.
 */
export function gridActionsColumnDef<TData = unknown>(
  overrides: Partial<ColDef<TData>> = {}
): ColDef<TData> {
  return {
    colId: 'actions',
    headerName: '',
    width: 56,
    maxWidth: 72,
    flex: 0,
    pinned: 'right',
    sortable: false,
    filter: false,
    resizable: false,
    suppressMovable: true,
    cellRenderer: GridRowMenuCellRendererComponent,
    ...overrides,
  };
}

@Component({
  selector: 'app-grid-row-menu-cell',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button
      mat-icon-button
      type="button"
      [attr.aria-label]="triggerAriaLabel"
      [matMenuTriggerFor]="menu"
      (click)="$event.stopPropagation()"
    >
      <mat-icon>more_vert</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      @for (item of menuItems; track $index) {
        <button mat-menu-item type="button" (click)="run(item)">
          <mat-icon>{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridRowMenuCellRendererComponent implements ICellRendererAngularComp {
  private params: ICellRendererParams<RowData, unknown> | null = null;

  agInit(params: ICellRendererParams<RowData, unknown>): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams<RowData, unknown>): boolean {
    this.params = params;
    return true;
  }

  get triggerAriaLabel(): string {
    const ctx = this.params?.context as GridRowMenuContext | undefined;
    const custom = ctx?.menuTriggerAriaLabel?.trim();
    return custom && custom.length > 0 ? custom : 'Row actions';
  }

  get menuItems(): GridRowMenuItem[] {
    const ctx = this.params?.context as GridRowMenuContext | undefined;
    return ctx?.menuItems ?? [];
  }

  run(item: GridRowMenuItem): void {
    const id = rowIdFromData(this.params?.data);
    if (!id) return;
    item.action(id);
  }
}
