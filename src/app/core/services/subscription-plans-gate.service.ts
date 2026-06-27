import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, catchError, map, of, switchMap, take } from 'rxjs';
import { AuthService } from './auth.service';
import { SubscriptionSessionStorageService } from './subscription-session-storage.service';
import {
  SubscriptionsApiService,
  extractSubscriptionFromResponse,
} from './subscriptions-api.service';
import type { Subscription } from '../models/subscription.models';
import {
  SubscriptionPlansDialogComponent,
  type SubscriptionPlansDialogData,
} from '../../shared/dialogs/subscription-plans-dialog/subscription-plans-dialog.component';
import { isAdminRole, isBuyerRole, isSubscriptionPlansGateExcluded } from '../models/role.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionPlansGateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly auth = inject(AuthService);
  private readonly subscriptionsApi = inject(SubscriptionsApiService);
  private readonly subscriptionSession = inject(SubscriptionSessionStorageService);
  private readonly dialog = inject(MatDialog);

  /**
   * GET `/api/subscriptions` for the current user and persist the result in **localStorage**.
   * Clears storage when the API has no subscription (including `{ subscription: null }`).
   */
  syncCurrentUserSubscription(): Observable<Subscription | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    const user = this.auth.getCurrentUser();
    if (!user?._id) {
      return of(null);
    }

    return this.subscriptionsApi.getSubscriptionsForUser(user._id, user.agencyId ?? undefined).pipe(
      take(1),
      map((body) => {
        const sub = extractSubscriptionFromResponse(body);
        if (sub) {
          this.subscriptionSession.write(sub);
          return sub;
        }
        this.subscriptionSession.clear();
        return null;
      }),
      catchError(() => {
        return of(null);
      }),
    );
  }

  /**
   * Syncs subscription from the API, then opens the plan picker when none exists.
   * Shown for all roles except **Admin** and **Buyer**.
   */
  runAfterProfileLoaded(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(undefined);
    }

    const user = this.auth.getCurrentUser();
    if (!user?._id) {
      return of(undefined);
    }

    if (isSubscriptionPlansGateExcluded(user.roles)) {
      return of(undefined);
    }

    const roleName = primarySubscriptionRole(user.roles);
    if (!roleName) {
      return of(undefined);
    }

    return this.syncCurrentUserSubscription().pipe(
      switchMap((sub) => {
        if (sub != null) {
          return of(undefined);
        }
        return this.openPlansDialog(roleName, true);
      }),
    );
  }

  /** @deprecated Use {@link runAfterProfileLoaded} — kept for layout call sites during transition. */
  tryOpenSubscriptionPlansIfNeeded(): void {
    this.runAfterProfileLoaded().subscribe();
  }

  openPlansDialogForCurrentUser(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(undefined);
    }

    const user = this.auth.getCurrentUser();
    if (!user?._id || isSubscriptionPlansGateExcluded(user.roles)) {
      return of(undefined);
    }

    const roleName = primarySubscriptionRole(user.roles);
    if (!roleName) {
      return of(undefined);
    }

    return this.openPlansDialog(roleName, true);
  }

  private openPlansDialog(roleName: string, disableClose: boolean): Observable<void> {
    const data: SubscriptionPlansDialogData = { roleName, canClose: !disableClose };
    return this.dialog
      .open(SubscriptionPlansDialogComponent, {
        width: 'min(1200px, 96vw)',
        height: '94vh',
        maxWidth: '96vw',
        maxHeight: '94vh',
        disableClose,
        autoFocus: false,
        panelClass: 'subscription-plans-dialog-shell',
        data,
      })
      .afterClosed()
      .pipe(switchMap(() => this.syncCurrentUserSubscription().pipe(map(() => undefined))));
  }
}

/** Role used to load subscription-config cards (first non-admin, non-buyer role). */
function primarySubscriptionRole(roles: string[] | undefined): string | undefined {
  const list = (roles ?? []).map((r) => r.trim()).filter(Boolean);
  return list.find((r) => !isAdminRole(r) && !isBuyerRole(r));
}
