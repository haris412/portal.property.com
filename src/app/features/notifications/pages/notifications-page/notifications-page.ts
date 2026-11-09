import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { AppNotificationsService } from '../../../../core/services/app-notifications.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';

type NotificationFilter = 'all' | 'unread';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, MatIconModule, PageShellComponent],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  private readonly notificationService = inject(AppNotificationsService);
  private readonly toastNotifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = this.notificationService.items;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly filter = signal<NotificationFilter>('all');
  readonly loading = signal(true);
  readonly markingAllRead = signal(false);
  readonly markingNotificationIds = signal<ReadonlySet<string>>(new Set());
  readonly loadError = signal(false);
  readonly visibleItems = computed(() => {
    const items = this.items();
    return this.filter() === 'unread' ? items.filter((item) => !item.isRead) : items;
  });

  constructor() {
    this.loadNotifications(true);
  }

  setFilter(filter: NotificationFilter): void {
    this.filter.set(filter);
  }

  refresh(): void {
    this.loadNotifications(true);
  }

  markAllRead(): void {
    if (this.markingAllRead() || this.unreadCount() === 0) return;

    this.markingAllRead.set(true);
    this.notificationService.markAllRead()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.markingAllRead.set(false)),
      )
      .subscribe({
        error: () => this.toastNotifications.error('Could not mark notifications as read.'),
      });
  }

  markNotificationRead(id: string): void {
    if (this.markingAllRead() || this.markingNotificationIds().has(id)) return;

    this.markingNotificationIds.update((ids) => new Set(ids).add(id));
    this.notificationService.markRead(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.markingNotificationIds.update((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        })),
      )
      .subscribe({
        error: () => this.toastNotifications.error('Could not mark notification as read.'),
      });
  }

  private loadNotifications(force = false): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.notificationService.refreshUnreadCount().subscribe({ error: () => {} });

    this.notificationService.load(force)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        error: () => this.loadError.set(true),
      });
  }
}