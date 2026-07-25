import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, finalize, of, switchMap, take } from 'rxjs';
import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { AuthService } from '../../../../core/services/auth.service';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { SubscriptionPlansGateService } from '../../../../core/services/subscription-plans-gate.service';
import { isSubscriptionPlansGateExcluded } from '../../../../core/models/role.models';
import type { PlanQuotaViewModel } from '../../models/plan-quota.model';

@Component({
  selector: 'app-subscription-usage-page',
  standalone: true,
  imports: [
    PageShellComponent,
    SectionCardComponent,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    TranslateModule,
  ],
  templateUrl: './subscription-usage-page.html',
  styleUrl: './subscription-usage-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionUsagePageComponent {
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly subscriptionPlansGate = inject(SubscriptionPlansGateService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly quota = signal<PlanQuotaViewModel | null>(null);

  readonly canUpgradePlan = computed(() => {
    const user = this.auth.getCurrentUser();
    return Boolean(user?._id) && !isSubscriptionPlansGateExcluded(user?.roles);
  });

  constructor() {
    this.loadQuota();

    this.dashboardService.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadQuota());
  }

  openSubscriptionPlans(): void {
    this.subscriptionPlansGate.openPlansDialogForCurrentUser().subscribe({
      next: () => this.loadQuota(),
    });
  }

  listingLimitLabel(limit: number | null): string {
    return limit === null
      ? (this.translate.instant('subscriptionUsage.unlimited') as string)
      : String(limit);
  }

  private loadQuota(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.auth.currentUser$
      .pipe(
        take(1),
        switchMap((user) => {
          const userId = user?._id;
          const roleIds = [...new Set([...(user?.roleIds ?? []), user?.roleId].filter(Boolean))] as string[];

          if (!userId || roleIds.length === 0) {
            this.loadError.set(this.translate.instant('subscriptionUsage.errors.notSignedIn') as string);
            return of(null);
          }

          return this.dashboardService.getPlanQuotaData(roleIds, userId).pipe(
            catchError(() => of(null)),
          );
        }),
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => {
        if (!data) {
          if (!this.loadError()) {
            this.loadError.set(this.translate.instant('subscriptionUsage.errors.loadFailed') as string);
          }
          this.quota.set(null);
        } else {
          this.quota.set(data);
        }
        this.cdr.markForCheck();
      });
  }
}
