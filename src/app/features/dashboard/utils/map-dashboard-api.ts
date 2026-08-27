import { formatDate } from '@angular/common';
import {
  HERO_CARD,
  LOCATION_DEMAND,
  PLAN_FEATURES,
  PLAN_SUMMARY,
  PORTFOLIO_METRICS,
  PORTFOLIO_SUMMARY,
} from '../dashboard.mock';
import type {
  DashboardApiDashboardData,
  DashboardApiResponse,
  DashboardApiSubscriptionPlanData,
  DashboardViewModel,
} from '../models/dashboard-api.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapDashboardData(body: unknown): DashboardApiDashboardData | null {
  if (!isRecord(body)) {
    return null;
  }

  const data = body['data'];
  if (isRecord(data) && isRecord(data['dashboardData'])) {
    return data['dashboardData'] as DashboardApiDashboardData;
  }

  if (isRecord(body['dashboardData'])) {
    return body['dashboardData'] as DashboardApiDashboardData;
  }

  return body as DashboardApiDashboardData;
}

function formatRenewalText(dateRaw: string | undefined): string {
  if (!dateRaw?.trim()) {
    return PLAN_SUMMARY.renewalText;
  }

  const parsed = new Date(dateRaw);
  if (Number.isNaN(parsed.getTime())) {
    return dateRaw.startsWith('renews') ? dateRaw : `renews on ${dateRaw}`;
  }

  return `renews on ${formatDate(parsed, 'd MMM yyyy', 'en-US')}`;
}

function formatPrice(
  monthlyPrice: number | undefined,
  price: number | undefined
): string {
  const amount = monthlyPrice ?? price;
  if (amount == null) {
    return PLAN_SUMMARY.price;
  }
  return `$${amount}/month`;
}

function isUnlimitedListingLimit(
  plan: DashboardApiSubscriptionPlanData
): boolean {
  return plan.isListingLimitUnlimited === true || plan.listingLimit === null;
}

function buildMonthlyHint(
  dashboard: DashboardApiDashboardData,
  totalProperties: number
): string {
  const agents = dashboard.agentCounts;
  if (agents?.totalAgentsCount != null && agents.totalAgentsCount > 0) {
    const active = agents.activeAgentsCount ?? 0;
    const total = agents.totalAgentsCount;
    return `${totalProperties} properties in portfolio with ${active} of ${total} agents active.`;
  }

  if (totalProperties === 0) {
    return 'No listings published yet. Add your first property to get started.';
  }

  return `${totalProperties} properties currently in your portfolio.`;
}

export function mapDashboardApiResponse(
  body: DashboardApiResponse | unknown,
  fallbackDisplayName = 'there'
): DashboardViewModel | null {
  const dashboard = unwrapDashboardData(body);
  if (!dashboard) {
    return null;
  }

  const username = dashboard.username?.trim() || fallbackDisplayName;
  const totalProperties = dashboard.totalProperties ?? 0;
  const saleShare = dashboard.salesPropertyPercentage ?? 0;
  const rentShare = dashboard.rentPropertyPercentage ?? 0;
  const totalSales = dashboard.totalSalesProperties ?? 0;
  const totalRent = dashboard.totalRentProperties ?? 0;
  const featuredCount = dashboard.featuredPropertiesCount ?? 0;
  const hotCount = dashboard.hotPropertiesCount ?? 0;

  const plan = dashboard.subscriptionPlanData ?? {};
  const trending = dashboard.analyticsData?.trendingPropertyViews;
  const hotLocationsBlock = dashboard.analyticsData?.hotLocations;

  const chartRows = trending?.data ?? [];
  const chartLabels = chartRows.length
    ? chartRows.map((row) => row.day ?? '')
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartValues = chartRows.length
    ? chartRows.map((row) => row.views ?? 0)
    : [120, 198, 154, 245, 212, 176, 165];

  const locationRows = hotLocationsBlock?.data ?? [];
  const locations = locationRows.length
    ? locationRows
        .map((row) => ({
          name: row.location?.trim() ?? '',
          percent: row.demandPercentage ?? 0,
        }))
        .filter((row) => row.name)
    : LOCATION_DEMAND;

  const listingLimit = isUnlimitedListingLimit(plan)
    ? null
    : (plan.listingLimit ?? 0);
  const listingsUsed = plan.listingsUsed ?? 0;
  const featuredSlots = plan.featuredSlots ?? 0;
  const totalFeaturedSlots = plan.totalNumberOfFeatureListing ?? 0;
  const agentVisibility = plan.numberOfAgentVisibility ?? 0;
  const totalAgentVisibility = plan.totalNumberOfAgentVisibility ?? 0;

  return {
    hero: {
      title: `Welcome back, ${username}!`,
      description: HERO_CARD.description,
      ctaLabel: HERO_CARD.ctaLabel,
    },
    portfolioSummary: {
      activePortfolio: totalProperties,
      monthlyHint: buildMonthlyHint(dashboard, totalProperties),
      saleShare,
      rentShare,
      footerText: PORTFOLIO_SUMMARY.footerText,
    },
    portfolioMetrics: [
      { ...PORTFOLIO_METRICS[0], value: totalSales },
      { ...PORTFOLIO_METRICS[1], value: totalRent },
      { ...PORTFOLIO_METRICS[2], value: hotCount, hint: 'Most viewed in their area' },
      { ...PORTFOLIO_METRICS[3], value: featuredCount },
    ],
    planSummary: {
      name: plan.planName ?? PLAN_SUMMARY.name,
      price: formatPrice(plan.monthlyPrice, plan.price),
      renewalText: formatRenewalText(plan.renewalDate),
      status: plan.status ?? PLAN_SUMMARY.status,
      listingLimit,
      used: listingsUsed,
      usagePercentage: plan.usagePercentage ?? 0,
    },
    planFeatures: [
      {
        label: 'Listing limit',
        value: listingLimit === null ? 'Unlimited' : `${listingLimit} properties`,
      },
      {
        label: 'Featured slots Left',
        value: `${featuredSlots} out of ${totalFeaturedSlots}`,
      },
      {
        label: 'Hot property boost',
        value: plan.isHotPropertyBoostEnabled ? 'Enabled' : 'Disabled',
      },
      {
        label: 'Agent visibility left',
        value: `${agentVisibility} out of ${totalAgentVisibility}`,
      },
    ],
    viewsChart: {
      title: trending?.title ?? 'Trending Property Views',
      subtitle:
        trending?.subtitle ??
        'Daily profile visits for your top listings over the last 7 days.',
      labels: chartLabels,
      values: chartValues,
    },
    hotLocations: {
      title: hotLocationsBlock?.title ?? 'Hot Locations',
      subtitle: hotLocationsBlock?.subtitle ?? 'Buyer demand by area',
      locations,
    },
    agentCounts: {
      total: dashboard.agentCounts?.totalAgentsCount ?? dashboard.agentCount ?? 0,
      active: dashboard.agentCounts?.activeAgentsCount ?? 0,
      inactive: dashboard.agentCounts?.inactiveAgentsCount ?? 0,
    },
  };
}
