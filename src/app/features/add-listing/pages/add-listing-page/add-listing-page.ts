import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { merge } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PageHeaderComponent, PageHeaderAction } from '../../../../shared/ui/page-header/page-header';
import { BasicInformationSectionComponent } from '../../components/basic-information-section/basic-information-section';
import { PricingDetailsSectionComponent } from '../../components/pricing-details-section/pricing-details-section';
import { FeaturesAmenitiesSectionComponent } from '../../components/features-amenities-section/features-amenities-section';
import { PropertyMediaSectionComponent } from '../../components/property-media-section/property-media-section';
import { PropertyLocationStepComponent } from '../../components/property-location-step/property-location-step';
import { ContactInformationStepComponent } from '../../components/contact-information-step/contact-information-step';
import { PropertyDescriptionStepComponent } from '../../components/property-description-step/property-description-step';
import {
  AddListingService,
  GenerateListingDescriptionRequest,
} from '../../../../core/services/add-listing.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ADD_LISTING_HEADER_ACTIONS } from '../../constants/add-listing.constants';
import { MediaUploadService, ListingImagePayload } from '../../../../core/services/media-upload.service';
import { applyServerFieldErrors } from '../../../../core/http/apply-server-field-errors';
import { apiErrorSummary, parseHttpApiError } from '../../../../core/http/parse-http-api-error';
import {
  ADD_LISTING_BASIC_INFO_API_MAP,
  ADD_LISTING_CONTACT_API_MAP,
  ADD_LISTING_DESCRIPTION_API_MAP,
  ADD_LISTING_LOCATION_API_MAP,
  ADD_LISTING_PRICING_API_MAP,
} from '../../constants/add-listing-api-field-maps';
import { firstValueFrom } from 'rxjs';

interface UploadedMediaPayload {
  images: ListingImagePayload[];
  videoTourUrl: string | null;
}

/** Digits-only length 10–15 after stripping formatting (mobile / WhatsApp style). */
function contactPhoneFormatValidator(control: AbstractControl): ValidationErrors | null {
  const raw = (control.value ?? '').toString().trim();
  if (!raw) {
    return null;
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return { phoneFormat: true };
  }
  return null;
}

