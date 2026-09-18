import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { SubscriptionConfigService } from '../../../core/services/subscription-config.service';
import {
  SubscriptionsApiService,
  extractSubscriptionFromResponse,
  extractSubscriptionFromSuccessResponse,
} from '../../../core/services/subscriptions-api.service';
import { SubscriptionSessionStorageService } from '../../../core/services/subscription-session-storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { toSubscriptionConfigRoleName } from '../../../core/models/role.models';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';
import type {
  Subscription,
  SubscriptionConfig,
  SubscriptionConfigListDto,
  SubscriptionCreateDTO,
  SubscriptionType,
} from '../../../core/interfaces/subscription.models';
import type { ResponseModel } from '../../../core/models/response.model';
import { NotificationService } from '../../../core/services/notification.service';
import { DashboardService } from '../../../features/dashboard/services/dashboard.service';
import { PaymentsApiService, type CheckoutMethod, type CheckoutMethodId } from '../../../core/services/payments-api.service';
import { formatPkrAmount } from '../../../core/utils/format-pkr';

export interface SubscriptionPlansDialogData {
  roleName: string;
  canClose?: boolean;
}

export interface PlanCardViewModel {
  id: 'free' | 'monthly' | 'annual';
  subscriptionType: SubscriptionType;
  title: string;
  subtitle: string;
  icon: string;
  priceDisplay: string;
  billingLabel: string;
  emphasis: boolean;
  lines: string[];
  numberOfFeatureListing: number;
  numberOfAgentVisibility: number;
  isCurrentPlan: boolean;
}

