import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { Subscription } from '../models/subscription.models';

const STORAGE_KEY = 'subscriptionPlan';

@Injectable({ providedIn: 'root' })
export class SubscriptionSessionStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private store(): Storage | null {
    return isPlatformBrowser(this.platformId) ? sessionStorage : null;
  }

  read(): Subscription | null {
    const raw = this.store()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const v = JSON.parse(raw) as Subscription;
      return v;
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