/** City control is usually a string; mat-autocomplete may briefly hold a GeoNames row object. */
function locationCityFormValueToString(city: unknown): string {
  if (city == null) return '';
  if (typeof city === 'string') return city.trim();
  const o = city as { name?: string };
  return typeof o.name === 'string' ? o.name.trim() : '';
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
    ContactInformationStepComponent,
    PropertyDescriptionStepComponent,
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
  readonly descriptionForm: FormGroup;
  readonly locationForm: FormGroup;
  readonly isSubmitting = signal(false);
  readonly isGeneratingDescription = signal(false);

  /** Recomputed when basic/pricing/location/amenities forms change (OnPush + signal gate for the AI chip). */
  private readonly aiListingFormsTick = signal(0);
  readonly aiDescriptionContextReady = computed(() => {
    this.aiListingFormsTick();
    return this.evalAiDescriptionContextReady();
  });

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  constructor(private readonly fb: FormBuilder) {
    this.basicInfoForm = this.fb.group({
      purpose: ['rent', Validators.required],
      propertyCategoryName: ['', Validators.required],
      propertySubtypeName: [''],
      listingTitle: ['', [Validators.required, Validators.maxLength(120)]],
    });

    this.descriptionForm = this.fb.group({
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
      contactPhoneNumber: ['', [Validators.required, contactPhoneFormatValidator]],
      contactLocation: [''],
    });

    this.locationForm = this.fb.group({
      city: ['', Validators.required],
      neighborhood: ['', Validators.required],
      fullAddress: ['', Validators.required],
      mapLink: [''],
      /** Set by map pin / “Use my location” (also synced to `mapLink`). */
      latitude: [null as number | null],
      longitude: [null as number | null],
    });

    merge(
      this.basicInfoForm.valueChanges,
      this.pricingForm.valueChanges,
      this.locationForm.valueChanges,
      this.amenitiesForm.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aiListingFormsTick.update((n: number) => n + 1));

    this.addListingService.getPropertyFeatures().subscribe({ error: () => void 0 });
  }

  onGenerateDescription(): void {
    if (!this.aiDescriptionContextReady() || this.isGeneratingDescription()) {
      return;
    }
    const body = this.buildAiDescriptionRequestBody();
    if (!body) {
      return;
    }
    this.isGeneratingDescription.set(true);
    this.addListingService
      .generateListingDescription(body)
      .pipe(finalize(() => this.isGeneratingDescription.set(false)))
      .subscribe({
        next: (text) => {
          if (!text) {
            this.notifications.warning('No description text was returned.');
            return;
          }
          this.descriptionForm.patchValue({ propertyDescription: text });
          this.notifications.success('Description added — review and edit if needed.');
        },
        error: (err: unknown) => {
          this.notifications.error(apiErrorSummary(err) || 'Could not generate description.');
        },
      });
  }

  private evalAiDescriptionContextReady(): boolean {
    if (this.basicInfoForm.invalid || this.pricingForm.invalid || this.locationForm.invalid) {
      return false;
    }
    const ids = (this.amenitiesForm.get('selectedFeatureIds')?.value ?? []) as string[];
    return Array.isArray(ids) && ids.length > 0;
  }

  private buildAiDescriptionRequestBody(): GenerateListingDescriptionRequest | null {
    if (!this.evalAiDescriptionContextReady()) {
      return null;
    }
    const basic = this.basicInfoForm.getRawValue();
    const pricing = this.pricingForm.getRawValue();
    const amenities = this.amenitiesForm.getRawValue();
    const contact = this.contactForm.getRawValue();
    const location = this.locationForm.getRawValue();

    const purpose =
      basic.purpose === 'sale' ? ('For Sale' as const) : ('For Rent' as const);
    const propertyType = this.addListingService.getCoarsePropertyTypeFromLabels(
      basic.propertyCategoryName,
      basic.propertySubtypeName
    );
    const categoryName = (basic.propertyCategoryName ?? '').trim();
    const subtypeName = (basic.propertySubtypeName ?? '').trim();
    const subtype = (subtypeName || categoryName).trim();
    const amenityBooleans = this.addListingService.buildAmenityBooleanPayload(
      amenities.selectedFeatureIds ?? []
    );

    return {
      title: (basic.listingTitle ?? '').trim(),
      purpose,
      propertyType,
      subtype,
      price: pricing.price,
      areaSize: pricing.areaSize,
      areaUnit: pricing.areaUnit,
      numBedrooms: pricing.numBedrooms,
      numBathrooms: pricing.numBathrooms,
      numParkingSpaces: pricing.numParkingSpaces,
      numFloors: pricing.numFloors,
      ...amenityBooleans,
      city: locationCityFormValueToString(location.city),
      neighborhood: location.neighborhood,
      fullAddress: location.fullAddress,
      mapLink: location.mapLink,
      latitude: location.latitude,
      longitude: location.longitude,
      contactName: contact.contactName,
      contactEmail: contact.contactEmail,
      contactPhoneNumber: contact.contactPhoneNumber,
      contactLocation: contact.contactLocation,
    };
  }

  async onHeaderAction(actionId: string): Promise<void> {
    if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT || actionId === ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING) {
      if (this.isSubmitting()) {
        return;
      }
      if (
        this.basicInfoForm.invalid ||
        this.pricingForm.invalid ||
        this.contactForm.invalid ||
        this.descriptionForm.invalid ||
        this.locationForm.invalid
      ) {
        this.basicInfoForm.markAllAsTouched();
        this.pricingForm.markAllAsTouched();
        this.contactForm.markAllAsTouched();
        this.descriptionForm.markAllAsTouched();
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

        await this.router.navigate(['/properties']);
      } catch (error: unknown) {
        this.handleAddListingSubmitError(error, actionId);
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
      const details = apiErrorSummary(error) || 'Media upload failed';
      this.notifications.error(details);
      throw new Error(details);
    }
  }

  /**
   * Toast from API shape (401/403/400/500, express-validator, Mongoose strings) and
   * map `errors[].path` onto listing forms when possible.
   */
  private handleAddListingSubmitError(error: unknown, actionId: string): void {
    const parsed = parseHttpApiError(error);
    const fallback =
      actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT
        ? 'Failed to save draft'
        : 'Failed to publish listing';
    this.notifications.error(parsed.summary || fallback);

    applyServerFieldErrors(
      parsed.fieldErrors,
      [
        { form: this.basicInfoForm, map: ADD_LISTING_BASIC_INFO_API_MAP },
        { form: this.descriptionForm, map: ADD_LISTING_DESCRIPTION_API_MAP },
        { form: this.pricingForm, map: ADD_LISTING_PRICING_API_MAP },
        { form: this.locationForm, map: ADD_LISTING_LOCATION_API_MAP },
        { form: this.contactForm, map: ADD_LISTING_CONTACT_API_MAP },
      ],
      this.destroyRef
    );
  }

  private buildPayload(uploadedMedia: UploadedMediaPayload) {
    const basic = this.basicInfoForm.value;
    const description = this.descriptionForm.value;
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
      propertyDescription: description.propertyDescription,
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
      city: locationCityFormValueToString(location.city),
      neighborhood: location.neighborhood,
      fullAddress: location.fullAddress,
      mapLink: location.mapLink,
      /** Map pin coordinates (null until user places pin or uses current location). */
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
    };
  }
}