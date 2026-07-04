import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), DashboardService] });
    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return dashboard data with correct shape', async () => {
    const result = await firstValueFrom(service.getDashboardData());
    expect(result).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.revenueChart).toBeDefined();
    expect(result.activities).toBeDefined();
  });

  it('should return 4 stat cards', async () => {
    const stats = await firstValueFrom(service.getStats());
    expect(stats.length).toBe(4);
  });

  it('should have required properties on each stat card', async () => {
    const stats = await firstValueFrom(service.getStats());
    stats.forEach((card) => {
      expect(card.id).toBeDefined();
      expect(card.title).toBeDefined();
      expect(card.value).toBeDefined();
      expect(card.change).toBeDefined();
      expect(card.color).toBeDefined();
    });
  });

  it('should return 6 activity items', async () => {
    const activities = await firstValueFrom(service.getActivities());
    expect(activities.length).toBe(6);
  });

  it('should have valid activity types', async () => {
    const activities = await firstValueFrom(service.getActivities());
    const validTypes = ['create', 'update', 'delete', 'login'];
    activities.forEach((a) => {
      expect(validTypes).toContain(a.type);
    });
  });

  it('should return chart data with 12 months', async () => {
    const result = await firstValueFrom(service.getDashboardData());
    expect(result.revenueChart.labels.length).toBe(12);
  });

  it('should return chart data with at least 2 datasets', async () => {
    const result = await firstValueFrom(service.getDashboardData());
    expect(result.revenueChart.datasets.length).toBeGreaterThanOrEqual(2);
  });
});
