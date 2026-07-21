export interface QuotaMeter {
  remaining: number;
  total: number;
  used: number;
  percentUsed: number;
}

export interface PlanQuotaViewModel {
  planName: string;
  price: string;
  renewalText: string;
  status: string;
  featured: QuotaMeter;
  listings: {
    used: number;
    limit: number | null;
    percentUsed: number;
  };
  agentVisibility: QuotaMeter;
  hotPropertyBoostEnabled: boolean;
  usagePercentage: number;
  featuredPropertiesLive: number;
}
