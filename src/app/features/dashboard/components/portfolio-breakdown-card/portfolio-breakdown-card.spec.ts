import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioBreakdownCard } from './portfolio-breakdown-card';

describe('PortfolioBreakdownCard', () => {
  let component: PortfolioBreakdownCard;
  let fixture: ComponentFixture<PortfolioBreakdownCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioBreakdownCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioBreakdownCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
