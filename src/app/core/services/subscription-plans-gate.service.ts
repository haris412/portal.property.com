import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, map, of, switchMap, take, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { SubscriptionSessionStorageService } from './subscription-session-storage.service';
import {
  SubscriptionsApiService,
  extractSubscriptionFromResponse,
  responseIndicatesExistingSubscription,
} from './subscriptions-api.service';
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

  private ranThisSession = false;

  tryOpenSubscriptionPlansIfNeeded(): void {
    if (!isPlatformBrowser(this.platformId) || this.ranThisSession) {
      return;
    }

    const user = this.auth.getCurrentUser();
    const roleName = primarySubscriptionRole(user?.roles);
    if (!user?._id || !roleName) {
      return;
    }

    if (user.roles.some((r) => isAdminRole(r))) {
      this.ranThisSession = true;
      return;
    }

    this.ranThisSession = true;

    this.subscriptionsApi
      .getSubscriptionsForUser(user._id, user.agencyId ?? undefined)
      .pipe(
        take(1),
        tap((body) => {
          const sub = extractSubscriptionFromResponse(body);
          if (sub) {
            this.subscriptionSession.write(sub);
          } else if (!responseIndicatesExistingSubscription(body)) {
            this.subscriptionSession.clear();
          }
        }),
        map((body) => responseIndicatesExistingSubscription(body)),
        catchError(() => of(true)),
        switchMap((hasSubscription) => {
          if (hasSubscription) {
            return of(undefined);
          }
          const data: SubscriptionPlansDialogData = {
            roleName,
          };
          return this.dialog
            .open(SubscriptionPlansDialogComponent, {
              width: 'min(1120px, 96vw)',
              maxWidth: '96vw',
              disableClose: true,
              autoFocus: 'first-heading',
              panelClass: 'subscription-plans-dialog-shell',
              data,
            })
            .afterClosed();
        })
      )
      .subscribe();
  }
}

/** First non-admin role for subscription-config lookup; falls back to first role. */
function primarySubscriptionRole(roles: string[] | undefined): string | undefined {
  const list = (roles ?? []).map((r) => r.trim()).filter(Boolean);
  const nonAdmin = list.find((r) => !isAdminRole(r));
  return nonAdmin ?? list[0];
}
