import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturesAmenitiesSection } from './features-amenities-section';

describe('FeaturesAmenitiesSection', () => {
  let component: FeaturesAmenitiesSection;
  let fixture: ComponentFixture<FeaturesAmenitiesSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesAmenitiesSection],
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesAmenitiesSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
