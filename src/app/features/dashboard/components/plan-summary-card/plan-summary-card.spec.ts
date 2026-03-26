import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanSummaryCard } from './plan-summary-card';

describe('PlanSummaryCard', () => {
  let component: PlanSummaryCard;
  let fixture: ComponentFixture<PlanSummaryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanSummaryCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanSummaryCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
