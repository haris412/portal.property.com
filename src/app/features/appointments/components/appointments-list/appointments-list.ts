import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge';
import { AppointmentListItem } from '../../../../core/models/appointment.models';
import { AppointmentViewerRole } from '../../pages/appointments-page/appointments-page';


@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, MatIconModule],
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

  readonly personColumnLabel = computed(() =>
    this.viewerRole() === 'agent' ? 'Client' : 'Agent'
  );

  getPersonName(item: AppointmentListItem): string {
    return this.viewerRole() === 'agent' ? item.client ?? '' : item.agent ?? '';
  }

  getPersonSubline(item: AppointmentListItem): string {
    const phone =
      this.viewerRole() === 'agent'
        ? (item.clientPhone ?? item.phone)
        : (item.agentPhone ?? item.phone);
    return `${item.role} · ${phone}`;
  }

  canConfirm(item: AppointmentListItem): boolean {
    return this.viewerRole() === 'agent' && item.status === 'pending';
  }

  canReschedule(item: AppointmentListItem): boolean {
    return item.status !== 'completed' && item.status !== 'cancelled';
  }

  canCancel(item: AppointmentListItem): boolean {
    return item.status !== 'completed' && item.status !== 'cancelled';
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