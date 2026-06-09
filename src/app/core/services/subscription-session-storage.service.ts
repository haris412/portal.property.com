import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { Subscription } from '../models/subscription.models';

const STORAGE_KEY = 'subscriptionPlan';
/** Legacy key from an earlier sessionStorage implementation. */
const LEGACY_SESSION_KEY = 'subscriptionPlan';

@Injectable({ providedIn: 'root' })
export class SubscriptionSessionStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private store(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  read(): Subscription | null {
    const storage = this.store();
    if (!storage) {
      return null;
    }

    let raw = storage.getItem(STORAGE_KEY);
    if (!raw && isPlatformBrowser(this.platformId)) {
      const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
      if (legacy) {
        storage.setItem(STORAGE_KEY, legacy);
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
        raw = legacy;
      }
    }

    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as Subscription;
    } catch {
      return null;
    }
  }

  getForUser(userId: string, agencyId: string | null | undefined): Subscription | null {
    const sub = this.read();
    if (!sub?.userId || sub.userId !== userId) return null;
    const want = agencyId?.trim() ? agencyId.trim() : null;
    const got =
      sub.agencyId == null || String(sub.agencyId).trim() === ''
        ? null
        : String(sub.agencyId).trim();
    if (want !== got) return null;
    return sub;
  }

  write(subscription: Subscription): void {
    this.store()?.setItem(STORAGE_KEY, JSON.stringify(subscription));
  }

  clear(): void {
    this.store()?.removeItem(STORAGE_KEY);
  }
}
