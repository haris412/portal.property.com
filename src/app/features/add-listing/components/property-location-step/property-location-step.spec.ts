import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyLocationStep } from './property-location-step';

describe('PropertyLocationStep', () => {
  let component: PropertyLocationStep;
  let fixture: ComponentFixture<PropertyLocationStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyLocationStep],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyLocationStep);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
