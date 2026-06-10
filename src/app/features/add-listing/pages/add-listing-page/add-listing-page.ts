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
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, merge, of } from 'rxjs';
import { finalize, switchMap, take } from 'rxjs/operators';
import { PageHeaderComponent, PageHeaderAction } from '../../../../shared/ui/page-header/page-header';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import {
  WizardStepperComponent,
  WizardStepperItem,
} from '../../../../shared/ui/wizard-stepper/wizard-stepper';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import {
  ListingProgressPanelComponent,
  ListingProgressStep,
} from '../../components/listing-progress-panel/listing-progress-panel';
import { ListingHelpCardComponent } from '../../components/listing-help-card/listing-help-card';
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
import type { CreateListingPayload } from '../../../../core/models/add-listing.model';
import {
  buildListingPayload,
  type ListingFormSnapshot,
  type UploadedMediaPayload,
} from '../../mappers/listing-payload.mapper';
import type { LocationHierarchyItem } from '../../../../core/models/google-places.models';
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';
import type { PropertyCatalogData } from '../../../../core/models/property-catalog.model';
import type { PropertyFeature } from '../../../../core/models/property-features.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ADD_LISTING_HEADER_ACTIONS } from '../../constants/add-listing.constants';
import { MediaUploadService, ListingImagePayload } from '../../../../core/services/media-upload.service';
import { GooglePlacesService } from '../../../../core/services/google-places.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SubscriptionSessionStorageService } from '../../../../core/services/subscription-session-storage.service';
import {
  SubscriptionsApiService,
  extractSubscriptionFromSuccessResponse,
} from '../../../../core/services/subscriptions-api.service';
import type { Subscription } from '../../../../core/models/subscription.models';
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
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  FEATURE_SLUG_TO_AMENITY_KEY,
  normalizeFeatureSlug,
} from '../../../../core/constants/listing-payload.constants';
import { CdkAutofill } from "@angular/cdk/text-field";

const FEATURED_LISTING_QUOTA_MESSAGE =
  'You are out of featured listing quota. Upgrade your plan or remove another featured property.';

type AddListingStepKey =
  | 'basic-info'
  | 'pricing'
  | 'location'
  | 'features-media'
  | 'contact-description'
  | 'review-publish';

interface AddListingWizardStep {
  key: AddListingStepKey;
  label: string;
  description: string;
}

interface AddListingRequirement {
  label: string;
  complete: boolean;
}

interface ReviewSummaryItem {
  label: string;
  value: string;
}

interface ReviewSummarySection {
  title: string;
  icon: string;
  items: readonly ReviewSummaryItem[];
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

function nonEmptyArrayValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return Array.isArray(value) && value.length > 0 ? null : { required: true };
}

function mediaRequirementValidator(control: AbstractControl): ValidationErrors | null {
  const images = (control.get('images')?.value as File[] | null) ?? [];
  const video = (control.get('videoFiles')?.value as File[] | null) ?? [];
  return images.length >= 3 || video.length > 0 ? null : { mediaRequired: true };
}

function coerceCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Extracts lat/lng from common Google Maps URL formats when stored on the listing. */
function parseLatLngFromMapLink(mapLink: string): { lat: number; lng: number } | null {
  const text = mapLink.trim();
  if (!text) {
    return null;
  }

  const patterns = [
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

@Component({
  selector: 'app-add-listing-page',
  imports: [
    TranslateModule,
    MatIconModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    InfoBannerComponent,
    WizardStepperComponent,
    SectionCardComponent,
    ListingProgressPanelComponent,
    ListingHelpCardComponent,
    BasicInformationSectionComponent,
    PricingDetailsSectionComponent,
    FeaturesAmenitiesSectionComponent,
    PropertyMediaSectionComponent,
    PropertyLocationStepComponent,
    ContactInformationStepComponent,
    PropertyDescriptionStepComponent,
    CdkAutofill
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
  readonly isFeatured = signal(false);
  /** Whether the loaded property was already featured (no quota decrement on re-save). */
  private readonly wasFeaturedWhenLoaded = signal(false);
  readonly existingPropertyImages = signal<ListingImagePayload[]>([]);
  readonly activeStepKey = signal<AddListingStepKey>('basic-info');
  private readonly stepOrder: readonly AddListingStepKey[] = [
    'basic-info',
    'pricing',
    'location',
    'features-media',
    'contact-description',
    'review-publish',
  ] as const;
  private readonly stepDefinitions: readonly AddListingWizardStep[] = [
    {
      key: 'basic-info',
      label: 'Basic Info',
      description: 'Property details',
    },
    {
      key: 'pricing',
      label: 'Pricing',
      description: 'Price and size',
    },
    {
      key: 'location',
      label: 'Location',
      description: "Where it's located",
    },
    {
      key: 'features-media',
      label: 'Features & Media',
      description: 'Amenities, photos, and video',
    },
    {
      key: 'contact-description',
      label: 'Contact & Description',
      description: 'Contact info and listing story',
    },
    {
      key: 'review-publish',
      label: 'Review & Publish',
      description: 'Final review',
    },
  ] as const;

  readonly listingSteps = computed<readonly WizardStepperItem[]>(() => {
    const activeIndex = this.stepOrder.indexOf(this.activeStepKey());

    return this.stepDefinitions.map((step, index): WizardStepperItem => ({
      ...step,
      state: index < activeIndex ? 'completed' : index === activeIndex ? 'active' : 'pending',
    }));
  });
  readonly activeStepIndex = computed(() => this.stepOrder.indexOf(this.activeStepKey()));
  readonly isFirstStep = computed(() => this.activeStepIndex() <= 0);
  readonly isLastStep = computed(() => this.activeStepIndex() >= this.stepOrder.length - 1);
  readonly progressPercent = computed(() =>
    Math.round(((this.activeStepIndex() + 1) / this.stepOrder.length) * 100)
  );
  readonly progressDegrees = computed(() => `${Math.round((this.progressPercent() / 100) * 360)}deg`);
  readonly activeStepLabel = computed(() => {
    const activeKey = this.activeStepKey();
    return this.stepDefinitions.find((step) => step.key === activeKey)?.label ?? '';
  });
  readonly activeStepCountLabel = computed(() => `${this.activeStepIndex() + 1} of ${this.stepOrder.length}`);

  /** Recomputed when basic/pricing/location/amenities forms change (OnPush + signal gate for the AI chip). */
  private readonly aiListingFormsTick = signal(0);
  private readonly listingFormsTick = signal(0);
  readonly publishRequirements = computed<readonly AddListingRequirement[]>(() => {
    this.listingFormsTick();

    const media = this.mediaForm.value;
    const newImageCount = (media.images ?? []).length;
    const existingImageCount = this.existingPropertyImages().length;
    const hasMedia =
      existingImageCount + newImageCount >= 3 ||
      Boolean((media.videoFiles ?? []).length) ||
      Boolean(this.loadedProperty()?.videoTourUrl);

    return [
      { label: 'Add basic information', complete: this.basicInfoForm.valid },
      { label: 'Add pricing and details', complete: this.pricingForm.valid },
      { label: 'Set property location', complete: this.locationForm.valid && this.hasValidCoordinates() },
      { label: 'Add media', complete: hasMedia },
      { label: 'Add contact information', complete: this.contactForm.valid },
      { label: 'Write description', complete: this.descriptionForm.valid },
    ];
  });
  readonly completedRequirementCount = computed(
    () => this.publishRequirements().filter((item) => item.complete).length
  );
  readonly progressPanelSteps = computed<readonly ListingProgressStep[]>(() => {
    this.listingFormsTick();

    const amenities = this.amenitiesForm.getRawValue();
    const media = this.mediaForm.getRawValue();
    const hasFeaturesOrMedia = Boolean(
      (amenities.selectedFeatureIds ?? []).length ||
      (media.images ?? []).length >= 3 ||
      (media.videoFiles ?? []).length
    );

    const readinessByStep: Record<AddListingStepKey, boolean> = {
      'basic-info': this.basicInfoForm.valid,
      pricing: this.pricingForm.valid,
      location: this.locationForm.valid && this.hasValidCoordinates(),
      'features-media': hasFeaturesOrMedia,
      'contact-description': this.contactForm.valid && this.descriptionForm.valid,
      'review-publish': this.canSubmitListing(),
    };

    return this.listingSteps().map((step) => {
      const ready = readinessByStep[step.key as AddListingStepKey];
      return {
        ...step,
        readiness: ready ? 'complete' : 'attention',
        readinessLabel: ready ? 'Ready' : 'Needs input',
      };
    });
  });
  readonly completedProgressStepCount = computed(
    () => this.progressPanelSteps().filter((step) => step.readiness === 'complete').length
  );
  readonly progressTrayOpen = signal(false);
  readonly canSubmitListing = computed(() =>
    this.publishRequirements()
      .filter((item) => item.label !== 'Add media')
      .every((item) => item.complete)
  );
  readonly reviewPrimaryActionLabel = computed(() =>
    this.editingId() ? 'Save changes' : 'Publish Listing'
  );
  readonly reviewSummarySections = computed<readonly ReviewSummarySection[]>(() => {
    this.listingFormsTick();

    const basic = this.basicInfoForm.getRawValue();
    const pricing = this.pricingForm.getRawValue();
    const location = this.locationForm.getRawValue();
    const amenities = this.amenitiesForm.getRawValue();
    const media = this.mediaForm.getRawValue();
    const contact = this.contactForm.getRawValue();
    const description = this.descriptionForm.getRawValue();

    const selectedFeatureIds = (amenities.selectedFeatureIds ?? []) as string[];
    const images = (media.images ?? []) as File[];
    const videoFiles = (media.videoFiles ?? []) as File[];
    const areaLabel = [this.formatReviewValue(pricing.areaSize, ''), this.formatReviewValue(pricing.areaUnit, '')]
      .filter(Boolean)
      .join(' ');
    const coordinatesSelected = location.latitude != null && location.longitude != null;

    return [
      {
        title: 'Listing basics',
        icon: 'home_work',
        items: [
          {
            label: 'Purpose',
            value: basic.purpose === 'sale' ? 'For Sale' : 'For Rent',
          },
          {
            label: 'Listing title',
            value: this.formatReviewValue(basic.listingTitle),
          },
          {
            label: 'Property type',
            value: this.formatReviewValue(basic.propertySubtypeName || basic.propertyCategoryName),
          },
          {
            label: 'Category',
            value: this.formatReviewValue(basic.propertyCategoryName),
          },
        ],
      },
      {
        title: 'Pricing and details',
        icon: 'payments',
        items: [
          {
            label: 'Price',
            value: this.formatCurrencyValue(pricing.price),
          },
          {
            label: 'Area size',
            value: areaLabel || 'Not provided',
          },
          {
            label: 'Bedrooms',
            value: this.formatReviewValue(pricing.numBedrooms),
          },
          {
            label: 'Bathrooms',
            value: this.formatReviewValue(pricing.numBathrooms),
          },
          {
            label: 'Parking spaces',
            value: this.formatReviewValue(pricing.numParkingSpaces),
          },
          {
            label: 'Floors',
            value: this.formatReviewValue(pricing.numFloors),
          },
        ],
      },
      {
        title: 'Location',
        icon: 'location_on',
        items: [
          {
            label: 'Location',
            value: this.formatLocationHierarchyForReview(location.locationHierarchy),
          },
          {
            label: 'Full address',
            value: this.formatReviewValue(location.fullAddress),
          },
          {
            label: 'Map pin',
            value: coordinatesSelected ? 'Selected' : 'Not set',
          },
        ],
      },
      {
        title: 'Features and media',
        icon: 'perm_media',
        items: [
          {
            label: 'Amenities',
            value: selectedFeatureIds.length ? `${selectedFeatureIds.length} selected` : 'None selected',
          },
          {
            label: 'Photos',
            value: images.length ? `${images.length} selected` : 'None selected',
          },
          {
            label: 'Video tour',
            value: videoFiles[0]?.name ?? 'Not selected',
          },
        ],
      },
      {
        title: 'Contact and description',
        icon: 'contact_phone',
        items: [
          {
            label: 'Contact name',
            value: this.formatReviewValue(contact.contactName),
          },
          {
            label: 'Email',
            value: this.formatReviewValue(contact.contactEmail),
          },
          {
            label: 'Phone',
            value: this.formatReviewValue(contact.contactPhoneNumber),
          },
          {
            label: 'Contact location',
            value: this.formatReviewValue(contact.contactLocation),
          },
          {
            label: 'Description',
            value: this.formatDescriptionValue(description.propertyDescription),
          },
        ],
      },
    ];
  });
  readonly aiDescriptionContextReady = computed(() => {
    this.aiListingFormsTick();
    return this.evalAiDescriptionContextReady();
  });

  readonly pageActions = computed<readonly PageHeaderAction[]>(() => {
    if (this.editingId()) {
      return [{ id: 'update-property', label: 'Save changes', variant: 'flat' }] as const;
    }
    return [
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
    ] as const;
  });

  private readonly addListingService = inject(AddListingService);
  private readonly notifications = inject(NotificationService);
  private readonly mediaUploadService = inject(MediaUploadService);
  private readonly googlePlaces = inject(GooglePlacesService);
  private readonly auth = inject(AuthService);
  private readonly subscriptionStorage = inject(SubscriptionSessionStorageService);
  private readonly subscriptionsApi = inject(SubscriptionsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly editingId = signal<string | null>(null);
  readonly editLoading = signal(false);
  readonly editLoadError = signal<string | null>(null);
  readonly loadedProperty = signal<PropertyDetailDocument | null>(null);

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
    }, { validators: mediaRequirementValidator });

    this.contactForm = this.fb.group({
      contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhoneNumber: ['', [Validators.required, contactPhoneFormatValidator]],
      contactLocation: [''],
    });

    this.locationForm = this.fb.group({
      locationQuery:     [''],
      locationHierarchy: [[] as LocationHierarchyItem[], nonEmptyArrayValidator],
      fullAddress:       ['', Validators.required],
      mapLink:           [''],
      zipCode:           [null as string | null],
      latitude:          [null as number | null],
      longitude:         [null as number | null],
    });

    merge(
      this.basicInfoForm.valueChanges,
      this.pricingForm.valueChanges,
      this.locationForm.valueChanges,
      this.amenitiesForm.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aiListingFormsTick.update((n: number) => n + 1));

    merge(
      this.basicInfoForm.valueChanges,
      this.basicInfoForm.statusChanges,
      this.pricingForm.valueChanges,
      this.pricingForm.statusChanges,
      this.locationForm.valueChanges,
      this.locationForm.statusChanges,
      this.amenitiesForm.valueChanges,
      this.amenitiesForm.statusChanges,
      this.mediaForm.valueChanges,
      this.mediaForm.statusChanges,
      this.contactForm.valueChanges,
      this.contactForm.statusChanges,
      this.descriptionForm.valueChanges,
      this.descriptionForm.statusChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.listingFormsTick.update((n: number) => n + 1));

    this.addListingService.getPropertyFeatures().subscribe({ error: () => void 0 });

    const id = (this.route.snapshot.paramMap.get('id') ?? '').trim();
    if (id) {
      this.editingId.set(id);
      this.loadPropertyForEdit(id);
    }
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

    const locationHierarchy = (location.locationHierarchy ?? []) as LocationHierarchyItem[];
    const cityName = locationHierarchy.find(i => i.level === 2)?.name ?? '';
    const areaName = (locationHierarchy.find(i => i.level === 4) ?? locationHierarchy.find(i => i.level === 3))?.name ?? '';

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
      city: cityName,
      neighborhood: areaName,
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
    if (this.editingId()) {
      if (actionId === 'update-property') {
        await this.onUpdateProperty();
      }
      return;
    }

    if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT || actionId === ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING) {
      if (this.isSubmitting()) {
        return;
      }
      if (!this.allCreateFormsValid()) {
        this.markAllListingFormsTouched();
        this.notifyMissingRequiredFields();
        return;
      }

      const publishWithFeatured =
        actionId === ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING && this.isBecomingFeatured();

      if (publishWithFeatured && !this.assertFeaturedListingQuotaAvailable()) {
        return;
      }

      this.isSubmitting.set(true);
      try {
        if (publishWithFeatured) {
          await this.consumeFeaturedListingQuota();
        }

        const uploadedMedia = await this.uploadSelectedMedia();
        const payload = this.buildPayload(uploadedMedia);

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

  onWizardStepSelected(stepKey: string): void {
    if (!this.isAddListingStepKey(stepKey)) {
      return;
    }

    this.activeStepKey.set(stepKey);
  }

  goToPreviousStep(): void {
    const previousIndex = this.activeStepIndex() - 1;
    if (previousIndex < 0) {
      return;
    }

    this.activeStepKey.set(this.stepOrder[previousIndex]);
  }

  goToNextStep(): void {
    const nextIndex = this.activeStepIndex() + 1;
    if (nextIndex >= this.stepOrder.length) {
      return;
    }

    this.activeStepKey.set(this.stepOrder[nextIndex]);
  }

  goToAiDescriptionStep(): void {
    this.activeStepKey.set('contact-description');
  }

  onExistingImageRemoved(index: number): void {
    this.existingPropertyImages.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  toggleProgressTray(): void {
    this.progressTrayOpen.update((open) => !open);
  }

  closeProgressTray(): void {
    this.progressTrayOpen.set(false);
  }

  async onReviewPrimaryAction(): Promise<void> {
    const actionId = this.editingId() ? 'update-property' : ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING;
    await this.onHeaderAction(actionId);
  }

  async onReviewSaveDraft(): Promise<void> {
    await this.onHeaderAction(ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT);
  }

  onFeaturedToggle(checked: boolean): void {
    if (!checked) {
      this.isFeatured.set(false);
      return;
    }

    if (this.wasFeaturedWhenLoaded()) {
      this.isFeatured.set(true);
      return;
    }

    if (!this.assertFeaturedListingQuotaAvailable()) {
      this.isFeatured.set(false);
      return;
    }

    this.isFeatured.set(true);
  }

  private isAddListingStepKey(stepKey: string): stepKey is AddListingStepKey {
    return this.stepOrder.some((key) => key === stepKey);
  }

  private formatReviewValue(value: unknown, fallback = 'Not provided'): string {
    if (value == null) {
      return fallback;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value.toLocaleString('en-US') : fallback;
    }

    const text = value.toString().trim();
    return text || fallback;
  }

  private formatCurrencyValue(value: unknown): string {
    if (value == null || value === '') {
      return 'Not provided';
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
      return this.formatReviewValue(value);
    }

    return `PKR ${numericValue.toLocaleString('en-US')}`;
  }

  private formatLocationHierarchyForReview(hierarchy: unknown): string {
    if (!Array.isArray(hierarchy) || !hierarchy.length) return 'Not provided';
    const items = hierarchy as LocationHierarchyItem[];
    const leaf = items[items.length - 1];
    const city = items.find(i => i.level === 2);
    if (city && city.name !== leaf.name) return `${leaf.name}, ${city.name}`;
    return leaf.name;
  }

  private formatDescriptionValue(value: unknown): string {
    const text = this.formatReviewValue(value, '');
    return text ? `${text.length.toLocaleString('en-US')} characters` : 'Not provided';
  }

  private loadPropertyForEdit(id: string): void {
    this.editLoading.set(true);
    this.editLoadError.set(null);
    forkJoin({
      doc: this.addListingService.getPropertyById(id),
      catalog: this.addListingService.getPropertyCatalog(),
      features: this.addListingService.getPropertyFeatures(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.editLoading.set(false))
      )
      .subscribe({
        next: ({ doc, catalog, features }) => {
          if (!doc) {
            this.editLoadError.set('Property could not be loaded.');
            return;
          }
          this.loadedProperty.set(doc);
          this.patchFormsFromProperty(doc, catalog, features);
        },
        error: () => {
          this.editLoadError.set('Property could not be loaded.');
        },
      });
  }

  private async onUpdateProperty(): Promise<void> {
    const id = this.editingId();
    if (!id || this.isSubmitting()) {
      return;
    }

    if (!this.allEditFormsValid()) {
      this.markAllListingFormsTouched();
      this.notifyMissingRequiredFields();
      return;
    }

    const totalImages = this.existingPropertyImages().length + ((this.mediaForm.value.images ?? []) as File[]).length;
    if (totalImages < 3) {
      this.notifications.warning('At least 3 photos are required.');
      return;
    }

    if (this.isBecomingFeatured() && !this.assertFeaturedListingQuotaAvailable()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      if (this.isBecomingFeatured()) {
        await this.consumeFeaturedListingQuota();
      } else if (this.isRemovingFeatured()) {
        await this.restoreFeaturedListingQuota();
      }

      const uploadedMedia = await this.uploadSelectedMediaForEdit();
      const payload = this.buildPayload(uploadedMedia);
      await firstValueFrom(this.addListingService.updateProperty(id, payload));
      this.notifications.success('Property updated successfully');
      await this.router.navigate(['/properties']);
    } catch (error: unknown) {
      const summary = apiErrorSummary(error);
      if (summary) {
        this.notifications.error(summary);
      } else if (error instanceof Error) {
        this.notifications.error(error.message);
      } else {
        this.handleAddListingSubmitError(error, 'update-property');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async uploadSelectedMediaForEdit(): Promise<UploadedMediaPayload> {
    const existingVideo = ((this.loadedProperty()?.videoTourUrl ?? null) || null) as string | null;
    const keptImages = this.existingPropertyImages();

    const media = this.mediaForm.value;
    const newImageFiles = (media.images ?? []) as File[];
    const videoFiles = (media.videoFiles ?? []) as File[];

    let uploadedNewImages: ListingImagePayload[] = [];
    let videoTourUrl = existingVideo;

    if (newImageFiles.length || videoFiles.length) {
      this.notifications.info('Uploading media...');
      try {
        uploadedNewImages = newImageFiles.length
          ? await this.mediaUploadService.uploadImages(newImageFiles)
          : [];
        if (videoFiles[0]) {
          videoTourUrl = await this.mediaUploadService.uploadVideo(videoFiles[0]);
        }
        this.notifications.success('Media uploaded successfully');
      } catch (error: unknown) {
        const details = apiErrorSummary(error) || 'Media upload failed';
        this.notifications.error(details);
        throw new Error(details);
      }
    }

    const mergedImages = [...keptImages, ...uploadedNewImages].map((img, index) => ({
      ...img,
      orderIndex: index,
      isThumbnail: index === 0,
    }));

    return { images: mergedImages, videoTourUrl };
  }

  private patchFormsFromProperty(
    doc: PropertyDetailDocument,
    catalog: PropertyCatalogData,
    features: PropertyFeature[]
  ): void {
    const listingTitle = (doc.listingTitle ?? doc.title ?? '').toString();
    const propertyDescription = (doc.propertyDescription ?? doc.description ?? '').toString();
    const contactPhoneNumber = (doc.contactPhoneNumber ?? doc.contactPhone ?? doc.phone ?? '').toString();
    const subtypeName = (doc.subtype ?? doc.propertySubtypeName ?? doc.propertySubtype ?? '').toString();
    const categoryName = this.resolveCategoryNameFromCatalog(catalog, {
      subtype: subtypeName,
      propertyType: (doc.propertyType ?? '').toString(),
      propertyCategoryName: (doc.propertyCategoryName ?? '').toString(),
    });

    // UI control uses 'sale'|'rent' while API often stores labels like "For Sale".
    const purposeRaw = (doc.purpose ?? '').toString().toLowerCase();
    const purpose = purposeRaw.includes('sale') ? 'sale' : 'rent';

    // Patch without emitEvent so BasicInformationSection does not clear subtype mid-load.
    this.basicInfoForm.patchValue(
      {
        purpose,
        listingTitle,
        propertyCategoryName: categoryName,
        propertySubtypeName: subtypeName,
      },
      { emitEvent: false }
    );
    this.applySubtypeValidatorsFromCatalog(catalog, categoryName);

    this.descriptionForm.patchValue({ propertyDescription }, { emitEvent: false });

    this.pricingForm.patchValue(
      {
        price: doc.price ?? 0,
        areaSize: doc.areaSize ?? 0,
        areaUnit: doc.areaUnit ?? 'sqft',
        numBedrooms: doc.numBedrooms ?? 0,
        numBathrooms: doc.numBathrooms ?? 0,
        numParkingSpaces: doc.numParkingSpaces ?? 0,
        numFloors: doc.numFloors ?? 0,
      },
      { emitEvent: false }
    );

    this.contactForm.patchValue(
      {
        contactName: doc.contactName ?? '',
        contactEmail: doc.contactEmail ?? '',
        contactPhoneNumber,
        contactLocation: doc.contactLocation ?? '',
      },
      { emitEvent: false }
    );

    const locationHierarchy = this.buildLocationHierarchyFromProperty(doc);
    const locationQueryDisplay = locationHierarchy.length
      ? locationHierarchy[locationHierarchy.length - 1].name
      : (doc.neighborhood ?? doc.city ?? '').toString().trim();
    const { latitude, longitude, mapLink } = this.resolvePropertyCoordinates(doc);

    this.locationForm.patchValue(
      {
        locationQuery: locationQueryDisplay,
        locationHierarchy,
        fullAddress: doc.fullAddress ?? '',
        mapLink,
        zipCode: (doc as any).zipCode ?? null,
        latitude,
        longitude,
      },
      // Emit when coordinates exist so the map picker moves the pin on edit load.
      { emitEvent: latitude != null && longitude != null }
    );

    if (latitude == null || longitude == null) {
      this.resolveMissingCoordinatesViaGeocode(locationQueryDisplay, doc.fullAddress ?? '');
    }

    const alreadyFeatured = doc.isFeatured === true;
    this.wasFeaturedWhenLoaded.set(alreadyFeatured);
    this.isFeatured.set(alreadyFeatured);
    this.existingPropertyImages.set((doc.images ?? []) as ListingImagePayload[]);

    const selectedFeatureIds = this.resolveSelectedFeatureIdsFromAmenityFlags(doc, features);
    // Emit so FeaturesAmenitiesSection syncs chip selection.
    this.amenitiesForm.patchValue({ selectedFeatureIds }, { emitEvent: true });

    // Media: existing uploads are URLs; current media form expects Files, so we don't prefill file inputs.
    this.refreshListingFormValidity();
    this.basicInfoForm.markAsUntouched();
    this.descriptionForm.markAsUntouched();
    this.pricingForm.markAsUntouched();
    this.contactForm.markAsUntouched();
    this.locationForm.markAsUntouched();
  }

  /** Restores location hierarchy when API only persisted city/neighborhood strings. */
  private buildLocationHierarchyFromProperty(doc: PropertyDetailDocument): LocationHierarchyItem[] {
    if (Array.isArray(doc.location) && doc.location.length > 0) {
      return doc.location.map((item) => ({
        id: item.id,
        level: item.level,
        name: item.name,
      }));
    }

    const hierarchy: LocationHierarchyItem[] = [];
    const city = (doc.city ?? '').toString().trim();
    const neighborhood = (doc.neighborhood ?? '').toString().trim();
    if (city) {
      hierarchy.push({ level: 2, name: city });
    }
    if (neighborhood) {
      hierarchy.push({ level: 4, name: neighborhood });
    }
    if (hierarchy.length === 0) {
      const fallback = (doc.fullAddress ?? '').toString().trim();
      if (fallback) {
        hierarchy.push({ level: 4, name: fallback.length > 120 ? `${fallback.slice(0, 117)}...` : fallback });
      }
    }
    return hierarchy;
  }

  private resolvePropertyCoordinates(doc: PropertyDetailDocument): {
    latitude: number | null;
    longitude: number | null;
    mapLink: string;
  } {
    const mapLink = (doc.mapLink ?? '').toString().trim();
    let latitude = coerceCoordinate(doc.latitude);
    let longitude = coerceCoordinate(doc.longitude);

    if (latitude != null && longitude != null) {
      return {
        latitude,
        longitude,
        mapLink: mapLink || `https://maps.google.com/?q=${latitude},${longitude}`,
      };
    }

    const fromLink = parseLatLngFromMapLink(mapLink);
    if (fromLink) {
      return {
        latitude: fromLink.lat,
        longitude: fromLink.lng,
        mapLink: mapLink || `https://maps.google.com/?q=${fromLink.lat},${fromLink.lng}`,
      };
    }

    return { latitude, longitude, mapLink };
  }

  /** Fills lat/lng on edit when the API omitted coordinates but address text is available. */
  private resolveMissingCoordinatesViaGeocode(locationQuery: string, fullAddress: string): void {
    const searchText = (fullAddress || locationQuery).trim();
    if (!searchText) {
      return;
    }

    const sessionToken = crypto.randomUUID();
    this.googlePlaces
      .searchPlaces(searchText, sessionToken)
      .pipe(
        take(1),
        switchMap((suggestions) => {
          const first = suggestions[0];
          if (!first?.placeId) {
            return of(null);
          }
          return this.googlePlaces.getPlaceDetails(first.placeId, sessionToken);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((details) => {
        if (!details) {
          return;
        }

        const currentLat = coerceCoordinate(this.locationForm.get('latitude')?.value);
        const currentLng = coerceCoordinate(this.locationForm.get('longitude')?.value);
        if (currentLat != null && currentLng != null) {
          return;
        }

        const mapLink =
          (this.locationForm.get('mapLink')?.value as string | null)?.trim() ||
          `https://maps.google.com/?q=${details.latitude},${details.longitude}`;

        this.locationForm.patchValue(
          {
            latitude: details.latitude,
            longitude: details.longitude,
            mapLink,
            fullAddress:
              (this.locationForm.get('fullAddress')?.value as string | null)?.trim() ||
              details.formattedAddress,
          },
          { emitEvent: true }
        );
        this.refreshListingFormValidity();
      });
  }

  private hasValidCoordinates(): boolean {
    const lat = coerceCoordinate(this.locationForm.get('latitude')?.value);
    const lng = coerceCoordinate(this.locationForm.get('longitude')?.value);
    return lat != null && lng != null;
  }

  private applySubtypeValidatorsFromCatalog(
    catalog: PropertyCatalogData,
    categoryName: string
  ): void {
    const subtypeCtrl = this.basicInfoForm.get('propertySubtypeName');
    if (!subtypeCtrl) {
      return;
    }
    const category = (catalog.categories ?? []).find((c) => c.name === categoryName);
    const subtypes = category?.subtypes ?? [];
    if (subtypes.length > 0) {
      subtypeCtrl.setValidators(Validators.required);
    } else {
      subtypeCtrl.clearValidators();
    }
    subtypeCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private refreshListingFormValidity(): void {
    for (const form of [
      this.basicInfoForm,
      this.pricingForm,
      this.locationForm,
      this.contactForm,
      this.descriptionForm,
    ]) {
      form.updateValueAndValidity({ emitEvent: true });
    }
    this.listingFormsTick.update((n) => n + 1);
  }

  private allCreateFormsValid(): boolean {
    return (
      this.basicInfoForm.valid &&
      this.pricingForm.valid &&
      this.mediaForm.valid &&
      this.contactForm.valid &&
      this.descriptionForm.valid &&
      this.locationForm.valid &&
      this.hasValidCoordinates()
    );
  }

  private allEditFormsValid(): boolean {
    return (
      this.basicInfoForm.valid &&
      this.pricingForm.valid &&
      this.contactForm.valid &&
      this.descriptionForm.valid &&
      this.locationForm.valid &&
      this.hasValidCoordinates()
    );
  }

  private markAllListingFormsTouched(): void {
    this.basicInfoForm.markAllAsTouched();
    this.pricingForm.markAllAsTouched();
    this.mediaForm.markAllAsTouched();
    this.contactForm.markAllAsTouched();
    this.descriptionForm.markAllAsTouched();
    this.locationForm.markAllAsTouched();
  }

  private notifyMissingRequiredFields(): void {
    const sections = this.collectInvalidFormSectionLabels();
    const detail = sections.length ? ` Check: ${sections.join(', ')}.` : '';
    const message = this.editingId()
      ? `Please fill all required fields before saving changes.${detail}`
      : `Please fill all required fields before uploading and submitting.${detail}`;
    this.notifications.warning(message);
  }

  private collectInvalidFormSectionLabels(): string[] {
    const invalid: string[] = [];
    if (this.basicInfoForm.invalid) {
      invalid.push('Basic information');
    }
    if (this.pricingForm.invalid) {
      invalid.push('Pricing');
    }
    if (this.locationForm.invalid || !this.hasValidCoordinates()) {
      invalid.push('Location (map pin)');
    }
    if (this.contactForm.invalid) {
      invalid.push('Contact');
    }
    if (this.descriptionForm.invalid) {
      invalid.push('Description');
    }
    if (!this.editingId() && this.mediaForm.invalid) {
      invalid.push('Media');
    }
    return invalid;
  }

  private resolveCategoryNameFromCatalog(
    catalog: PropertyCatalogData,
    input: { subtype: string; propertyType: string; propertyCategoryName: string }
  ): string {
    const direct = (input.propertyCategoryName ?? '').trim();
    if (direct) return direct;

    const subtype = (input.subtype ?? '').trim().toLowerCase();
    if (subtype) {
      const foundBySubtype = (catalog.categories ?? []).find((c) =>
        (c.subtypes ?? []).some((st) => st.name.trim().toLowerCase() === subtype)
      );
      if (foundBySubtype) return foundBySubtype.name;
    }

    const coarse = (input.propertyType ?? '').trim().toLowerCase();
    if (coarse) {
      const categories = catalog.categories ?? [];
      const exactType = categories.find((c) => c.name.trim().toLowerCase() === coarse);
      if (exactType) return exactType.name;
      const foundByType = categories.find((c) => c.name.trim().toLowerCase().includes(coarse));
      if (foundByType) return foundByType.name;
    }

    // Fallback: keep empty so required validator still prompts user if catalog mapping fails.
    return '';
  }

  private resolveSelectedFeatureIdsFromAmenityFlags(
    doc: PropertyDetailDocument,
    features: PropertyFeature[]
  ): string[] {
    const out: string[] = [];
    for (const f of features ?? []) {
      const key = FEATURE_SLUG_TO_AMENITY_KEY[normalizeFeatureSlug(f.slug)];
      if (!key) continue;
      if ((doc as any)?.[key] === true) {
        out.push(f._id);
      }
    }
    return out;
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

  private getStoredSubscription(): Subscription | null {
    const user = this.auth.getCurrentUser();
    if (!user?._id) {
      return null;
    }
    return this.subscriptionStorage.getForUser(user._id, user.agencyId ?? null);
  }

  private isBecomingFeatured(): boolean {
    return this.isFeatured() && !this.wasFeaturedWhenLoaded();
  }

  /** Property was featured when loaded and user turned featured off before save. */
  private isRemovingFeatured(): boolean {
    return this.wasFeaturedWhenLoaded() && !this.isFeatured();
  }

  private assertFeaturedListingQuotaAvailable(): boolean {
    const sub = this.getStoredSubscription();
    if (!sub?._id) {
      this.notifications.warning('No active subscription found. Choose a plan before featuring a listing.');
      return false;
    }
    if ((sub.numberOfFeatureListing ?? 0) <= 0) {
      this.notifications.warning(FEATURED_LISTING_QUOTA_MESSAGE);
      return false;
    }
    return true;
  }

  private async persistFeaturedListingQuota(nextCount: number): Promise<void> {
    const sub = this.getStoredSubscription();
    if (!sub?._id) {
      throw new Error('No active subscription found.');
    }

    const res = await firstValueFrom(
      this.subscriptionsApi.updateSubscription({
        _id: sub._id,
        numberOfFeatureListing: Math.max(0, nextCount),
      })
    );

    const updated = extractSubscriptionFromSuccessResponse(res);
    if (!updated) {
      throw new Error('Could not update subscription quota.');
    }

    this.subscriptionStorage.write(updated);
  }

  /** Decrements featured-listing quota via API and persists the updated subscription in localStorage. */
  private async consumeFeaturedListingQuota(): Promise<void> {
    const sub = this.getStoredSubscription();
    if (!sub?._id) {
      throw new Error('No active subscription found.');
    }
    if ((sub.numberOfFeatureListing ?? 0) <= 0) {
      throw new Error(FEATURED_LISTING_QUOTA_MESSAGE);
    }

    await this.persistFeaturedListingQuota(sub.numberOfFeatureListing - 1);
    this.wasFeaturedWhenLoaded.set(true);
  }

  /** Increments featured-listing quota when a listing is un-featured; syncs DB + localStorage. */
  private async restoreFeaturedListingQuota(): Promise<void> {
    const sub = this.getStoredSubscription();
    if (!sub?._id) {
      throw new Error('No active subscription found.');
    }

    await this.persistFeaturedListingQuota(sub.numberOfFeatureListing + 1);
    this.wasFeaturedWhenLoaded.set(false);
  }

  private buildPayload(uploadedMedia: UploadedMediaPayload): CreateListingPayload {
    const forms: ListingFormSnapshot = {
      basic: this.basicInfoForm.value,
      description: this.descriptionForm.value,
      pricing: this.pricingForm.value,
      contact: this.contactForm.value,
      location: this.locationForm.value,
    };

    const amenityBooleans = this.addListingService.buildAmenityBooleanPayload(
      this.amenitiesForm.value.selectedFeatureIds ?? []
    );

    return buildListingPayload(forms, uploadedMedia, amenityBooleans, this.isFeatured());
  }
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
