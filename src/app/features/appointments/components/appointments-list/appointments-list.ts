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
  readonly showAgentColumn = input(false);
  readonly currentUserId = input<string | null>(null);
  /** When true, actions are only allowed on appointments assigned to `currentUserId`. */
  readonly restrictActionsToOwnUser = input(false);
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

  getAgentName(item: AppointmentListItem): string {
    return item.agentName?.trim() || item.agent?.trim() || '—';
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

  canConfirmAppointment(item: AppointmentListItem): boolean {
    return this.canShowConfirmAction(item) && this.isOwnAppointment(item);
  }

  canCancelAppointment(item: AppointmentListItem): boolean {
    return this.canCancel(item) && this.isOwnAppointment(item);
  }

  confirmActionTitle(item: AppointmentListItem): string {
    return this.actionTitle(item, 'Confirm appointment', this.canConfirmAppointment(item));
  }

  cancelActionTitle(item: AppointmentListItem): string {
    return this.actionTitle(item, 'Cancel appointment', this.canCancelAppointment(item));
  }

  private isOwnAppointment(item: AppointmentListItem): boolean {
    if (!this.restrictActionsToOwnUser()) {
      return true;
    }
    const currentId = this.currentUserId()?.trim() ?? '';
    const assignedId = this.assignedUserId(item);
    return Boolean(currentId && assignedId && currentId === assignedId);
  }

  private actionTitle(
    item: AppointmentListItem,
    enabledLabel: string,
    canAct: boolean,
  ): string {
    if (canAct) {
      return enabledLabel;
    }
    if (this.restrictActionsToOwnUser()) {
      return 'Only the assigned agent can manage this appointment';
    }
    return enabledLabel;
  }

  private assignedUserId(item: AppointmentListItem): string {
    return item.assignedUserId?.trim() || item.user?._id?.trim() || '';
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
    if (!this.canConfirmAppointment(item)) {
      return;
    }
    this.confirmClicked.emit(item);
  }

  onReschedule(item: AppointmentListItem, event: Event): void {
    event.stopPropagation();
    this.rescheduleClicked.emit(item);
  }

  onCancel(item: AppointmentListItem, event: Event): void {
    event.stopPropagation();
    if (!this.canCancelAppointment(item)) {
      return;
    }
    this.cancelClicked.emit(item);
  }

  trackById(_: number, item: AppointmentListItem): string {
    return item.id;
  }
}