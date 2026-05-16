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
import { forkJoin, merge } from 'rxjs';
import { finalize } from 'rxjs/operators';
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
import type { AddListingModel } from '../../../../core/models/add-listing.model';
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';
import type { PropertyCatalogData } from '../../../../core/models/property-catalog.model';
import type { PropertyFeature } from '../../../../core/models/property-features.model';
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
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import {
  FEATURE_SLUG_TO_AMENITY_KEY,
  normalizeFeatureSlug,
} from '../../../../core/constants/listing-payload.constants';
import { CdkAutofill } from "@angular/cdk/text-field";

interface UploadedMediaPayload {
  images: ListingImagePayload[];
  videoTourUrl: string | null;
}

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
    TranslateModule,
    MatIconModule,
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
    const hasMedia = Boolean((media.images ?? []).length || (media.videoFiles ?? []).length);

    return [
      { label: 'Add basic information', complete: this.basicInfoForm.valid },
      { label: 'Add pricing and details', complete: this.pricingForm.valid },
      { label: 'Set property location', complete: this.locationForm.valid },
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
      (media.images ?? []).length ||
      (media.videoFiles ?? []).length
    );

    const readinessByStep: Record<AddListingStepKey, boolean> = {
      'basic-info': this.basicInfoForm.valid,
      pricing: this.pricingForm.valid,
      location: this.locationForm.valid,
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
            label: 'City',
            value: this.formatReviewValue(locationCityFormValueToString(location.city)),
          },
          {
            label: 'Area',
            value: this.formatReviewValue(location.neighborhood),
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly editingId = signal<string | null>(null);
  readonly editLoading = signal(false);
  readonly editLoadError = signal<string | null>(null);
  private readonly loadedProperty = signal<PropertyDetailDocument | null>(null);

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
      this.notifications.warning('Please fill all required fields before saving changes.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const uploadedMedia = await this.uploadSelectedMediaForEdit();
      const payload = this.buildPayload(uploadedMedia);
      await firstValueFrom(this.addListingService.updateProperty(id, payload));
      this.notifications.success('Property updated successfully');
      await this.router.navigate(['/properties']);
    } catch (error: unknown) {
      this.handleAddListingSubmitError(error, 'update-property');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async uploadSelectedMediaForEdit(): Promise<UploadedMediaPayload> {
    const existing = this.loadedProperty();
    const existingImages = (existing?.images ?? []) as ListingImagePayload[];
    const existingVideo = ((existing?.videoTourUrl ?? null) || null) as string | null;

    const media = this.mediaForm.value;
    const images = (media.images ?? []) as File[];
    const videoFiles = (media.videoFiles ?? []) as File[];

    // If user didn't pick new files, keep the existing URLs (avoid wiping media on update).
    if (!images.length && !videoFiles.length) {
      return { images: existingImages, videoTourUrl: existingVideo };
    }

    // If they picked new media, upload and replace those fields.
    return await this.uploadSelectedMedia();
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

    // Patch in two steps so the BasicInformationSection subscription can populate available subtypes.
    // 1) Set category with emitEvent=true (it clears subtype internally).
    // 2) Re-apply subtype after that (emitEvent=false to avoid a second clear).
    this.basicInfoForm.patchValue(
      {
        purpose,
        listingTitle,
      },
      { emitEvent: false }
    );
    this.basicInfoForm.get('propertyCategoryName')?.setValue(categoryName, { emitEvent: true });
    this.basicInfoForm.get('propertySubtypeName')?.setValue(subtypeName, { emitEvent: false });
    this.basicInfoForm.get('propertySubtypeName')?.updateValueAndValidity({ emitEvent: false });

    this.descriptionForm.patchValue({ propertyDescription }, { emitEvent: false });

    this.pricingForm.patchValue(
      {
        price: doc.price ?? null,
        areaSize: doc.areaSize ?? null,
        areaUnit: doc.areaUnit ?? 'sqft',
        numBedrooms: doc.numBedrooms ?? 0,
        numBathrooms: doc.numBathrooms ?? 0,
        numParkingSpaces: doc.numParkingSpaces ?? 0,
        numFloors: doc.numFloors ?? 0,
      },
      // Emit once so the OnPush pricing section repaints counters/fields.
      { emitEvent: true }
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

    this.locationForm.patchValue(
      {
        city: doc.city ?? '',
        neighborhood: doc.neighborhood ?? '',
        fullAddress: doc.fullAddress ?? '',
        mapLink: doc.mapLink ?? '',
        latitude: doc.latitude ?? null,
        longitude: doc.longitude ?? null,
      },
      { emitEvent: false }
    );

    const selectedFeatureIds = this.resolveSelectedFeatureIdsFromAmenityFlags(doc, features);
    // Emit so FeaturesAmenitiesSection syncs chip selection.
    this.amenitiesForm.patchValue({ selectedFeatureIds }, { emitEvent: true });

    // Media: existing uploads are URLs; current media form expects Files, so we don't prefill file inputs.
    this.basicInfoForm.markAsUntouched();
    this.descriptionForm.markAsUntouched();
    this.pricingForm.markAsUntouched();
    this.contactForm.markAsUntouched();
    this.locationForm.markAsUntouched();
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
      const foundByType = (catalog.categories ?? []).find((c) =>
        c.name.trim().toLowerCase().includes(coarse)
      );
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

  private buildPayload(uploadedMedia: UploadedMediaPayload): AddListingModel {
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
      basicInformation: {
        purpose,
        propertyType,
        subtype,
        propertyCategoryName: categoryName,
        propertySubtypeName: subtypeName,
        title: basic.listingTitle,
        description: description.propertyDescription,
      },
      pricingDetails: {
        price: pricing.price,
        area: pricing.areaSize,
        areaUnit: pricing.areaUnit,
        bedrooms: pricing.numBedrooms,
        bathrooms: pricing.numBathrooms,
      },
      featuresAmenities: {
        amenities: amenities.selectedFeatureIds ?? [],
      },
      propertyMedia: {
        media: [
          ...(uploadedMedia.images ?? []).map((img) => ({
            type: 'photo',
            url: img?.url,
          })),
          ...(uploadedMedia.videoTourUrl
            ? [{ type: 'video', url: uploadedMedia.videoTourUrl }]
            : []),
        ],
      },
      location: {
        city: locationCityFormValueToString(location.city),
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
      },
      contactInformation: {
        contactName: contact.contactName,
        contactEmail: contact.contactEmail,
        contactPhone: contact.contactPhoneNumber,
      },
      /** Preserve the boolean amenity keys the current API expects. */
      ...(amenityBooleans as unknown as Record<string, unknown>),
      /** Preserve the flat location/contact fields the current API expects. */
      ...( {
        contactLocation: contact.contactLocation,
        neighborhood: location.neighborhood,
        fullAddress: location.fullAddress,
        mapLink: location.mapLink,
      } as unknown as Record<string, unknown>),
      /** Preserve media arrays used elsewhere in the app/API today. */
      ...( {
        images: uploadedMedia.images,
        videoTourUrl: uploadedMedia.videoTourUrl,
      } as unknown as Record<string, unknown>),
      /** Preserve flat pricing fields used elsewhere in the app/API today. */
      ...( {
        price: pricing.price,
        areaSize: pricing.areaSize,
        areaUnit: pricing.areaUnit,
        numBedrooms: pricing.numBedrooms,
        numBathrooms: pricing.numBathrooms,
        numParkingSpaces: pricing.numParkingSpaces,
        numFloors: pricing.numFloors,
      } as unknown as Record<string, unknown>),
    } as AddListingModel;
  }
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
