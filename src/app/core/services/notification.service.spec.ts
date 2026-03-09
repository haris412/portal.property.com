import { TestBed } from '@angular/core/testing';
import { vi, afterEach } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NotificationService] });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty notifications', () => {
    expect(service.notifications()).toEqual([]);
  });

  it('should add a notification with show()', () => {
    service.show('Test message', 'info', 0);
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].message).toBe('Test message');
    expect(service.notifications()[0].type).toBe('info');
  });

  it('should add a success notification', () => {
    service.success('Success!', 0);
    const notifications = service.notifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('success');
  });

  it('should add an error notification', () => {
    service.error('Error occurred!', 0);
    expect(service.notifications()[0].type).toBe('error');
  });

  it('should add a warning notification', () => {
    service.warning('Caution!', 0);
    expect(service.notifications()[0].type).toBe('warning');
  });

  it('should remove a notification by id', () => {
    service.show('First', 'info', 0);
    service.show('Second', 'success', 0);
    const id = service.notifications()[0].id;

    service.remove(id);

    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].message).toBe('Second');
  });

  it('should clear all notifications', () => {
    service.show('A', 'info', 0);
    service.show('B', 'error', 0);

    service.clear();

    expect(service.notifications()).toEqual([]);
  });

  it('should auto-remove notification after duration', () => {
    vi.useFakeTimers();
    try {
      service.show('Auto remove', 'info', 500);
      expect(service.notifications().length).toBe(1);
      vi.advanceTimersByTime(600);
      expect(service.notifications().length).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should assign unique ids to notifications', () => {
    service.show('A', 'info', 0);
    service.show('B', 'info', 0);
    const ids = service.notifications().map((n) => n.id);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
