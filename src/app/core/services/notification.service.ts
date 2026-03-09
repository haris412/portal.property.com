import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly DEFAULT_DURATION = 4000;
  notifications = signal<Notification[]>([]);

  show(message: string, type: NotificationType = 'info', duration = this.DEFAULT_DURATION): void {
    const notification: Notification = {
      id: crypto.randomUUID(),
      type,
      message,
      duration,
    };

    this.notifications.update((list) => [...list, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(notification.id), duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  remove(id: string): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  clear(): void {
    this.notifications.set([]);
  }
}
