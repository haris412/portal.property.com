import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  readonly status = input.required<'confirmed' | 'pending' | 'rescheduled'>();

  readonly label = computed(() => {
    const status = this.status();

    if (status === 'confirmed') return 'Confirmed';
    if (status === 'pending') return 'Pending';
    return 'Rescheduled';
  });
}