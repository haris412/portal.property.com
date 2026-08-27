export interface PortfolioMetric {
  title: string;
  value: number;
  hint: string;
  icon: string;
}

export interface PlanFeature {
  label: string;
  value: string;
}

export interface LocationDemand {
  name: string;
  percent: number;
}

export const HERO_CARD = {
  title: 'Welcome back, Admin!',
  description:
    'Manage your listings, track performance, and grow your real estate business.',
  ctaLabel: 'Add New Property'
};

export const PORTFOLIO_SUMMARY = {
  activePortfolio: 24,
  monthlyHint: '3 new listings were published this month and 6 are ready for review.',
  saleShare: 58,
  rentShare: 42,
  footerText: 'Keep listing inventory balanced across sale, rent, hot, and featured properties.'
};

export const PORTFOLIO_METRICS: PortfolioMetric[] = [
  {
    title: 'For Sale',
    value: 14,
    hint: 'Residential + commercial mix',
    icon: 'sell'
  },
  {
    title: 'For Rent',
    value: 10,
    hint: 'Short + long term listings',
    icon: 'key'
  },
  {
    title: 'Hot Properties',
    value: 7,
    hint: 'Most viewed in their area',
    icon: 'local_fire_department'
  },
  {
    title: 'Featured Properties',
    value: 5,
    hint: 'Visible on homepage',
    icon: 'star'
  }
];

export const PLAN_SUMMARY = {
  name: 'Professional Plus',
  price: '$89/month',
  renewalText: 'renews on 28 May 2026',
  listingLimit: 35,
  used: 24,
  status: 'Active',
  usagePercentage: 0
};

export const PLAN_FEATURES: PlanFeature[] = [
  { label: 'Listing limit', value: '35 properties' },
  { label: 'Featured slots Left', value: '8 out of 10' },
  { label: 'Hot property boost', value: 'Enabled' },
  { label: 'Agent visibility left', value: '3 out of 5' }
];

export const AGENT_COUNTS = {
  total: 0,
  active: 0,
  inactive: 0
};

export const LOCATION_DEMAND: LocationDemand[] = [
  { name: 'Downtown Seattle', percent: 85 },
  { name: 'Bellevue', percent: 72 },
  { name: 'Kirkland', percent: 64 },
  { name: 'Redmond', percent: 48 },
  { name: 'Capitol Hill', percent: 30 }
];
