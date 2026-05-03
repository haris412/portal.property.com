import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter, switchMap, take } from 'rxjs';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';
import { PageHeaderComponent, type PageHeaderAction } from '../../../../shared/ui/page-header/page-header';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { AlertCardComponent } from '../../components/alert-card/alert-card.component';
import {
  AlertFormDialogComponent,
  type AlertFormDialogData,
} from '../../dialogs/alert-form-dialog/alert-form-dialog.component';
import type { PropertyAlert } from '../../../../core/models/alert.models';

@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    InfoBannerComponent,
    AlertCardComponent,
  ],
  templateUrl: './alerts-page.component.html',
  styleUrl: './alerts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsPageComponent {
  private readonly alertSvc = inject(AlertService);
  private readonly dialog   = inject(MatDialog);
  private readonly confirm  = inject(ConfirmationDialogService);
  private readonly notify   = inject(NotificationService);

  readonly alerts    = this.alertSvc.alerts;
  readonly loading   = this.alertSvc.loading;
  readonly loadError = this.alertSvc.loadError;

  readonly headerActions: PageHeaderAction[] = [
    { id: 'new-alert', label: 'New Alert', variant: 'flat', icon: 'add' },
  ];

  constructor() {
    this.alertSvc.loadMine().pipe(take(1)).subscribe();
  }

  onHeaderAction(id: string): void {
    if (id === 'new-alert') this.openForm();
  }

  openForm(alert?: PropertyAlert): void {
    const data: AlertFormDialogData = { alert };
    this.dialog
      .open(AlertFormDialogComponent, {
        data,
        width: '540px',
        maxWidth: '96vw',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .pipe(take(1), filter(Boolean))
      .subscribe(() => {
        this.notify.success(alert ? 'Alert updated.' : 'Alert created.');
      });
  }

  onToggle(alert: PropertyAlert): void {
    this.alertSvc.toggle(alert._id, !alert.isActive).pipe(take(1)).subscribe({
      next: () => this.notify.success(alert.isActive ? 'Alert paused.' : 'Alert activated.'),
      error: (err: unknown) =>
        this.notify.error((err instanceof Error) ? err.message : 'Could not update alert'),
    });
  }

  onDelete(alert: PropertyAlert): void {
    this.confirm
      .confirm({
        title:        'Delete alert?',
        message:      'This alert will be permanently removed.',
        confirmLabel: 'Delete',
        cancelLabel:  'Cancel',
        tone:         'warn',
        icon:         'delete_outline',
      })
      .pipe(
        take(1),
        filter(Boolean),
        switchMap(() => this.alertSvc.remove(alert._id))
      )
      .subscribe({
        next: () => this.notify.success('Alert deleted.'),
        error: (err: unknown) =>
          this.notify.error((err instanceof Error) ? err.message : 'Could not delete alert'),
      });
  }
}
