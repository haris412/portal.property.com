import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, finalize, switchMap, take } from 'rxjs/operators';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { SegmentedTabsComponent } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import { AppointmentsListComponent } from '../../components/appointments-list/appointments-list';
import { AppointmentListItem } from '../../../../core/models/appointment.models';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { AuthService, User } from '../../../../core/services/auth.service';

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
  private readonly auth = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly viewerRole = input<AppointmentViewerRole>('agent');

  readonly activeTab = signal<AppointmentTab>('all');

  readonly appointments = signal<AppointmentListItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly tabs = computed<SegmentedTabItem[]>(() => {
    const items = this.appointments();
    const confirmedCount = items.filter((item) => item.status === 'confirmed').length;
    const pendingCount = items.filter((item) => item.status === 'pending').length;
    const completedCount = items.filter((item) => item.status === 'completed').length;

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

    return items.filter((item) => item.status === active);
  });

  constructor() {
    this.auth.currentUser$
      .pipe(
        take(1),
        switchMap((user) => this.fetchForUser(user)),
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => {
        this.appointments.set(items);
        this.cdr.markForCheck();
      });
  }

  private fetchForUser(user: User | null) {
    this.loading.set(true);
    this.loadError.set(null);

    if (!user?._id) {
      this.loadError.set('Sign in to view your appointments.');
      return of([] as AppointmentListItem[]);
    }

    return this.appointmentsService.getByUserId(user._id).pipe(
      catchError(() => {
        this.loadError.set('Could not load appointments. Please try again later.');
        return of([]);
      })
    );
  }

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

  private updateAppointment(id: string, changes: Partial<AppointmentListItem>): void {
    this.appointments.update((items) =>
      items.map((item) =>
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
