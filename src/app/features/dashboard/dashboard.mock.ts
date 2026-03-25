import { AppointmentListItem } from "../../core/models/appointment.models";
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

export type AppointmentStatus = 'confirmed' | 'pending' | 'rescheduled';

export interface AppointmentItem {
  id: number;
  property: string;
  area: string;
  date: string;
  type: string;
  client: string;
  role: string;
  phone: string;
  time: string;
  status: AppointmentStatus;
}

export const HERO_CARD = {
  title: 'Grow Your Portfolio',
  description:
    'Ready to list a new property? Add details, upload media, and get it published directly on the home page for thousands of buyers and renters to see.',
  ctaLabel: 'Add New Property'
};

export const PORTFOLIO_SUMMARY = {
  activePortfolio: 24,
  monthlyHint: '3 new listings were published this month and 6 are ready for refresh.',
  saleShare: 58,
  rentShare: 42,
  footerText: 'This layout gives more breathing room while keeping all your key property counts in one place.'
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
    hint: 'High views this week',
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
  status: 'Active'
};

export const PLAN_FEATURES: PlanFeature[] = [
  { label: 'Listing limit', value: '35 properties' },
  { label: 'Featured slots', value: '8 included' },
  { label: 'Hot property boost', value: 'Enabled' },
  { label: 'Lead credits left', value: '126' }
];

export const LOCATION_DEMAND: LocationDemand[] = [
  { name: 'Downtown Seattle', percent: 85 },
  { name: 'Bellevue', percent: 72 },
  { name: 'Kirkland', percent: 64 },
  { name: 'Redmond', percent: 48 },
  { name: 'Capitol Hill', percent: 30 }
];

export const APPOINTMENTS: AppointmentListItem[] = [
  {
    id: '1',
    property: '1200 Skyline Boulevard, Apt 4B',
    area: 'Downtown Seattle',
    date: '12 Mar 2026',
    type: 'Property viewing',
    client: 'Emma Johnson',
    role: 'Buyer',
    phone: '+1 (206) 555-4812',
    time: '10:30 AM',
    status: 'confirmed'
  },
  {
    id: '2',
    property: '88 Harbor View Residence',
    area: 'Waterfront District',
    date: '13 Mar 2026',
    type: 'Rental inspection',
    client: 'Daniel Lee',
    role: 'Tenant',
    phone: '+1 (425) 555-7740',
    time: '1:00 PM',
    status: 'pending'
  },
  {
    id: '3',
    property: 'Maple Grove Family House',
    area: 'Bellevue Heights',
    date: '14 Mar 2026',
    type: 'Rescheduled visit',
    client: 'Sophia Carter',
    role: 'Buyer',
    phone: '+1 (360) 555-9021',
    time: '4:15 PM',
    status: 'rescheduled'
  }
];