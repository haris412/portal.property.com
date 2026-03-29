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
import { MediaUploadService, ListingImagePayload } from '../../../../core/services/media-upload.service';
import { firstValueFrom } from 'rxjs';

interface UploadedMediaPayload {
  images: ListingImagePayload[];
  videoTourUrl: string | null;
}

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
  readonly isSubmitting = signal(false);

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
  private readonly mediaUploadService = inject(MediaUploadService);

  constructor(private readonly fb: FormBuilder) {
    this.basicInfoForm = this.fb.group({
      purpose: ['rent', Validators.required],
      propertyCategoryName: ['', Validators.required],
      propertySubtypeName: [''],
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
      selectedFeatureIds: [[] as string[]],
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
      latitude: [null as number | null],
      longitude: [null as number | null],
    });
  }

  async onHeaderAction(actionId: string): Promise<void> {
    if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT || actionId === ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING) {
      if (this.isSubmitting()) {
        return;
      }
      if (this.basicInfoForm.invalid || this.pricingForm.invalid || this.contactForm.invalid || this.locationForm.invalid) {
        this.basicInfoForm.markAllAsTouched();
        this.pricingForm.markAllAsTouched();
        this.contactForm.markAllAsTouched();
        this.locationForm.markAllAsTouched();
        this.notifications.warning('Please fill all required fields before uploading and submitting.');
        return;
      }

      this.isSubmitting.set(true);
      try {
        const uploadedMedia = await this.uploadSelectedMedia();
        const payload = this.buildPayload(uploadedMedia) as any;

        if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT) {
          await firstValueFrom(this.addListingService.saveDraft(payload));
          this.notifications.success('Draft saved successfully');
        } else {
          await firstValueFrom(this.addListingService.createListing(payload));
          this.notifications.success('Property added successfully');
        }
      } catch (error: unknown) {
        const message = this.resolveErrorMessage(error);
        if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT) {
          this.notifications.error(message || 'Failed to save draft');
        } else {
          this.notifications.error(message || 'Failed to publish listing');
        }
      } finally {
        this.isSubmitting.set(false);
      }
    }
  }

  private async uploadSelectedMedia(): Promise<UploadedMediaPayload> {
    const media = this.mediaForm.value;
    const images = (media.images ?? []) as File[];
    const videoFiles = (media.videoFiles ?? []) as File[];

    if (!images.length && !videoFiles.length) {
      return { images: [], videoTourUrl: null };
    }

    this.notifications.info('Uploading media...');
    try {
      const uploadedImages = images.length ? await this.mediaUploadService.uploadImages(images) : [];
      const videoTourUrl = videoFiles[0]
        ? await this.mediaUploadService.uploadVideo(videoFiles[0])
        : null;
      this.notifications.success('Media uploaded successfully');

      return {
        images: uploadedImages,
        videoTourUrl,
      };
    } catch (error: unknown) {
      const details = this.resolveErrorMessage(error) || 'Media upload failed';
      this.notifications.error(details);
      throw new Error(details);
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return '';
    }
    const e = error as {
      message?: string;
      error?: { message?: string; errors?: Array<{ msg?: string }> };
    };
    return e.error?.message ?? e.error?.errors?.[0]?.msg ?? e.message ?? '';
  }

  private buildPayload(uploadedMedia: UploadedMediaPayload) {
    const basic = this.basicInfoForm.value;
    const pricing = this.pricingForm.value;
    const amenities = this.amenitiesForm.value;
    const contact = this.contactForm.value;
    const location = this.locationForm.value;

    const purpose =
      basic.purpose === 'sale'
        ? 'For Sale'
        : 'For Rent';

    const propertyType = this.addListingService.getCoarsePropertyTypeFromLabels(
      basic.propertyCategoryName,
      basic.propertySubtypeName
    );
    const categoryName = (basic.propertyCategoryName ?? '').trim();
    const subtypeName = (basic.propertySubtypeName ?? '').trim();
    /** Shown + stored as the “detail” type; falls back to category if no subtype row. */
    const subtype = (subtypeName || categoryName).trim();
    const amenityBooleans = this.addListingService.buildAmenityBooleanPayload(
      amenities.selectedFeatureIds ?? []
    );

    return {
      purpose,
      propertyType,
      subtype,
      /** Same as `subtype`; many APIs only persist camelCase fields aligned with `propertyType`. */
      propertySubtype: subtype,
      propertyCategoryName: categoryName,
      propertySubtypeName: subtypeName,
      listingTitle: basic.listingTitle,
      propertyDescription: basic.propertyDescription,
      price: pricing.price,
      areaSize: pricing.areaSize,
      areaUnit: pricing.areaUnit,
      numBedrooms: pricing.numBedrooms,
      numBathrooms: pricing.numBathrooms,
      numParkingSpaces: pricing.numParkingSpaces,
      numFloors: pricing.numFloors,
      ...amenityBooleans,
      images: uploadedMedia.images,
      videoTourUrl: uploadedMedia.videoTourUrl,
      contactName: contact.contactName,
      contactEmail: contact.contactEmail,
      contactPhoneNumber: contact.contactPhoneNumber,
      contactLocation: contact.contactLocation,
      city: location.city,
      neighborhood: location.neighborhood,
      fullAddress: location.fullAddress,
      mapLink: location.mapLink,
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }
}