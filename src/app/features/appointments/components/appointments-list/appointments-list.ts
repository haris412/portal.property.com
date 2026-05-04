import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge';
import { AppointmentListItem } from '../../../../core/models/appointment.models';
import { AppointmentViewerRole } from '../../pages/appointments-page/appointments-page';


@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, MatIconModule],
  templateUrl: './appointments-list.html',
  styleUrl: './appointments-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsListComponent {
  readonly appointments = input.required<AppointmentListItem[]>();

  readonly viewerRole = input<AppointmentViewerRole>('agent');
  readonly showActions = input<boolean>(false);
  readonly showArrow = input<boolean>(false);
  readonly clickableRows = input<boolean>(false);

  readonly rowClicked = output<AppointmentListItem>();
  readonly confirmClicked = output<AppointmentListItem>();
  readonly rescheduleClicked = output<AppointmentListItem>();
  readonly cancelClicked = output<AppointmentListItem>();

  readonly personColumnLabel = computed(() => 'Client');

  getPersonName(item: AppointmentListItem): string {
    return (
      item.clientName ??
      [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ').trim()
    );
  }

  getPersonSubline(item: AppointmentListItem): string {
    const phone = item.clientPhoneNumber ?? item.phone;
    return `${phone}`;
  }

  getPropertyTitle(item: AppointmentListItem): string {
    return item.propertyObj?.listingTitle || item.propertyObj?.fullAddress || item.property;
  }

  getPropertySubline(item: AppointmentListItem): string {
    return item.propertyObj?.neighborhood || item.propertyObj?.city || item.area;
  }

  /** Video join icon: confirmed or active call, with a persisted link. */
  hasSavedVideoCallLink(item: AppointmentListItem): boolean {
    return (
      (item.status === 'confirmed' || item.status === 'in_progress') &&
      Boolean(item.appointmentLink?.trim())
    );
  }

  /** Confirm control shown for appointments that can still be confirmed. */
  canShowConfirmAction(item: AppointmentListItem): boolean {
    return (
      item.status !== 'completed' &&
      item.status !== 'confirmed' &&
      item.status !== 'in_progress' &&
      item.status !== 'cancelled' &&
      item.status !== 'rejected'
    );
  }

  canReschedule(item: AppointmentListItem): boolean {
    return (
      item.status !== 'completed' &&
      item.status !== 'in_progress' &&
      item.status !== 'cancelled' &&
      item.status !== 'rejected'
    );
  }

  canCancel(item: AppointmentListItem): boolean {
    return (
      item.status !== 'completed' &&
      item.status !== 'cancelled' &&
      item.status !== 'rejected'
    );
  }

  onRowClick(item: AppointmentListItem): void {
    if (!this.clickableRows()) {
      return;
    }

    this.rowClicked.emit(item);
  }

  onConfirm(item: AppointmentListItem, event: Event): void {
    event.stopPropagation();
    this.confirmClicked.emit(item);
  }

  onReschedule(item: AppointmentListItem, event: Event): void {
    event.stopPropagation();
    this.rescheduleClicked.emit(item);
  }

  onCancel(item: AppointmentListItem, event: Event): void {
    event.stopPropagation();
    this.cancelClicked.emit(item);
  }

  trackById(_: number, item: AppointmentListItem): string {
    return item.id;
  }
}