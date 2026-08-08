import { formatDate } from '@angular/common';
import type { DashboardApiDashboardData, DashboardApiResponse } from '../../dashboard/models/dashboard-api.model';
import type { PlanQuotaViewModel, QuotaMeter } from '../models/plan-quota.model';

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
    return '—';
  }

  const parsed = new Date(dateRaw);
  if (Number.isNaN(parsed.getTime())) {
    return dateRaw.startsWith('renews') ? dateRaw : `Renews on ${dateRaw}`;
  }

  return `Renews on ${formatDate(parsed, 'd MMM yyyy', 'en-US')}`;
}

function formatPrice(monthlyPrice: number | undefined, price: number | undefined): string {
  const amount = monthlyPrice ?? price;
  if (amount == null) {
    return '—';
  }
  return `$${amount}/month`;
}

function buildQuotaMeter(remaining: number, total: number): QuotaMeter {
  const safeTotal = Math.max(total, 0);
  const safeRemaining = Math.min(Math.max(remaining, 0), safeTotal);
  const used = Math.max(safeTotal - safeRemaining, 0);
  const percentUsed =
    safeTotal > 0 ? Math.min(Math.round((used / safeTotal) * 100), 100) : 0;

  return {
    remaining: safeRemaining,
    total: safeTotal,
    used,
    percentUsed,
  };
}

function buildListingPercent(used: number, limit: number | null): number {
  if (limit == null || limit <= 0) {
    return 0;
  }
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function mapPlanQuotaApiResponse(body: DashboardApiResponse | unknown): PlanQuotaViewModel | null {
  const dashboard = unwrapDashboardData(body);
  if (!dashboard) {
    return null;
  }

  const plan = dashboard.subscriptionPlanData ?? {};
  const listingLimit =
    plan.isListingLimitUnlimited === true || plan.listingLimit === null
      ? null
      : (plan.listingLimit ?? 0);
  const listingsUsed = plan.listingsUsed ?? 0;

  const featuredRemaining = plan.featuredSlots ?? 0;
  const featuredTotal = plan.totalNumberOfFeatureListing ?? 0;
  const agentRemaining = plan.numberOfAgentVisibility ?? 0;
  const agentTotal = plan.totalNumberOfAgentVisibility ?? 0;

  return {
    planName: plan.planName?.trim() || 'Current plan',
    price: formatPrice(plan.monthlyPrice, plan.price),
    renewalText: formatRenewalText(plan.renewalDate),
    status: plan.status?.trim() || 'Active',
    featured: buildQuotaMeter(featuredRemaining, featuredTotal),
    listings: {
      used: listingsUsed,
      limit: listingLimit,
      percentUsed: buildListingPercent(listingsUsed, listingLimit),
    },
    agentVisibility: buildQuotaMeter(agentRemaining, agentTotal),
    hotPropertyBoostEnabled: plan.isHotPropertyBoostEnabled === true,
    usagePercentage: Math.min(Math.max(Math.round(plan.usagePercentage ?? 0), 0), 100),
    featuredPropertiesLive: dashboard.featuredPropertiesCount ?? 0,
  };
}
