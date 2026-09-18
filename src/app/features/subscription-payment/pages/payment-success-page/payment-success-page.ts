import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, finalize, map, of, switchMap, takeWhile, timer } from 'rxjs';
import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';
import { PaymentsApiService, type PaymentRecord } from '../../../../core/services/payments-api.service';
import { SubscriptionPlansGateService } from '../../../../core/services/subscription-plans-gate.service';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { formatPkrAmount } from '../../../../core/utils/format-pkr';

type PageState = 'loading' | 'paid' | 'failed' | 'pending' | 'missing';

@Component({
  selector: 'app-payment-success-page',
  standalone: true,
  imports: [PageShellComponent, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './payment-success-page.html',
  styleUrl: './payment-success-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSuccessPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly subscriptionPlansGate = inject(SubscriptionPlansGateService);
  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<PageState>('loading');
  readonly payment = signal<PaymentRecord | null>(null);
  readonly amountLabel = signal('');
  readonly pollFinished = signal(false);

  constructor() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id')?.trim() ?? '';
    if (!sessionId) {
      this.state.set('missing');
      return;
    }

    let synced = false;
    timer(0, 1500)
      .pipe(
        switchMap(() =>
          this.paymentsApi.getPaymentBySession(sessionId).pipe(
            map((res) => res?.data?.payment ?? null),
            catchError(() => of(null)),
          ),
        ),
        takeWhile((payment, index) => {
          if (payment && payment.status !== 'Pending') {
            return false;
          }
          return index < 19;
        }, true),
        finalize(() => {
          this.pollFinished.set(true);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payment) => {
        this.payment.set(payment);
        if (!payment) {
          this.state.set('pending');
          return;
        }

        this.amountLabel.set(`${formatPkrAmount(payment.amount)} (${payment.subscriptionType})`);

        if (payment.status === 'Paid') {
          this.state.set('paid');
          if (!synced) {
            synced = true;
            this.subscriptionPlansGate.syncCurrentUserSubscription().subscribe(() => {
              this.dashboardService.requestRefresh();
            });
          }
          return;
        }

        if (payment.status === 'Failed' || payment.status === 'Cancelled') {
          this.state.set('failed');
          return;
        }

        this.state.set('pending');
      });
  }
}
