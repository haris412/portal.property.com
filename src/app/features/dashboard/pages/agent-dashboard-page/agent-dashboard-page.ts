import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import type { EChartsOption } from 'echarts';

import { PageShellComponent } from '../../../../shared/ui/page-shell/page-shell';

import { DashboardTopbarComponent } from '../../components/dashboard-topbar/dashboard-topbar';
import { DashboardHeroCardComponent } from '../../components/dashboard-hero-card/dashboard-hero-card';
import { PortfolioBreakdownCardComponent } from '../../components/portfolio-breakdown-card/portfolio-breakdown-card';
import { PlanSummaryCardComponent } from '../../components/plan-summary-card/plan-summary-card';
import { ChartPanelComponent } from '../../components/chart-panel/chart-panel';
import { LocationsDemandCardComponent } from '../../components/locations-demand-card/locations-demand-card';
import { AppointmentsTableCardComponent } from '../../components/appointment-table-card/appointment-table-card';

import {
  APPOINTMENTS,
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
    DashboardTopbarComponent,
    DashboardHeroCardComponent,
    PortfolioBreakdownCardComponent,
    PlanSummaryCardComponent,
    ChartPanelComponent,
    LocationsDemandCardComponent,
    AppointmentsTableCardComponent
  ],
  templateUrl: './agent-dashboard-page.html',
  styleUrl: './agent-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentDashboardPageComponent {
  readonly hero = HERO_CARD;
  readonly portfolioSummary = PORTFOLIO_SUMMARY;
  readonly portfolioMetrics = PORTFOLIO_METRICS;
  readonly planSummary = PLAN_SUMMARY;
  readonly planFeatures = PLAN_FEATURES;
  readonly locationDemand = LOCATION_DEMAND;
  readonly appointments = APPOINTMENTS;

  readonly viewsChartOptions = computed<EChartsOption>(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#1f1630',
      borderWidth: 0,
      textStyle: { color: '#ffffff' }
    },
    grid: { left: 0, right: 0, top: 12, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#7a6676', margin: 14 }
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'bar',
        barWidth: '56%',
        data: [120, 198, 154, 245, 212, 176, 165],
        itemStyle: { color: '#ff6b57', borderRadius: [10, 10, 0, 0] }
      }
    ]
  }));
}