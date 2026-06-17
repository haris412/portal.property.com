import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { SubscriptionConfigService } from '../../../core/services/subscription-config.service';
import {
  SubscriptionsApiService,
  extractSubscriptionFromSuccessResponse,
} from '../../../core/services/subscriptions-api.service';
import { SubscriptionSessionStorageService } from '../../../core/services/subscription-session-storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorSummary } from '../../../core/http/parse-http-api-error';
import type {
  Subscription,
  SubscriptionConfig,
  SubscriptionConfigListDto,
  SubscriptionCreateDTO,
  SubscriptionType,
} from '../../../core/models/subscription.models';
import type { ResponseModel } from '../../../core/models/response.model';
import { NotificationService } from '../../../core/services/notification.service';

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
  private readonly subscriptionSession = inject(SubscriptionSessionStorageService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly data = inject<SubscriptionPlansDialogData>(MAT_DIALOG_DATA);

  loading = true;
  loadError: string | null = null;
  cards: PlanCardViewModel[] = [];
  submittingCardId: PlanCardViewModel['id'] | null = null;

  constructor() {
    this.loadPlans();
  }

  retryLoad(): void {
    this.loadPlans();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  subscribePlan(card: PlanCardViewModel): void {
    const user = this.auth.getCurrentUser();
    if (!user?._id?.trim()) {
      this.notifications.error('You must be signed in to subscribe.');
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
          this.notifications.success('Your subscription has been saved.');
          this.dialogRef.close(card.id);
        },
        error: (err: unknown) => {
          this.notifications.error(apiErrorSummary(err) || 'Could not save subscription.');
        },
      });
  }

  private loadPlans(): void {
    this.loading = true;
    this.loadError = null;
    this.cdr.markForCheck();

    this.subscriptionConfigApi.getSubscriptionConfigByRole(this.data.roleName).subscribe({
      next: (res: ResponseModel<SubscriptionConfig>) => {
        const raw = res?.data?.subscriptionConfigs ?? [];
        const user = this.auth.getCurrentUser();
        const active =
          user?._id != null
            ? this.subscriptionSession.getForUser(user._id, user.agencyId ?? null)
            : null;
        this.cards = buildPlanCards(raw, active);
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
      priceDisplay: '$0',
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
      priceDisplay: `$${monthlyTotal.toFixed(monthlyTotal % 1 === 0 ? 0 : 2)}`,
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
      priceDisplay: `$${annualTotal.toFixed(annualTotal % 1 === 0 ? 0 : 2)}`,
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
