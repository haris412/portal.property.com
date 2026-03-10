import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingDetailsSection } from './pricing-details-section';

describe('PricingDetailsSection', () => {
  let component: PricingDetailsSection;
  let fixture: ComponentFixture<PricingDetailsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingDetailsSection],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingDetailsSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
