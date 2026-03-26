import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardHeroCard } from './dashboard-hero-card';

describe('DashboardHeroCard', () => {
  let component: DashboardHeroCard;
  let fixture: ComponentFixture<DashboardHeroCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHeroCard],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardHeroCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
