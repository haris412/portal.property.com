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
import { of } from 'rxjs';
import { catchError, finalize, switchMap, take } from 'rxjs/operators';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';

import { DashboardTopbarComponent } from '../../components/dashboard-topbar/dashboard-topbar';
import { DashboardHeroCardComponent } from '../../components/dashboard-hero-card/dashboard-hero-card';
import { PortfolioBreakdownCardComponent } from '../../components/portfolio-breakdown-card/portfolio-breakdown-card';
import { PlanSummaryCardComponent } from '../../components/plan-summary-card/plan-summary-card';
import { ChartPanelComponent } from '../../components/chart-panel/chart-panel';
import { LocationsDemandCardComponent } from '../../components/locations-demand-card/locations-demand-card';
import { AppointmentsTableCardComponent } from '../../components/appointment-table-card/appointment-table-card';

import { AppointmentListItem } from '../../../../core/models/appointment.models';
import { AppointmentsService } from '../../../../core/services/appointments.service';
import { AuthService, User } from '../../../../core/services/auth.service';

import {
  HERO_CARD,
  LOCATION_DEMAND,
  PLAN_FEATURES,
  PLAN_SUMMARY,
  PORTFOLIO_METRICS,
  PORTFOLIO_SUMMARY
} from '../../dashboard.mock';
import { PageHeaderComponent } from "../../../../shared/ui/page-header/page-header";

@Component({
  selector: 'app-agent-dashboard-page',
  standalone: true,
  imports: [
    PageShellComponent,
    DashboardTopbarComponent,
    DashboardHeroCardComponent,
    PortfolioBreakdownCardComponent,
    PlanSummaryCardComponent,
    ChartPanelComponent,
    LocationsDemandCardComponent,
    AppointmentsTableCardComponent,
    PageHeaderComponent
  ],
  templateUrl: './agent-dashboard-page.html',
  styleUrl: './agent-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentDashboardPageComponent {
  private readonly auth = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentUser = toSignal<User | null>(this.auth.currentUser$, {
    initialValue: null
  });

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

  readonly hero = HERO_CARD;
  readonly portfolioSummary = PORTFOLIO_SUMMARY;
  readonly portfolioMetrics = PORTFOLIO_METRICS;
  readonly planSummary = PLAN_SUMMARY;
  readonly planFeatures = PLAN_FEATURES;
  readonly locationDemand = LOCATION_DEMAND;
  readonly appointments = signal<AppointmentListItem[]>([]);

  constructor() {
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
  private readonly secondary = this.css.getPropertyValue('--secondary').trim();
  private readonly surface = this.css.getPropertyValue('--surface').trim();
  private readonly fontMain = this.css.getPropertyValue('--font-main').trim();
  private readonly borderSoft = this.css.getPropertyValue('--border-soft').trim();
  private readonly tertiary = this.css.getPropertyValue('--tertiary').trim();

  readonly viewsChartOptions = computed<EChartsOption>(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: this.primary,
      borderWidth: 0,
      textStyle: { color: this.surface }
    },
    grid: { left: 0, right: 0, top: 12, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: this.fontMain, margin: 14, fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      show: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: this.fontMain },
      splitLine: {
        show: true,
        lineStyle: { color: this.borderSoft }
      }
    },
    series: [
      {
        type: 'bar',
        barWidth: '56%',
        data: [120, 198, 154, 245, 212, 176, 165],
        itemStyle: {
          color: this.secondary,
          borderRadius: [10, 10, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: this.secondary
          }
        }
      }
    ]
  }));
}