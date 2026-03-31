import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

type RowWithId = { id?: string };

type PropertyRowActionsContext = {
  onEdit: (id: string) => void;
};

@Component({
  selector: 'app-property-row-actions-cell',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button
      mat-icon-button
      type="button"
      aria-label="Row actions"
      [matMenuTriggerFor]="menu"
      (click)="$event.stopPropagation()"
    >
      <mat-icon>more_vert</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      <button mat-menu-item type="button" (click)="edit()">
        <mat-icon>edit</mat-icon>
        <span>Edit</span>
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyRowActionsCellRendererComponent
  implements ICellRendererAngularComp
{
  private params: ICellRendererParams<RowWithId, unknown> | null = null;

  agInit(params: ICellRendererParams<RowWithId, unknown>): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams<RowWithId, unknown>): boolean {
    this.params = params;
    return true;
  }

  edit(): void {
    const p = this.params;
    const id = (p?.data?.id ?? '').trim();
    if (!id) return;
    (p?.context as PropertyRowActionsContext | undefined)?.onEdit?.(id);
  }
}

