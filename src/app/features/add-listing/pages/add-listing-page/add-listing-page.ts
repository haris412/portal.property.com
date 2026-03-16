import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent, PageHeaderAction } from '../../../../shared/ui/page-header/page-header';
import { BasicInformationSectionComponent } from '../../components/basic-information-section/basic-information-section';
import { PricingDetailsSectionComponent } from '../../components/pricing-details-section/pricing-details-section';
import { FeaturesAmenitiesSectionComponent } from '../../components/features-amenities-section/features-amenities-section';
import { PropertyMediaSectionComponent } from '../../components/property-media-section/property-media-section';
import { PropertyLocationStepComponent } from '../../components/property-location-step/property-location-step';
import { ContactInformationStepComponent } from '../../components/contact-information-step/contact-information-step';
import { AddListingService } from '../../../../core/services/add-listing.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ADD_LISTING_HEADER_ACTIONS } from '../../constants/add-listing.constants';

@Component({
  selector: 'app-add-listing-page',
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    BasicInformationSectionComponent,
    PricingDetailsSectionComponent,
    FeaturesAmenitiesSectionComponent,
    PropertyMediaSectionComponent,
    PropertyLocationStepComponent,
    ContactInformationStepComponent
  ],
  templateUrl: './add-listing-page.html',
  styleUrl: './add-listing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddListingPageComponent {
  readonly basicInfoForm: FormGroup;
  readonly pricingForm: FormGroup;
  readonly amenitiesForm: FormGroup;
  readonly mediaForm: FormGroup;
  readonly contactForm: FormGroup;
  readonly locationForm: FormGroup;

  readonly pageActions = signal<readonly PageHeaderAction[]>([
    {
      id: ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT,
      label: 'Save Draft',
      variant: 'stroked'
    },
    {
      id: ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING,
      label: 'Publish Listing',
      variant: 'flat'
    }
  ]);

  private readonly addListingService = inject(AddListingService);
  private readonly notifications = inject(NotificationService);

  constructor(private readonly fb: FormBuilder) {
    this.basicInfoForm = this.fb.group({
      purpose: ['rent', Validators.required],
      propertyType: ['Apartment', Validators.required],
      listingTitle: ['', [Validators.required, Validators.maxLength(120)]],
      propertyDescription: ['', [Validators.required, Validators.minLength(20)]],
    });

    this.pricingForm = this.fb.group({
      price: [75000, [Validators.required, Validators.min(0)]],
      areaSize: [1200, [Validators.required, Validators.min(0)]],
      areaUnit: ['sqft', Validators.required],
      numBedrooms: [2, [Validators.required, Validators.min(0)]],
      numBathrooms: [2, [Validators.required, Validators.min(0)]],
      numParkingSpaces: [0, [Validators.required, Validators.min(0)]],
      numFloors: [0, [Validators.required, Validators.min(0)]],
    });

    this.amenitiesForm = this.fb.group({
      hasWifi: [true],
      hasSwimmingPool: [true],
      hasGym: [false],
      hasGarage: [true],
      hasCentralAc: [true],
      hasBalcony: [false],
      hasSecurity: [false],
      hasGarden: [true],
    });

    this.mediaForm = this.fb.group({
      images: [[] as File[]],
      videoFiles: [[] as File[]],
    });

    this.contactForm = this.fb.group({
      contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhoneNumber: ['', Validators.required],
      contactLocation: [''],
    });

    this.locationForm = this.fb.group({
      city: ['', Validators.required],
      neighborhood: [''],
      fullAddress: ['', Validators.required],
      mapLink: [''],
    });
  }

  onHeaderAction(actionId: string): void {
    if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT || actionId === ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING) {
      if (this.basicInfoForm.invalid || this.pricingForm.invalid || this.contactForm.invalid || this.locationForm.invalid) {
        this.basicInfoForm.markAllAsTouched();
        this.pricingForm.markAllAsTouched();
        this.contactForm.markAllAsTouched();
        this.locationForm.markAllAsTouched();
        return;
      }

      const payload = this.buildPayload() as any;

      if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT) {
        this.addListingService.saveDraft(payload).subscribe({
          next: () => this.notifications.success('Draft saved successfully'),
          error: () => this.notifications.error('Failed to save draft'),
        });
      } else {
        this.addListingService.createListing(payload).subscribe({
          next: () => this.notifications.success('Property added successfully'),
          error: () => this.notifications.error('Failed to publish listing'),
        });
      }
    }
  }

  private buildPayload() {
    const basic = this.basicInfoForm.value;
    const pricing = this.pricingForm.value;
    const amenities = this.amenitiesForm.value;
    const media = this.mediaForm.value;
    const contact = this.contactForm.value;
    const location = this.locationForm.value;

    const purpose =
      basic.purpose === 'sale'
        ? 'For Sale'
        : 'For Rent';

    return {
      purpose,
      propertyType: basic.propertyType,
      listingTitle: basic.listingTitle,
      propertyDescription: basic.propertyDescription,
      price: pricing.price,
      areaSize: pricing.areaSize,
      areaUnit: pricing.areaUnit,
      numBedrooms: pricing.numBedrooms,
      numBathrooms: pricing.numBathrooms,
      numParkingSpaces: pricing.numParkingSpaces,
      numFloors: pricing.numFloors,
      hasWifi: amenities.hasWifi,
      hasSwimmingPool: amenities.hasSwimmingPool,
      hasGym: amenities.hasGym,
      hasGarage: amenities.hasGarage,
      hasCentralAc: amenities.hasCentralAc,
      hasBalcony: amenities.hasBalcony,
      hasSecurity: amenities.hasSecurity,
      hasGarden: amenities.hasGarden,
      images: media.images,
      videoFiles: media.videoFiles,
      contactName: contact.contactName,
      contactEmail: contact.contactEmail,
      contactPhoneNumber: contact.contactPhoneNumber,
      contactLocation: contact.contactLocation,
      city: location.city,
      neighborhood: location.neighborhood,
      fullAddress: location.fullAddress,
      mapLink: location.mapLink,
    };
  }
}