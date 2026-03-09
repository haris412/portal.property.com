import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatsCardComponent } from './stats-card.component';
import { StatCard } from '../../models/stats.model';

describe('StatsCardComponent', () => {
  let component: StatsCardComponent;
  let fixture: ComponentFixture<StatsCardComponent>;

  const mockCard: StatCard = {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$84,254',
    change: 12.5,
    changeLabel: 'vs last month',
    icon: 'revenue',
    color: 'indigo',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsCardComponent);
    component = fixture.componentInstance;
    component.card = mockCard;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display card title', () => {
    const el = fixture.nativeElement.querySelector('.card-title');
    expect(el.textContent.trim()).toBe('Total Revenue');
  });

  it('should display card value', () => {
    const el = fixture.nativeElement.querySelector('.card-value');
    expect(el.textContent.trim()).toBe('$84,254');
  });

  it('should show positive change indicator', () => {
    const el = fixture.nativeElement.querySelector('.card-change');
    expect(el.classList).toContain('positive');
    expect(el.textContent).toContain('+12.5%');
  });

  it('should show negative change indicator', () => {
    fixture.componentRef.setInput('card', { ...mockCard, change: -5.2 });
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.card-change');
    expect(el.classList).toContain('negative');
  });

  it('should apply correct color class', () => {
    const el = fixture.nativeElement.querySelector('.card-icon');
    expect(el.classList).toContain('icon-indigo');
  });

  it('should render revenue icon when icon is revenue', () => {
    const svg = fixture.nativeElement.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should display change label text', () => {
    const el = fixture.nativeElement.querySelector('.change-label');
    expect(el.textContent.trim()).toBe('vs last month');
  });
});
