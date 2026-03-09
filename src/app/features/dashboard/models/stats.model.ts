export interface StatCard {
  id: string;
  title: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  color: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  avatar: string;
  type: 'create' | 'update' | 'delete' | 'login';
}

export interface DashboardData {
  stats: StatCard[];
  revenueChart: ChartData;
  activities: ActivityItem[];
}
