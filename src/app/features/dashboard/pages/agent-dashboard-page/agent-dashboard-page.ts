import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import type { EChartsOption } from 'echarts';
import { of, merge } from 'rxjs';
import { catchError, finalize, switchMap, take } from 'rxjs/operators';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';

import { DashboardHeroCardComponent } from '../../components/dashboard-hero-card/dashboard-hero-card';
import { PortfolioBreakdownCardComponent } from '../../components/portfolio-breakdown-card/portfolio-breakdown-card';
import { PlanSummaryCardComponent } from '../../components/plan-summary-card/plan-summary-card';
import { ChartPanelComponent } from '../../components/chart-panel/chart-panel';
import { LocationsDemandCardComponent } from '../../components/locations-demand-card/locations-demand-card';
import { AppointmentsTableCardComponent } from '../../components/appointment-table-card/appointment-table-card';
import { AgentOverviewCardComponent } from '../../components/agent-overview-card/agent-overview-card';

import { AppointmentListItem } from '../../../../core/models/appointment.models';
import { hasPrimaryAgencyAdminRole } from '../../../../core/models/role.models';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import type { DashboardViewModel } from '../../models/dashboard-api.model';

import {
  AGENT_COUNTS,
  HERO_CARD,
  LOCATION_DEMAND,
  PLAN_FEATURES,
  PLAN_SUMMARY,
  PORTFOLIO_METRICS,
  PORTFOLIO_SUMMARY
} from '../../dashboard.mock';

@Component({
  selector: 'app-agent-dashboard-page',
  standalone: true,
  imports: [
    PageShellComponent,
    DashboardHeroCardComponent,
    PortfolioBreakdownCardComponent,
    PlanSummaryCardComponent,
    ChartPanelComponent,
    LocationsDemandCardComponent,
    AppointmentsTableCardComponent,
    AgentOverviewCardComponent
  ],
  templateUrl: './agent-dashboard-page.html',
  styleUrl: './agent-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentDashboardPageComponent {
  private readonly auth = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser = toSignal<User | null>(this.auth.currentUser$, {
    initialValue: null
  });

  private readonly dashboardVm = signal<DashboardViewModel | null>(null);

  /** Greeting line in the dashboard header. */
  readonly displayName = computed(() => {
    const u = this.currentUser();
    if (!u) return 'there';
    const full = u.name?.trim();
    if (full) return full;
    const fromParts = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    if (fromParts) return fromParts;
    return u.email || 'there';
  });

  readonly hero = computed(() => this.dashboardVm()?.hero ?? HERO_CARD);
  readonly portfolioSummary = computed(() => this.dashboardVm()?.portfolioSummary ?? PORTFOLIO_SUMMARY);
  readonly portfolioMetrics = computed(() => this.dashboardVm()?.portfolioMetrics ?? PORTFOLIO_METRICS);
  readonly planSummary = computed(() => this.dashboardVm()?.planSummary ?? PLAN_SUMMARY);
  readonly planFeatures = computed(() => this.dashboardVm()?.planFeatures ?? PLAN_FEATURES);
  readonly viewsChart = computed(
    () =>
      this.dashboardVm()?.viewsChart ?? {
        title: 'Trending Property Views',
        subtitle: 'Daily profile visits for your top listings over the last 7 days.',
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [120, 198, 154, 245, 212, 176, 165],
      }
  );
  readonly hotLocations = computed(
    () =>
      this.dashboardVm()?.hotLocations ?? {
        title: 'Hot Locations',
        subtitle: 'Buyer demand by area',
        locations: LOCATION_DEMAND,
      }
  );
  readonly showAgentOverview = computed(() =>
    hasPrimaryAgencyAdminRole(this.currentUser()?.roles)
  );
  readonly agentCounts = computed(
    () => this.dashboardVm()?.agentCounts ?? AGENT_COUNTS
  );
  readonly appointments = signal<AppointmentListItem[]>([]);

  constructor() {
    this.loadAppointments();

    merge(of(undefined), this.dashboardService.refresh$)
      .pipe(
        switchMap(() => this.fetchDashboardVm()),
        finalize(() => this.cdr.markForCheck()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => {
        this.dashboardVm.set(data);
        this.cdr.markForCheck();
      });
  }

  private fetchDashboardVm() {
    return this.auth.currentUser$.pipe(
      take(1),
      switchMap((user) => {
        const userId = user?._id;
        const roleIds = [...new Set([...(user?.roleIds ?? []), user?.roleId].filter(Boolean))] as string[];
        if (!userId || roleIds.length === 0) {
          return of(null);
        }

        const displayName =
          user?.name?.trim() ||
          [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
          user?.email ||
          'there';

        return this.dashboardService.getDashboardApiData(roleIds, userId, displayName).pipe(
          catchError(() => of(null))
        );
      })
    );
  }

  private loadAppointments(): void {
    this.auth.currentUser$
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user?._id) {
            return of([] as AppointmentListItem[]);
          }
          return this.appointmentsService.getByUserId(user._id).pipe(
            catchError(() => of([] as AppointmentListItem[]))
          );
        }),
        finalize(() => this.cdr.markForCheck()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((items) => {
        this.appointments.set(items);
        this.cdr.markForCheck();
      });
  }

  private readonly css = getComputedStyle(document.documentElement);

  private readonly primary = this.css.getPropertyValue('--primary').trim();
  private readonly surface = this.css.getPropertyValue('--surface').trim();
  private readonly fontMain = this.css.getPropertyValue('--font-main').trim();
  private readonly fontSecondary = this.css.getPropertyValue('--font-secondary').trim();
  private readonly borderSoft = this.css.getPropertyValue('--border-soft').trim();

  readonly viewsChartOptions = computed<EChartsOption>(() => {
    const chart = this.viewsChart();
    const labels = chart.labels;
    const values = chart.values;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: this.primary,
        borderWidth: 0,
        padding: [8, 10],
        textStyle: { color: this.surface }
      },
      grid: { left: 4, right: 8, top: 12, bottom: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: this.fontMain, margin: 14, fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        show: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: this.fontSecondary, fontSize: 11 },
        splitLine: {
          show: true,
          lineStyle: { color: this.borderSoft, type: 'dashed' }
        }
      },
      series: [
        {
          type: 'bar',
          barWidth: '42%',
          data: values,
          itemStyle: {
            color: this.primary,
            borderRadius: [6, 6, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: this.primary
            }
          }
        }
      ]
    };
  });
}
