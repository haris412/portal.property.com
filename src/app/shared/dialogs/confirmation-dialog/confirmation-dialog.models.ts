/** Visual emphasis for the primary confirm action. */
export type ConfirmationDialogTone = 'default' | 'warn';

/**
 * Data passed into {@link ConfirmationDialogComponent} via `MAT_DIALOG_DATA`.
 * Reuse for delete, status changes, discard drafts, etc.
 */
export interface ConfirmationDialogData {
  title: string;
  message: string;
  /** Primary button (e.g. Delete, Deactivate, Confirm). */
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmationDialogTone;
  /** Optional Material icon ligature shown beside the title. */
  icon?: string;
}
