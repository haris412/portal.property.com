import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { SegmentedTabsComponent } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import {
  AppointmentsListComponent
} from '../../components/appointments-list/appointments-list';
import { AppointmentListItem } from '../../../../core/models/appointment.models';

export type AppointmentTab = 'all' | 'confirmed' | 'pending' | 'completed';
export type AppointmentViewerRole = 'agent' | 'user';

interface SegmentedTabItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-appointments-page',
  standalone: true,
  imports: [
    SectionCardComponent,
    SegmentedTabsComponent,
    AppointmentsListComponent
  ],
  templateUrl: './appointments-page.html',
  styleUrl: './appointments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsPageComponent {
  readonly viewerRole = input<AppointmentViewerRole>('agent');

  readonly activeTab = signal<AppointmentTab>('all');

  readonly appointments = signal<AppointmentListItem[]>([
    {
      id: 'appt-1',
      property: '1200 Skyline Boulevard, Apt 4B',
      area: 'Downtown Seattle',
      date: '12 Mar 2026',
      type: 'Property viewing',
      client: 'Emma Johnson',
      agent: 'Michael Carter',
      role: 'Buyer',
      phone: '+1 (206) 555-4812',
      time: '10:30 AM',
      status: 'confirmed'
    },
    {
      id: 'appt-2',
      property: '88 Harbor View Residence',
      area: 'Waterfront District',
      date: '13 Mar 2026',
      type: 'Rental inspection',
      client: 'Daniel Lee',
      agent: 'Sophia Adams',
      role: 'Tenant',
      phone: '+1 (425) 555-7740',
      time: '1:00 PM',
      status: 'pending'
    },
    {
      id: 'appt-3',
      property: 'Maple Grove Family House',
      area: 'Bellevue Heights',
      date: '14 Mar 2026',
      type: 'Final walkthrough',
      client: 'Sophia Carter',
      agent: 'Olivia Brooks',
      role: 'Buyer',
      phone: '+1 (360) 555-9021',
      time: '4:15 PM',
      status: 'completed'
    },
    {
      id: 'appt-4',
      property: 'Lakeview Park Townhomes',
      area: 'North Creek',
      date: '15 Mar 2026',
      type: 'Property viewing',
      client: 'Carlos Rivera',
      agent: 'Rachel Green',
      role: 'Buyer',
      phone: '+1 (509) 555-4481',
      time: '11:45 AM',
      status: 'pending'
    }
  ]);

  readonly tabs = computed<SegmentedTabItem[]>(() => {
    const items = this.appointments();
    const confirmedCount = items.filter(item => item.status === 'confirmed').length;
    const pendingCount = items.filter(item => item.status === 'pending').length;
    const completedCount = items.filter(item => item.status === 'completed').length;

    return [
      { key: 'all', label: `All (${items.length})` },
      { key: 'confirmed', label: `Confirmed (${confirmedCount})` },
      { key: 'pending', label: `Pending (${pendingCount})` },
      { key: 'completed', label: `Completed (${completedCount})` }
    ];
  });

  readonly filteredAppointments = computed(() => {
    const active = this.activeTab();
    const items = this.appointments();

    if (active === 'all') {
      return items;
    }

    return items.filter(item => item.status === active);
  });

  onTabChanged(tab: string): void {
    this.activeTab.set(tab as AppointmentTab);
  }

  confirmAppointment(id: string): void {
    this.updateAppointment(id, {
      status: 'confirmed'
    });
  }

  rescheduleAppointment(id: string): void {
    this.updateAppointment(id, {
      isRescheduled: true,
      type: 'Rescheduled visit'
    });
  }

  cancelAppointment(id: string): void {
    this.updateAppointment(id, {
      status: 'cancelled'
    });
  }

  private updateAppointment(
    id: string,
    changes: Partial<AppointmentListItem>
  ): void {
    this.appointments.update(items =>
      items.map(item =>
        item.id === id
          ? {
            ...item,
            ...changes
          }
          : item
      )
    );
  }
}