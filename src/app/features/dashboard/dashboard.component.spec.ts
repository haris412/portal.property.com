import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './services/dashboard.service';
import { DashboardData } from './models/stats.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockDashboardService: { getDashboardData: ReturnType<typeof vi.fn> };

  const mockData: DashboardData = {
    stats: [
      { id: '1', title: 'Revenue', value: '$1000', change: 5, changeLabel: 'vs last', icon: 'revenue', color: 'indigo' },
    ],
    revenueChart: {
      labels: ['Jan', 'Feb'],
      datasets: [{ label: 'Revenue', data: [100, 200], color: '#6366f1' }],
    },
    activities: [
      { id: '1', user: 'Alice', action: 'created', target: 'Project', timestamp: '1m ago', avatar: 'AL', type: 'create' },
    ],
  };

  beforeEach(async () => {
    mockDashboardService = { getDashboardData: vi.fn().mockReturnValue(of(mockData)) };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterModule.forRoot([])],
      providers: [{ provide: DashboardService, useValue: mockDashboardService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    expect(mockDashboardService.getDashboardData).toHaveBeenCalledTimes(1);
  });

  it('should populate stats after loading', () => {
    component.ngOnInit();
    expect(component.stats().length).toBe(1);
    expect(component.stats()[0].title).toBe('Revenue');
  });

  it('should set isLoading to false after data load', () => {
    component.isLoading.set(true);
    component.loadDashboard();
    expect(component.isLoading()).toBe(false);
  });

  it('should set chartData after loading', () => {
    component.loadDashboard();
    expect(component.chartData()).toBeTruthy();
    expect(component.chartData()!.labels.length).toBe(2);
  });

  it('should set activities after loading', () => {
    component.loadDashboard();
    expect(component.activities().length).toBe(1);
  });

  it('should handle service error gracefully', () => {
    mockDashboardService.getDashboardData.mockReturnValue(throwError(() => new Error('Network error')));
    component.loadDashboard();
    expect(component.isLoading()).toBe(false);
  });

  it('should have correct breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(2);
    expect(component.breadcrumbs[0].label).toBe('Home');
    expect(component.breadcrumbs[1].label).toBe('Dashboard');
  });

  it('should have 3 quick stats', () => {
    expect(component.quickStats.length).toBe(3);
  });

  it('should render page title', () => {
    const title = fixture.nativeElement.querySelector('.page-title');
    expect(title.textContent.trim()).toBe('Dashboard');
  });

  it('should call loadDashboard when refresh button clicked', () => {
    const loadSpy = vi.spyOn(component, 'loadDashboard');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.refresh-btn');
    btn.click();
    expect(loadSpy).toHaveBeenCalled();
  });
});
