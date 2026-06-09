import { isPlatformBrowser } from '@angular/common';

import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Observable, catchError, map, of, switchMap, take } from 'rxjs';

import { AuthService } from './auth.service';

import { SubscriptionSessionStorageService } from './subscription-session-storage.service';

import {

  SubscriptionsApiService,

  extractSubscriptionFromResponse,

  responseIndicatesExistingSubscription,

} from './subscriptions-api.service';

import type { Subscription } from '../models/subscription.models';

import {

  SubscriptionPlansDialogComponent,

  type SubscriptionPlansDialogData,

} from '../../shared/dialogs/subscription-plans-dialog/subscription-plans-dialog.component';

import { isAdminRole } from '../models/role.models';



@Injectable({ providedIn: 'root' })

export class SubscriptionPlansGateService {

  private readonly platformId = inject(PLATFORM_ID);

  private readonly auth = inject(AuthService);

  private readonly subscriptionsApi = inject(SubscriptionsApiService);

  private readonly subscriptionSession = inject(SubscriptionSessionStorageService);

  private readonly dialog = inject(MatDialog);



  private gateRanThisSession = false;



  /**

   * GET `/api/subscriptions` for the current user and persist the result in **localStorage**.

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

        if (!responseIndicatesExistingSubscription(body)) {

          this.subscriptionSession.clear();

        }

        return null;

      }),

      catchError(() => of(null)),

    );

  }



  /**

   * Opens the plan picker when no subscription is in localStorage.

   * Call {@link syncCurrentUserSubscription} first so storage is up to date.

   */

  tryOpenSubscriptionPlansIfNeeded(): void {

    if (!isPlatformBrowser(this.platformId) || this.gateRanThisSession) {

      return;

    }



    const user = this.auth.getCurrentUser();

    const roleName = primarySubscriptionRole(user?.roles);

    if (!user?._id || !roleName) {

      return;

    }



    if (user.roles.some((r) => isAdminRole(r))) {

      this.gateRanThisSession = true;

      return;

    }



    this.gateRanThisSession = true;



    const stored = this.subscriptionSession.getForUser(user._id, user.agencyId ?? null);

    if (stored) {

      return;

    }



    const data: SubscriptionPlansDialogData = { roleName };

    this.dialog

      .open(SubscriptionPlansDialogComponent, {

        width: 'min(1120px, 96vw)',

        maxWidth: '96vw',

        disableClose: true,

        autoFocus: 'first-heading',

        panelClass: 'subscription-plans-dialog-shell',

        data,

      })

      .afterClosed()

      .pipe(switchMap(() => this.syncCurrentUserSubscription()))

      .subscribe();

  }

}



/** First non-admin role for subscription-config lookup; falls back to first role. */

function primarySubscriptionRole(roles: string[] | undefined): string | undefined {

  const list = (roles ?? []).map((r) => r.trim()).filter(Boolean);

  const nonAdmin = list.find((r) => !isAdminRole(r));

  return nonAdmin ?? list[0];

}

