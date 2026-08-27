import type { LocationDemand, PlanFeature, PortfolioMetric } from '../dashboard.mock';

/** Raw API envelope from `GET /api/dashboard/dashboardData`. */
export interface DashboardApiResponse {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: {
    dashboardData?: DashboardApiDashboardData;
  };
}

export interface DashboardApiDashboardData {
  username?: string;
  totalProperties?: number;
  salesPropertyPercentage?: number;
  rentPropertyPercentage?: number;
  totalSalesProperties?: number;
  totalRentProperties?: number;
  featuredPropertiesCount?: number;
  hotPropertiesCount?: number;
  subscriptionPlanData?: DashboardApiSubscriptionPlanData;
  analyticsData?: DashboardApiAnalyticsData;
  agentCount?: number;
  agentCounts?: DashboardApiAgentCounts;
}

export interface DashboardApiSubscriptionPlanData {
  planName?: string;
  configRoleName?: string;
  subscriptionType?: string;
  price?: number;
  monthlyPrice?: number;
  renewalDate?: string;
  status?: string;
  listingsUsed?: number;
  listingLimit?: number | null;
  isListingLimitUnlimited?: boolean;
  totalNumberOfFeatureListing?: number;
  totalNumberOfAgentVisibility?: number;
  featuredSlots?: number;
  numberOfAgentVisibility?: number;
  isHotPropertyBoostEnabled?: boolean;
  leadCreditsLeft?: number;
  usagePercentage?: number;
}

export interface DashboardApiAnalyticsData {
  trendingPropertyViews?: {
    title?: string;
    subtitle?: string;
    range?: string;
    data?: Array<{ day?: string; views?: number }>;
  };
  hotLocations?: {
    title?: string;
    subtitle?: string;
    data?: Array<{ rank?: number; location?: string; demandPercentage?: number }>;
  };
}

export interface DashboardApiAgentCounts {
  totalAgentsCount?: number;
  activeAgentsCount?: number;
  inactiveAgentsCount?: number;
}

/** View model consumed by dashboard UI components. */
export interface DashboardViewModel {
  hero: {
    title: string;
    description: string;
    ctaLabel: string;
  };
  portfolioSummary: {
    activePortfolio: number;
    monthlyHint: string;
    saleShare: number;
    rentShare: number;
    footerText: string;
  };
  portfolioMetrics: PortfolioMetric[];
  planSummary: {
    name: string;
    price: string;
    renewalText: string;
    status: string;
    listingLimit: number | null;
    used: number;
    usagePercentage: number;
  };
  planFeatures: PlanFeature[];
  viewsChart: {
    title: string;
    subtitle: string;
    labels: string[];
    values: number[];
  };
  hotLocations: {
    title: string;
    subtitle: string;
    locations: LocationDemand[];
  };
  agentCounts: {
    total: number;
    active: number;
    inactive: number;
  };
}
