import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import {
  AppointmentsListComponent
} from '../../../appointments/components/appointments-list/appointments-list';
import { AppointmentListItem } from '../../../../core/models/appointment.models';

@Component({
  selector: 'app-appointments-table-card',
  standalone: true,
  imports: [SectionCardComponent, AppointmentsListComponent],
  templateUrl: './appointment-table-card.html',
  styleUrl: './appointment-table-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsTableCardComponent {
  private readonly router = inject(Router);

  readonly appointments = input.required<AppointmentListItem[]>();

  goToAppointments(): void {
    this.router.navigate(['/appointments']);
  }
}