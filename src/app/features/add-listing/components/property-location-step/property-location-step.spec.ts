import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { PropertyLocationStepComponent } from './property-location-step';
import { LocationCatalogService } from '../../../../core/services/location-catalog.service';

describe('PropertyLocationStepComponent', () => {
  let component: PropertyLocationStepComponent;
  let fixture: ComponentFixture<PropertyLocationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyLocationStepComponent, ReactiveFormsModule],
      providers: [
        FormBuilder,
        {
          provide: LocationCatalogService,
          useValue: {
            getPopulatedPlaces: () => of([]),
            getMergedLocationSuggestionsAround: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyLocationStepComponent);
    component = fixture.componentInstance;
    const fb = TestBed.inject(FormBuilder);
    fixture.componentRef.setInput(
      'form',
      fb.group({
        city: [''],
        neighborhood: [''],
        fullAddress: [''],
        mapLink: [''],
        latitude: [null],
        longitude: [null],
      })
    );
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
