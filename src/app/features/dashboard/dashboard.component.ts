import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { StatCard, ChartData, ActivityItem } from './models/stats.model';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { ChartWidgetComponent } from './components/chart-widget/chart-widget.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/ui/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    StatsCardComponent,
    ChartWidgetComponent,
    RecentActivityComponent,
    LoadingSpinnerComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  stats = signal<StatCard[]>([]);
  chartData = signal<ChartData | null>(null);
  activities = signal<ActivityItem[]>([]);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', route: '/dashboard' },
    { label: 'Dashboard' },
  ];

  quickStats = [
    { label: 'Customer Satisfaction', value: '94%', percent: 94, color: '#10b981' },
    { label: 'System Uptime', value: '99.9%', percent: 99.9, color: '#6366f1' },
    { label: 'Task Completion', value: '78%', percent: 78, color: '#f59e0b' },
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.chartData.set(data.revenueChart);
        this.activities.set(data.activities);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
}
