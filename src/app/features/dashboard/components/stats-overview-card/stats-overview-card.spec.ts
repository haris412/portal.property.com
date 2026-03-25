import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsOverviewCard } from './stats-overview-card';

describe('StatsOverviewCard', () => {
  let component: StatsOverviewCard;
  let fixture: ComponentFixture<StatsOverviewCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsOverviewCard],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsOverviewCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
