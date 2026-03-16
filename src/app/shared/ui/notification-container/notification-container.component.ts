import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './notification-container.component.html',
  styleUrl: './notification-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationContainerComponent {
  private readonly notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}

