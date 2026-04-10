import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AppointmentStatus } from '../../../core/models/appointment.models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  readonly status = input.required<AppointmentStatus>();

  readonly label = computed(() => {
    const status = this.status();

    if (status === 'confirmed') return 'Confirmed';
    if (status === 'pending') return 'Pending';
    if (status === 'completed') return 'Completed';
    if (status === 'rejected') return 'Rejected';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'rescheduled') return 'Rescheduled';

    return status;
  });
}