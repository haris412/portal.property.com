import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getApps } from 'firebase/app';
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Unsubscribe,
} from 'firebase/messaging';

import { environment } from '../../../environments/environment';
import { AppNotificationsService } from './app-notifications.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class FirebaseMessagingService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appNotifications = inject(AppNotificationsService);
  private readonly notifications = inject(NotificationService);
  private registrationInProgress = false;
  private stopForegroundListener: Unsubscribe | null = null;
  private fcmToken: string | null = null;

  registerAfterLogin(): void {
    this.startMessaging(true);
  }

  resumeAfterSessionRestore(): void {
    this.startMessaging(false);
  }

  private startMessaging(requestPermission: boolean): void {
    if (this.registrationInProgress) return;
    this.registrationInProgress = true;

    void this.initializeMessaging(requestPermission)
      .catch((error: unknown) => {
        console.error('Firebase messaging initialization failed.', error);
      })
      .finally(() => {
        this.registrationInProgress = false;
      });
  }

  stopListening(): void {
    this.stopForegroundListener?.();
    this.stopForegroundListener = null;
  }

  unregisterOnLogout(accessToken: string): void {
    void this.unregisterToken(accessToken).catch((error: unknown) => {
      console.error('Firebase messaging token unregistration failed.', error);
    });
  }

  private async initializeMessaging(requestPermission: boolean): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !(await isSupported())) {
      return;
    }

    const app = getApps().find((firebaseApp) => firebaseApp.name === '[DEFAULT]');
    if (!app) return;

    const messaging = getMessaging(app);
    this.listenForForegroundMessages(messaging);

    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return;

    let permission = Notification.permission;
    if (permission === 'default' && requestPermission) {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return;

    if (!environment.firebase.messagingVapidKey) {
      console.error('Firebase messaging VAPID key is missing from the environment config.');
      return;
    }

    const serviceWorkerUrl = new URL(
      environment.firebase.messagingServiceWorkerUrl,
      window.location.origin,
    );
    const serviceWorkerRegistration = await navigator.serviceWorker.register(serviceWorkerUrl.href);
    await this.waitForActiveServiceWorker(serviceWorkerRegistration);
    const fcmToken = await getToken(messaging, {
      vapidKey: environment.firebase.messagingVapidKey,
      serviceWorkerRegistration,
    });
    if (!fcmToken) return;

    this.fcmToken = fcmToken;
    await firstValueFrom(
      this.http.post<void>('/notifications/register-token', {
        fcmToken,
        platform: 'web',
      }),
    );
  }

  private async unregisterToken(accessToken: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !(await isSupported())) return;

    const fcmToken = this.fcmToken ?? (await this.getCurrentToken());
    if (!fcmToken) return;

    await firstValueFrom(
      this.http.post<void>(
        '/notifications/unregister-token',
        { fcmToken, platform: 'web' },
        { headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }) },
      ),
    );
    this.fcmToken = null;
  }

  private async getCurrentToken(): Promise<string | null> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
    if (!('serviceWorker' in navigator) || !environment.firebase.messagingVapidKey) return null;

    const app = getApps().find((firebaseApp) => firebaseApp.name === '[DEFAULT]');
    if (!app) return null;

    const serviceWorkerUrl = new URL(
      environment.firebase.messagingServiceWorkerUrl,
      window.location.origin,
    );
    const serviceWorkerScope = new URL('.', serviceWorkerUrl).href;
    const serviceWorkerRegistration =
      await navigator.serviceWorker.getRegistration(serviceWorkerScope);
    if (!serviceWorkerRegistration) return null;
    await this.waitForActiveServiceWorker(serviceWorkerRegistration);

    const token = await getToken(getMessaging(app), {
      vapidKey: environment.firebase.messagingVapidKey,
      serviceWorkerRegistration,
    });
    this.fcmToken = token || null;
    return this.fcmToken;
  }

  private waitForActiveServiceWorker(
    registration: ServiceWorkerRegistration,
  ): Promise<void> {
    if (registration.active) return Promise.resolve();

    const worker = registration.installing ?? registration.waiting;
    if (!worker) {
      return Promise.reject(new Error('Firebase messaging service worker has no active worker.'));
    }

    return new Promise<void>((resolve, reject) => {
      const onStateChange = (): void => {
        if (registration.active) {
          worker.removeEventListener('statechange', onStateChange);
          resolve();
        } else if (worker.state === 'redundant') {
          worker.removeEventListener('statechange', onStateChange);
          reject(new Error('Firebase messaging service worker failed to activate.'));
        }
      };

      worker.addEventListener('statechange', onStateChange);
      onStateChange();
    });
  }

  private listenForForegroundMessages(messaging: ReturnType<typeof getMessaging>): void {
    if (this.stopForegroundListener) return;

    this.stopForegroundListener = onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? payload.data?.['title'];
      const body = payload.notification?.body ?? payload.data?.['body'];
      const message = [title, body].filter(Boolean).join(': ') || 'You have a new notification.';
      this.notifications.info(message, 8000);
      this.appNotifications.load(true).subscribe({ error: () => {} });
      this.appNotifications.refreshUnreadCount().subscribe({ error: () => {} });
    });
  }
}
