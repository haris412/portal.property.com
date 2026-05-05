import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import type { ConfirmationDialogData } from './confirmation-dialog.models';

export type AlertDialogInput = Pick<ConfirmationDialogData, 'title' | 'message'> &
  Partial<Pick<ConfirmationDialogData, 'icon' | 'confirmLabel' | 'tone'>>;

const DEFAULT_CONFIG = {
  width: '420px',
  maxWidth: '92vw',
  autoFocus: 'first-tabbable',
} as const;

/**
 * Opens reusable Material confirmation dialogs. Returns `true` when the user confirms.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmationDialogData): Observable<boolean> {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      ...DEFAULT_CONFIG,
      data,
    });
    return ref.afterClosed().pipe(map((r) => r === true));
  }

  /** Single primary button (OK); closes without returning a meaningful boolean. */
  alert(input: AlertDialogInput): Observable<void> {
    const data: ConfirmationDialogData = {
      title: input.title,
      message: input.message,
      confirmLabel: input.confirmLabel ?? 'OK',
      tone: input.tone,
      icon: input.icon,
      alertOnly: true,
    };
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      ...DEFAULT_CONFIG,
      data,
    });
    return ref.afterClosed().pipe(map(() => undefined));
  }
}
