import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { FeaturesAmenitiesSectionComponent } from './features-amenities-section';
import { AddListingService } from '../../../../core/services/add-listing.service';

describe('FeaturesAmenitiesSectionComponent', () => {
  let component: FeaturesAmenitiesSectionComponent;
  let fixture: ComponentFixture<FeaturesAmenitiesSectionComponent>;

  beforeEach(async () => {
    const addListingService = jasmine.createSpyObj('AddListingService', [
      'getPropertyFeatures',
      'invalidatePropertyFeaturesCache'
    ]);
    addListingService.getPropertyFeatures.and.returnValue(
      of([
        { _id: '1', name: 'Wi-Fi', slug: 'wifi', position: 0 }
      ])
    );

    await TestBed.configureTestingModule({
      imports: [FeaturesAmenitiesSectionComponent],
      providers: [{ provide: AddListingService, useValue: addListingService }]
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturesAmenitiesSectionComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    fixture.componentRef.setInput('form', fb.group({ selectedFeatureIds: [[] as string[]] }));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
