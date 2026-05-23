import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'smartTime', standalone: true })
export class SmartTimePipe implements PipeTransform {
  transform(value: Date | string | null | undefined): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMin < 60) {
      return diffMin <= 0 ? 'Just now' : `${diffMin} min ago`;
    }

    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    if (diffMin < 60 * 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
