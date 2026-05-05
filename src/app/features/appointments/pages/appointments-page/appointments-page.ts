import { Location, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, switchMap, take, tap } from 'rxjs/operators';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { SegmentedTabsComponent } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import { AppointmentsListComponent } from '../../components/appointments-list/appointments-list';
import { AppointmentListItem } from '../../../../core/models/appointment.models';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { ConfirmationDialogService } from '../../../../shared/dialogs/confirmation-dialog/confirmation-dialog.service';

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
    AppointmentsListComponent,
  ],
  templateUrl: './appointments-page.html',
  styleUrl: './appointments-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppointmentsPageComponent {
  private readonly auth = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);

  readonly viewerRole = input<AppointmentViewerRole>('agent');

  readonly activeTab = signal<AppointmentTab>('all');

  readonly appointments = signal<AppointmentListItem[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

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

  onConfirmClicked(item: AppointmentListItem): void {
    this.actionError.set(null);

    if (this.isAppointmentSlotInThePast(item)) {
      this.confirmationDialog
        .alert({
          title: 'Appointment expired',
          message:
            "This appointment's scheduled date and time have already passed, so it can no longer be confirmed. Please schedule a new appointment if you still need a visit.",
          confirmLabel: 'OK',
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.cdr.markForCheck();
        });
      return;
    }

    const href = this.buildVideoCallLink(item.id);
    this.appointmentsService
      .updateAppointmentStatus(item.id, 'Confirmed', href)
      .pipe(
        tap(() => {
          this.updateAppointment(item.id, { status: 'confirmed', appointmentLink: href });
        }),
        catchError(() => {
          this.actionError.set('Could not confirm appointment. Please try again.');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  /** True when the scheduled start is before “now” (same rules as list mapping). */
  private isAppointmentSlotInThePast(item: AppointmentListItem): boolean {
    const ms = item.scheduledStartMs;
    if (ms == null || Number.isNaN(ms)) {
      return false;
    }
    return Date.now() > ms;
  }

  private buildVideoCallLink(appointmentId: string): string {
    const origin = this.document.defaultView?.location?.origin ?? '';
    const tree = this.router.createUrlTree(['/video', appointmentId]);
    const path = this.location.prepareExternalUrl(this.router.serializeUrl(tree));
    return `${origin}${path}`;
  }

  rescheduleAppointment(id: string): void {
    this.updateAppointment(id, {
      isRescheduled: true,
      type: 'Rescheduled visit'
    });
  }

  cancelAppointment(item: AppointmentListItem): void {
    const next =
      item.status === 'confirmed' || item.status === 'in_progress'
        ? { api: 'Cancelled', ui: 'cancelled' as const }
        : item.status === 'pending'
          ? { api: 'Rejected', ui: 'rejected' as const }
          : { api: 'Cancelled', ui: 'cancelled' as const };

    this.actionError.set(null);
    this.appointmentsService
      .patchStatus(item.id, next.api)
      .pipe(
        tap(() => this.updateAppointment(item.id, { status: next.ui })),
        catchError(() => {
          this.actionError.set(`Could not ${next.ui} appointment. Please try again.`);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.cdr.markForCheck();
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
