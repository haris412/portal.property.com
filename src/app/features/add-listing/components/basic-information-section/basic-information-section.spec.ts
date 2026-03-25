import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { BasicInformationSectionComponent } from './basic-information-section';
import { AddListingService } from '../../../../core/services/add-listing.service';

describe('BasicInformationSectionComponent', () => {
  let component: BasicInformationSectionComponent;
  let fixture: ComponentFixture<BasicInformationSectionComponent>;
  let addListingService: jasmine.SpyObj<AddListingService>;

  beforeEach(async () => {
    addListingService = jasmine.createSpyObj('AddListingService', [
      'getPropertyCatalog',
      'invalidatePropertyCatalogCache'
    ]);
    addListingService.getPropertyCatalog.and.returnValue(
      of({
        categories: [
          {
            _id: 'c1',
            name: 'Homes',
            slug: 'homes',
            subtypes: [{ _id: 's1', name: 'House', slug: 'house' }]
          }
        ]
      })
    );

    await TestBed.configureTestingModule({
      imports: [BasicInformationSectionComponent, ReactiveFormsModule],
      providers: [{ provide: AddListingService, useValue: addListingService }]
    }).compileComponents();

    fixture = TestBed.createComponent(BasicInformationSectionComponent);
    component = fixture.componentInstance;
    const fb = new FormBuilder();
    fixture.componentRef.setInput(
      'form',
      fb.group({
        purpose: ['rent'],
        propertyCategoryName: [''],
        propertySubtypeName: [''],
        listingTitle: [''],
        propertyDescription: ['']
      })
    );
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories from catalog', () => {
    expect(addListingService.getPropertyCatalog).toHaveBeenCalled();
    expect(component.categories().length).toBe(1);
    expect(component.catalogLoading()).toBeFalse();
  });
});
