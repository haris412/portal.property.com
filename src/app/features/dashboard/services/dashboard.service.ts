import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, of, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardApiResponse, DashboardViewModel } from '../models/dashboard-api.model';
import { DashboardData, StatCard, ActivityItem, ChartData } from '../models/stats.model';
import { mapDashboardApiResponse } from '../utils/map-dashboard-api';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly refreshSubject = new Subject<void>();

  /** Emits when dashboard data should be reloaded (e.g. after subscription change). */
  readonly refresh$ = this.refreshSubject.asObservable();

  requestRefresh(): void {
    this.refreshSubject.next();
  }

  getDashboardApiData(
    roleIds: string[],
    userId: string,
    displayName = 'there'
  ): Observable<DashboardViewModel | null> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('roleId', JSON.stringify(roleIds));

    return this.http
      .get<DashboardApiResponse>('/dashboard/dashboardData', { params })
      .pipe(map((body) => mapDashboardApiResponse(body, displayName)));
  }

  getDashboardData(): Observable<DashboardData> {
    return of({
      stats: this.getMockStats(),
      revenueChart: this.getMockChartData(),
      activities: this.getMockActivities(),
    }).pipe(delay(300));
  }

  getStats(): Observable<StatCard[]> {
    return of(this.getMockStats()).pipe(delay(200));
  }

  getActivities(): Observable<ActivityItem[]> {
    return of(this.getMockActivities()).pipe(delay(200));
  }

  private getMockStats(): StatCard[] {
    return [
      {
        id: 'revenue',
        title: 'Total Revenue',
        value: '$84,254',
        change: 12.5,
        changeLabel: 'vs last month',
        icon: 'revenue',
        color: 'indigo',
      },
      {
        id: 'users',
        title: 'Active Users',
        value: 3842,
        change: 8.2,
        changeLabel: 'vs last month',
        icon: 'users',
        color: 'emerald',
      },
      {
        id: 'orders',
        title: 'New Orders',
        value: 1259,
        change: -3.1,
        changeLabel: 'vs last month',
        icon: 'orders',
        color: 'amber',
      },
      {
        id: 'conversion',
        title: 'Conversion Rate',
        value: '4.7%',
        change: 1.8,
        changeLabel: 'vs last month',
        icon: 'conversion',
        color: 'rose',
      },
    ];
  }

  private getMockChartData(): ChartData {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Revenue',
          data: [32000, 41000, 38000, 52000, 47000, 61000, 55000, 68000, 72000, 65000, 78000, 84000],
          color: 'var(--primary)',
        },
        {
          label: 'Expenses',
          data: [22000, 28000, 25000, 35000, 31000, 38000, 34000, 42000, 45000, 39000, 47000, 51000],
          color: 'var(--warning)',
        },
      ],
    };
  }

  private getMockActivities(): ActivityItem[] {
    return [
      { id: '1', user: 'Alice Johnson', action: 'created', target: 'New Project Alpha', timestamp: '2 min ago', avatar: 'AJ', type: 'create' },
      { id: '2', user: 'Bob Smith', action: 'updated', target: 'User permissions', timestamp: '15 min ago', avatar: 'BS', type: 'update' },
      { id: '3', user: 'Carol White', action: 'deleted', target: 'Draft report Q3', timestamp: '1 hr ago', avatar: 'CW', type: 'delete' },
      { id: '4', user: 'David Lee', action: 'logged in', target: '', timestamp: '2 hr ago', avatar: 'DL', type: 'login' },
      { id: '5', user: 'Eva Brown', action: 'created', target: 'Invoice #1024', timestamp: '3 hr ago', avatar: 'EB', type: 'create' },
      { id: '6', user: 'Frank Miller', action: 'updated', target: 'Product catalog', timestamp: '5 hr ago', avatar: 'FM', type: 'update' },
    ];
  }
}