@Component({
  selector: 'app-subscription-plans-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './subscription-plans-dialog.component.html',
  styleUrl: './subscription-plans-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPlansDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SubscriptionPlansDialogComponent>);
  private readonly subscriptionConfigApi = inject(SubscriptionConfigService);
  private readonly subscriptionsApi = inject(SubscriptionsApiService);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly subscriptionSession = inject(SubscriptionSessionStorageService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly data = inject<SubscriptionPlansDialogData>(MAT_DIALOG_DATA);

  loading = true;
  loadError: string | null = null;
  cards: PlanCardViewModel[] = [];
  submittingCardId: PlanCardViewModel['id'] | null = null;
  selectedCardId: PlanCardViewModel['id'] | null = null;
  checkoutMethods: CheckoutMethod[] = [
    { id: 'card', label: 'Card', provider: 'stripe', enabled: false },
    { id: 'jazzcash', label: 'JazzCash', provider: 'paymob', enabled: false },
    { id: 'easypaisa', label: 'EasyPaisa', provider: 'paymob', enabled: false },
  ];
  showPaymentMethods = false;
  submittingMethodId: CheckoutMethodId | null = null;
  private currentPlanType: SubscriptionType | null = null;

  constructor() {
    this.loadPlans();
    this.loadCheckoutMethods();
  }

  retryLoad(): void {
    this.loadPlans();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  canShowClose(): boolean {
    return this.data.canClose === true || this.selectedCardId !== null || this.cards.some((card) => card.isCurrentPlan);
  }

  ctaLabel(card: PlanCardViewModel): string {
    if (card.isCurrentPlan) {
      return 'Current plan';
    }
    if (this.isFreeLocked(card)) {
      return 'Unavailable';
    }
    if (this.submittingCardId === card.id || this.submittingMethodId) {
      return card.subscriptionType === 'Free' ? 'Saving...' : 'Redirecting...';
    }
    if (this.selectedCardId === card.id) {
      if (card.subscriptionType !== 'Free' && this.showPaymentMethods) {
        return 'Choose a payment method';
      }
      return card.subscriptionType === 'Free' ? 'Confirm subscription' : 'Continue to payment';
    }
    return 'Select plan';
  }

  isPlanActionDisabled(card: PlanCardViewModel): boolean {
    return this.submittingCardId !== null || card.isCurrentPlan || this.isFreeLocked(card);
  }

  isFreeLocked(card: PlanCardViewModel): boolean {
    return card.subscriptionType === 'Free' && this.hasPaidPlan();
  }

  hasPaidPlan(): boolean {
    return this.currentPlanType === 'Monthly' || this.currentPlanType === 'Annual';
  }

  subscribePlan(card: PlanCardViewModel): void {
    if (this.isFreeLocked(card)) {
      this.notifications.error('You already have a paid plan and cannot switch to Free.');
      return;
    }

    if (this.selectedCardId !== card.id) {
      this.selectedCardId = card.id;
      this.showPaymentMethods = false;
      this.cdr.markForCheck();
      return;
    }

    const user = this.auth.getCurrentUser();
    if (!user?._id?.trim()) {
      this.notifications.error('You must be signed in to subscribe.');
      return;
    }

    if (card.subscriptionType === 'Monthly' || card.subscriptionType === 'Annual') {
      const enabled = this.checkoutMethods.filter((method) => method.enabled);
      if (enabled.length === 1) {
        this.startPaidCheckout(card, enabled[0].id);
        return;
      }
      this.showPaymentMethods = true;
      this.cdr.markForCheck();
      return;
    }

    const agencyId = user.agencyId?.trim() ? user.agencyId.trim() : null;
    const body: SubscriptionCreateDTO = {
      userId: user._id.trim(),
      agencyId,
      subscriptionType: card.subscriptionType,
      numberOfFeatureListing: card.numberOfFeatureListing,
      numberOfAgentVisibility: card.numberOfAgentVisibility,
      subscriptionDate: new Date().toISOString(),
    };

    this.submittingCardId = card.id;
    this.cdr.markForCheck();

    this.subscriptionsApi
      .createSubscription(body)
      .pipe(
        finalize(() => {
          this.submittingCardId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          const created = extractSubscriptionFromSuccessResponse(res);
          if (created) {
            this.subscriptionSession.write(created);
          }
          this.dashboardService.requestRefresh();
          this.notifications.success('Your subscription has been saved.');
          this.dialogRef.close(card.id);
        },
        error: (err: unknown) => {
          this.notifications.error(apiErrorSummary(err) || 'Could not save subscription.');
        },
      });
  }

  payWith(method: CheckoutMethod): void {
    const card = this.cards.find((item) => item.id === this.selectedCardId);
    if (!card || (card.subscriptionType !== 'Monthly' && card.subscriptionType !== 'Annual')) {
      return;
    }
    if (!method.enabled) {
      this.notifications.error(
        method.id === 'card'
          ? 'Card payments are not configured yet. Add a Stripe secret key in the API .env file.'
          : `${method.label} is not configured yet. Add Paymob keys and the ${method.label} integration id in the API .env file.`,
      );
      return;
    }
    this.startPaidCheckout(card, method.id);
  }

  private startPaidCheckout(card: PlanCardViewModel, method: CheckoutMethodId): void {
    if (card.subscriptionType !== 'Monthly' && card.subscriptionType !== 'Annual') {
      return;
    }

    this.submittingCardId = card.id;
    this.submittingMethodId = method;
    this.cdr.markForCheck();

    this.paymentsApi
      .createCheckout({ subscriptionType: card.subscriptionType, method })
      .pipe(
        finalize(() => {
          this.submittingCardId = null;
          this.submittingMethodId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          const checkoutUrl = res?.data?.checkoutUrl?.trim();
          if (!checkoutUrl) {
            this.notifications.error('Could not start checkout.');
            return;
          }
          window.location.assign(checkoutUrl);
        },
        error: (err: unknown) => {
          this.notifications.error(apiErrorSummary(err) || 'Could not start checkout.');
        },
      });
  }

  private loadPlans(): void {
    this.loading = true;
    this.loadError = null;
    this.cdr.markForCheck();

    const user = this.auth.getCurrentUser();
    const configs$ = this.subscriptionConfigApi.getSubscriptionConfigByRole(
      toSubscriptionConfigRoleName(this.data.roleName),
    );
    const subscription$ = user?._id
      ? this.subscriptionsApi.getSubscriptionsForUser(user._id, user.agencyId ?? undefined).pipe(
          catchError(() => of(null)),
        )
      : of(null);

    forkJoin({ configs: configs$, subscription: subscription$ }).subscribe({
      next: ({ configs, subscription }: { configs: ResponseModel<SubscriptionConfig>; subscription: unknown }) => {
        const raw = configs?.data?.subscriptionConfigs ?? [];
        let active = extractSubscriptionFromResponse(subscription);
        if (active) {
          this.subscriptionSession.write(active);
        } else if (user?._id) {
          active = this.subscriptionSession.getForUser(user._id, user.agencyId ?? null);
        }
        this.currentPlanType = active?.subscriptionType ?? null;
        this.cards = buildPlanCards(raw, active);
        this.selectedCardId = this.cards.find((card) => card.isCurrentPlan)?.id ?? null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadError = 'Could not load subscription plans.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadCheckoutMethods(): void {
    this.paymentsApi.getCheckoutMethods().subscribe({
      next: (res) => {
        this.checkoutMethods = res?.data?.methods?.length
          ? res.data.methods
          : [
              { id: 'card', label: 'Card', provider: 'stripe', enabled: false },
              { id: 'jazzcash', label: 'JazzCash', provider: 'paymob', enabled: false },
              { id: 'easypaisa', label: 'EasyPaisa', provider: 'paymob', enabled: false },
            ];
        this.cdr.markForCheck();
      },
      error: () => {
        this.checkoutMethods = [
          { id: 'card', label: 'Card', provider: 'stripe', enabled: false },
          { id: 'jazzcash', label: 'JazzCash', provider: 'paymob', enabled: false },
          { id: 'easypaisa', label: 'EasyPaisa', provider: 'paymob', enabled: false },
        ];
        this.cdr.markForCheck();
      },
    });
  }
}

function isPaidRow(cfg: SubscriptionConfigListDto): boolean {
  const f = cfg?.feature;
  if (f) {
    return f.isPaid === true;
  }
  return (cfg.monthlyPrice ?? 0) > 0 || (cfg.annualPrice ?? 0) > 0;
}

function formatLine(cfg: SubscriptionConfigListDto): string {
  const feature = cfg?.feature;
  if (feature) {
    const text = feature?.description?.trim();
    if (feature.isPaid && cfg.monthlyPrice > 0) {
      return `${cfg.featureValue} ${text} per month`;
    }
    if (feature.isPaid && cfg.annualPrice > 0) {
      return `${cfg.featureValue} ${text} per year`;
    }
    if (text) {
      return text;
    }
  }
  return 'Feature';
}

function sortConfigsForDisplay(configs: SubscriptionConfigListDto[]): SubscriptionConfigListDto[] {
  return [...configs].sort((a, b) => {
    const pa = isPaidRow(a) ? 1 : 0;
    const pb = isPaidRow(b) ? 1 : 0;
    return pa - pb;
  });
}

function quotaTotalsForRows(rows: SubscriptionConfigListDto[]): {
  numberOfFeatureListing: number;
  numberOfAgentVisibility: number;
} {
  let numberOfFeatureListing = 0;
  let numberOfAgentVisibility = 0;
  for (const c of rows) {
    const v = Math.max(0, Math.floor(Number(c.featureValue)) || 0);
    const desc = (c.feature?.description ?? '').toLowerCase();
    if (desc.includes('visibility') || desc.includes('agent')) {
      numberOfAgentVisibility += v;
    } else {
      numberOfFeatureListing += v;
    }
  }
  if (rows.length > 0 && numberOfFeatureListing === 0 && numberOfAgentVisibility === 0) {
    numberOfFeatureListing = rows.reduce((s, c) => s + Math.max(0, Math.floor(Number(c.featureValue)) || 0), 0);
  }
  return { numberOfFeatureListing, numberOfAgentVisibility };
}

export function buildPlanCards(
  configs: SubscriptionConfigListDto[],
  active: Subscription | null,
): PlanCardViewModel[] {
  const sorted = sortConfigsForDisplay(configs);

  const freeRows = sorted.filter((c) => !isPaidRow(c));
  const paidRows = sorted.filter((c) => isPaidRow(c));
  const monthlyTotal = paidRows.reduce((s, c) => s + (Number(c.monthlyPrice) || 0), 0);
  const annualTotal = paidRows.reduce((s, c) => s + (Number(c.annualPrice) || 0), 0);

  const freeLines = freeRows.map(formatLine);
  const sharedPaidLines = paidRows.map(formatLine);
  const monthlyLines = [...freeLines, ...sharedPaidLines];
  const annualLines = [...freeLines, ...sharedPaidLines];

  const quotasFree = quotaTotalsForRows(freeRows);
  const quotasAll = quotaTotalsForRows(sorted);

  const cards: PlanCardViewModel[] = [
    {
      id: 'free',
      subscriptionType: 'Free',
      title: 'Free Plan',
      subtitle: 'For personal',
      icon: 'home',
      priceDisplay: formatPkrAmount(0),
      billingLabel: 'forever',
      emphasis: false,
      lines: freeLines.length > 0 ? freeLines : ['Basic access'],
      numberOfFeatureListing: quotasFree.numberOfFeatureListing,
      numberOfAgentVisibility: quotasFree.numberOfAgentVisibility,
      isCurrentPlan: false,
    },
    {
      id: 'monthly',
      subscriptionType: 'Monthly',
      title: 'Monthly Plan',
      subtitle: 'For small business',
      icon: 'calendar_month',
      priceDisplay: formatPkrAmount(monthlyTotal),
      billingLabel: 'month',
      emphasis: true,
      lines: monthlyLines.length > 0 ? monthlyLines : ['No features configured'],
      numberOfFeatureListing: quotasAll.numberOfFeatureListing,
      numberOfAgentVisibility: quotasAll.numberOfAgentVisibility,
      isCurrentPlan: false,
    },
    {
      id: 'annual',
      subscriptionType: 'Annual',
      title: 'Annual Plan',
      subtitle: 'For enterprise',
      icon: 'domain',
      priceDisplay: formatPkrAmount(annualTotal),
      billingLabel: 'year',
      emphasis: false,
      lines: annualLines.length > 0 ? annualLines : ['No features configured'],
      numberOfFeatureListing: quotasAll.numberOfFeatureListing,
      numberOfAgentVisibility: quotasAll.numberOfAgentVisibility,
      isCurrentPlan: false,
    },
  ];

  if (!active) {
    return cards;
  }

  return cards.map((card) =>
    active.subscriptionType === card.subscriptionType
      ? {
          ...card,
          isCurrentPlan: true,
          numberOfFeatureListing: active.numberOfFeatureListing,
          numberOfAgentVisibility: active.numberOfAgentVisibility,
        }
      : { ...card, isCurrentPlan: false },
  );
}
