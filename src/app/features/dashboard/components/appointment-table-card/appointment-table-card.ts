import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button';
import { StatusBadgeComponent } from '../../../../shared/ui/status-badge/status-badge';
import { AppointmentItem } from '../../dashboard.mock';

@Component({
  selector: 'app-appointments-table-card',
  standalone: true,
  imports: [SectionCardComponent, ActionButtonComponent, StatusBadgeComponent, MatIconModule],
  templateUrl: './appointment-table-card.html',
  styleUrl: './appointment-table-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsTableCardComponent {
  private readonly router = inject(Router);

  readonly appointments = input.required<AppointmentItem[]>();

  goToAppointments(): void {
    this.router.navigate(['/appointments']);
  }
}