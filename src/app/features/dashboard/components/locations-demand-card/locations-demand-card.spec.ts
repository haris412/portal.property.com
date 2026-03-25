import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationsDemandCard } from './locations-demand-card';

describe('LocationsDemandCard', () => {
  let component: LocationsDemandCard;
  let fixture: ComponentFixture<LocationsDemandCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationsDemandCard],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationsDemandCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
