import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import type { CreateListingPayload } from '../../../../core/models/add-listing.model';
import {
  buildListingPayload,
  type ListingFormSnapshot,
  type UploadedMediaPayload,
} from '../../mappers/listing-payload.mapper';
import type { LocationHierarchyItem } from '../../../../core/models/google-places.models';
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ADD_LISTING_HEADER_ACTIONS } from '../../constants/add-listing.constants';
import type { ListingImagePayload } from '../../../../core/services/media-upload.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SubscriptionSessionStorageService } from '../../../../core/services/subscription-session-storage.service';
import {
  SubscriptionsApiService,
  extractSubscriptionFromSuccessResponse,
} from '../../../../core/services/subscriptions-api.service';
import type { Subscription } from '../../../../core/interfaces/subscription.models';
import { applyServerFieldErrors } from '../../../../core/http/apply-server-field-errors';
import { parseHttpApiError } from '../../../../core/http/parse-http-api-error';
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

const FEATURED_LISTING_QUOTA_MESSAGE =
  'You are out of featured listing quota. Upgrade your plan or remove another featured property.';

type AddListingStepKey =
  | 'basic-info'
  | 'pricing'
  | 'location'
  | 'features-media'
  | 'contact-description'
  | 'review-publish';

interface AddListingWizardStep  { key: AddListingStepKey; label: string; description: string; }
interface AddListingRequirement { label: string; complete: boolean; }
interface ReviewSummaryItem     { label: string; value: string; }
interface ReviewSummarySection  { title: string; icon: string; items: readonly ReviewSummaryItem[]; }

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
  ],
  templateUrl: './add-listing-page.html',
  styleUrl: './add-listing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddListingPageComponent implements AfterViewInit {

  private readonly addListingService   = inject(AddListingService);
  private readonly notifications       = inject(NotificationService);
  private readonly auth                = inject(AuthService);
  private readonly subscriptionStorage = inject(SubscriptionSessionStorageService);
  private readonly subscriptionsApi    = inject(SubscriptionsApiService);
  private readonly destroyRef          = inject(DestroyRef);
  private readonly router              = inject(Router);
  private readonly route               = inject(ActivatedRoute);

  @ViewChild(BasicInformationSectionComponent)  private readonly basicStep?:       BasicInformationSectionComponent;
  @ViewChild(PricingDetailsSectionComponent)    private readonly pricingStep?:     PricingDetailsSectionComponent;
  @ViewChild(PropertyLocationStepComponent)     private readonly locationStep?:    PropertyLocationStepComponent;
  @ViewChild(FeaturesAmenitiesSectionComponent) private readonly amenitiesStep?:   FeaturesAmenitiesSectionComponent;
  @ViewChild(PropertyMediaSectionComponent)     private readonly mediaStep?:       PropertyMediaSectionComponent;
  @ViewChild(ContactInformationStepComponent)   private readonly contactStep?:     ContactInformationStepComponent;
  @ViewChild(PropertyDescriptionStepComponent)  private readonly descriptionStep?: PropertyDescriptionStepComponent;

  basicInfoForm!:   FormGroup;
  pricingForm!:     FormGroup;
  contactForm!:     FormGroup;
  locationForm!:    FormGroup;
  descriptionForm!: FormGroup;
  amenitiesForm!:   FormGroup;
  mediaForm!:       FormGroup;

  readonly activeStepKey = signal<AddListingStepKey>('basic-info');

  private readonly stepOrder: readonly AddListingStepKey[] = [
    'basic-info', 'pricing', 'location', 'features-media', 'contact-description', 'review-publish',
  ] as const;

  private readonly stepDefinitions: readonly AddListingWizardStep[] = [
    { key: 'basic-info',          label: 'Basic Info',            description: 'Property details'               },
    { key: 'pricing',             label: 'Pricing',               description: 'Price and size'                 },
    { key: 'location',            label: 'Location',              description: "Where it's located"             },
    { key: 'features-media',      label: 'Features & Media',      description: 'Amenities, photos, and video'   },
    { key: 'contact-description', label: 'Contact & Description', description: 'Contact info and listing story' },
    { key: 'review-publish',      label: 'Review & Publish',      description: 'Final review'                   },
  ] as const;

  readonly listingSteps = computed<readonly WizardStepperItem[]>(() => {
    const activeKey   = this.activeStepKey();
    const activeIndex = this.stepOrder.indexOf(activeKey);
    const validByKey  = { ...this.stepValidityMap(), 'review-publish': this.canSubmitListing() };

    return this.stepDefinitions.map((step, index): WizardStepperItem => ({
      ...step,
      state: index === activeIndex ? 'active'
           : validByKey[step.key]  ? 'completed'
           :                         'pending',
    }));
  });

  readonly activeStepIndex      = computed(() => this.stepOrder.indexOf(this.activeStepKey()));
  readonly isFirstStep          = computed(() => this.activeStepIndex() <= 0);
  readonly isLastStep           = computed(() => this.activeStepIndex() >= this.stepOrder.length - 1);
  readonly progressPercent      = computed(() => Math.round(((this.activeStepIndex() + 1) / this.stepOrder.length) * 100));
  readonly progressDegrees      = computed(() => `${Math.round((this.progressPercent() / 100) * 360)}deg`);
  readonly activeStepLabel      = computed(() => this.stepDefinitions.find(s => s.key === this.activeStepKey())?.label ?? '');
  readonly activeStepCountLabel = computed(() => `${this.activeStepIndex() + 1} of ${this.stepOrder.length}`);
  readonly progressTrayOpen     = signal(false);

  readonly currentStepCanContinue = computed(() => {
    this.listingFormsTick();
    const key = this.activeStepKey();
    return key === 'review-publish' || (this.stepValidityMap()[key] ?? false);
  });

  ngAfterViewInit(): void {
    this.listingFormsTick.update(n => n + 1);
  }

  private readonly listingFormsTick = signal(0);

  private readonly stepValidityMap = computed(() => {
    this.listingFormsTick();
    return {
      'basic-info':          this.basicStep?.isValid()    ?? false,
      'pricing':             this.pricingStep?.isValid()  ?? false,
      'location':            this.locationStep?.isValid() ?? false,
      // mediaStep.isValid() only sees new File objects; existing server images also satisfy the requirement.
      'features-media': (this.mediaStep?.isValid() ?? false)
                     || this.existingPropertyImages().length >= 3
                     || Boolean(this.loadedProperty()?.videoTourUrl),
      'contact-description': (this.contactStep?.isValid()     ?? false)
                          && (this.descriptionStep?.isValid() ?? false),
    };
  });

  readonly publishRequirements = computed<readonly AddListingRequirement[]>(() => {
    const v     = this.stepValidityMap();
    const media = this.mediaForm?.value ?? {};
    const hasMedia =
      this.existingPropertyImages().length + ((media.images ?? []) as File[]).length >= 3 ||
      Boolean(((media.videoFiles ?? []) as File[]).length) ||
      Boolean(this.loadedProperty()?.videoTourUrl);

    return [
      { label: 'Add basic information',   complete: v['basic-info'] },
      { label: 'Add pricing and details', complete: v['pricing']    },
      { label: 'Set property location',   complete: v['location']   },
      { label: 'Add media',               complete: hasMedia        },
      { label: 'Add contact information', complete: this.contactStep?.isValid()     ?? false },
      { label: 'Write description',       complete: this.descriptionStep?.isValid() ?? false },
    ];
  });

  readonly completedRequirementCount = computed(
    () => this.publishRequirements().filter(r => r.complete).length
  );

  readonly progressPanelSteps = computed<readonly ListingProgressStep[]>(() => {
    const snapshot = this.formSnapshot();
    const hasFeaturesOrMedia = Boolean(
      (snapshot.amenities.selectedFeatureIds ?? []).length ||
      (snapshot.media.images    ?? []).length >= 3 ||
      (snapshot.media.videoFiles ?? []).length
    );

    const readinessByStep: Record<AddListingStepKey, boolean> = {
      ...this.stepValidityMap(),
      'features-media': hasFeaturesOrMedia,
      'review-publish': this.canSubmitListing(),
    };

    return this.listingSteps().map(step => ({
      ...step,
      readiness:      readinessByStep[step.key as AddListingStepKey] ? 'complete' : 'attention',
      readinessLabel: readinessByStep[step.key as AddListingStepKey] ? 'Ready'    : 'Needs input',
    }));
  });

  readonly completedProgressStepCount = computed(
    () => this.progressPanelSteps().filter(s => s.readiness === 'complete').length
  );

  readonly canSubmitListing = computed(() =>
    this.publishRequirements().filter(r => r.label !== 'Add media').every(r => r.complete)
  );

  readonly isSubmitting           = signal(false);
  readonly isFeatured             = signal(false);
  private readonly wasFeaturedWhenLoaded = signal(false);
  readonly existingPropertyImages = signal<ListingImagePayload[]>([]);

  readonly reviewPrimaryActionLabel = computed(() => this.editingId() ? 'Save changes' : 'Publish Listing');

  private readonly formSnapshot = computed(() => {
    this.listingFormsTick();
    return {
      basic:       this.basicInfoForm?.getRawValue()   ?? {},
      pricing:     this.pricingForm?.getRawValue()     ?? {},
      location:    this.locationForm?.getRawValue()    ?? {},
      amenities:   this.amenitiesForm?.getRawValue()   ?? { selectedFeatureIds: [] },
      media:       this.mediaForm?.getRawValue()       ?? { images: [], videoFiles: [] },
      contact:     this.contactForm?.getRawValue()     ?? {},
      description: this.descriptionForm?.getRawValue() ?? {},
    };
  });

  readonly reviewSummarySections = computed<readonly ReviewSummarySection[]>(() => {
    const { basic, pricing, location, amenities, media, contact, description } = this.formSnapshot();

    const propertyTypeName = this.addListingService.getSubtypeNameById(basic.propertyTypeId, basic.subtypeId)
                          || this.addListingService.getCategoryNameById(basic.propertyTypeId);
    const categoryName     = this.addListingService.getCategoryNameById(basic.propertyTypeId);
    const areaLabel        = [this.formatReviewValue(pricing.areaSize, ''), this.formatReviewValue(pricing.areaUnit, '')].filter(Boolean).join(' ') || 'Not provided';
    const locationLabel    = this.formatLocationHierarchyForReview(location.locationHierarchy);
    const coordinatesSet   = location.latitude != null && location.longitude != null;
    const amenityCount     = ((amenities.selectedFeatureIds ?? []) as string[]).length;
    const photoCount       = ((media.images    ?? []) as File[]).length;
    const videoName        = ((media.videoFiles ?? []) as File[])[0]?.name ?? 'Not selected';
    const descriptionValue = this.formatDescriptionValue(description.propertyDescription);

    return [
      {
        title: 'Listing basics', icon: 'home_work',
        items: [
          { label: 'Purpose',        value: basic.purpose === 'sale' ? 'For Sale' : 'For Rent' },
          { label: 'Listing title',  value: this.formatReviewValue(basic.listingTitle)          },
          { label: 'Property type',  value: this.formatReviewValue(propertyTypeName)            },
          { label: 'Category',       value: this.formatReviewValue(categoryName)                },
        ],
      },
      {
        title: 'Pricing and details', icon: 'payments',
        items: [
          { label: 'Price',          value: this.formatCurrencyValue(pricing.price)          },
          { label: 'Area size',      value: areaLabel                                        },
          { label: 'Bedrooms',       value: this.formatReviewValue(pricing.numBedrooms)      },
          { label: 'Bathrooms',      value: this.formatReviewValue(pricing.numBathrooms)     },
          { label: 'Parking spaces', value: this.formatReviewValue(pricing.numParkingSpaces) },
          { label: 'Floors',         value: this.formatReviewValue(pricing.numFloors)        },
        ],
      },
      {
        title: 'Location', icon: 'location_on',
        items: [
          { label: 'Location',     value: locationLabel                                         },
          { label: 'Full address', value: this.formatReviewValue(location.fullAddress)          },
          { label: 'Map pin',      value: coordinatesSet ? 'Selected' : 'Not set'              },
        ],
      },
      {
        title: 'Features and media', icon: 'perm_media',
        items: [
          { label: 'Amenities',  value: amenityCount ? `${amenityCount} selected` : 'None selected' },
          { label: 'Photos',     value: photoCount   ? `${photoCount} selected`   : 'None selected' },
          { label: 'Video tour', value: videoName                                                    },
        ],
      },
      {
        title: 'Contact and description', icon: 'contact_phone',
        items: [
          { label: 'Contact name',     value: this.formatReviewValue(contact.contactName)        },
          { label: 'Email',            value: this.formatReviewValue(contact.contactEmail)       },
          { label: 'Phone',            value: this.formatReviewValue(contact.contactPhoneNumber) },
          { label: 'Contact location', value: this.formatReviewValue(contact.contactLocation)    },
          { label: 'Description',      value: descriptionValue                                   },
        ],
      },
    ];
  });

  readonly pageActions = computed<readonly PageHeaderAction[]>(() => {
    if (this.editingId()) {
      return [{ id: 'update-property', label: 'Save changes', variant: 'flat' }] as const;
    }
    return [
      { id: ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT,       label: 'Save Draft',      variant: 'stroked' },
      { id: ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING,  label: 'Publish Listing', variant: 'flat'    },
    ] as const;
  });

  readonly aiRequestBody = computed<GenerateListingDescriptionRequest | null>(() => {
    if (!(this.basicStep?.isValid()    ?? false)) return null;
    if (!(this.pricingStep?.isValid()  ?? false)) return null;
    if (!(this.locationStep?.isValid() ?? false)) return null;

    const { basic, pricing, amenities, contact, location } = this.formSnapshot();
    const featureIds = (amenities.selectedFeatureIds ?? []) as string[];
    if (!featureIds.length) return null;

    const purpose           = basic.purpose === 'sale' ? ('For Sale' as const) : ('For Rent' as const);
    const coarseType        = this.addListingService.getCoarseTypeById(basic.propertyTypeId);
    const categoryName      = this.addListingService.getCategoryNameById(basic.propertyTypeId);
    const subtypeName       = this.addListingService.getSubtypeNameById(basic.propertyTypeId, basic.subtypeId);
    const subtype           = (subtypeName || categoryName).trim();
    const locationHierarchy = (location.locationHierarchy ?? []) as LocationHierarchyItem[];
    const cityName          = locationHierarchy.find(i => i.level === 2)?.name ?? '';
    const areaName          = (locationHierarchy.find(i => i.level === 4) ?? locationHierarchy.find(i => i.level === 3))?.name ?? '';

    return {
      title:            (basic.listingTitle ?? '').trim(),
      purpose,
      propertyType:     coarseType,
      subtype,
      featureIds,
      price:            pricing.price,
      areaSize:         pricing.areaSize,
      areaUnit:         pricing.areaUnit,
      numBedrooms:      pricing.numBedrooms,
      numBathrooms:     pricing.numBathrooms,
      numParkingSpaces: pricing.numParkingSpaces,
      numFloors:        pricing.numFloors,
      city:               cityName,
      neighborhood:       areaName,
      fullAddress:        location.fullAddress,
      mapLink:            location.mapLink,
      latitude:           location.latitude,
      longitude:          location.longitude,
      contactName:        contact.contactName,
      contactEmail:       contact.contactEmail,
      contactPhoneNumber: contact.contactPhoneNumber,
      contactLocation:    contact.contactLocation,
    };
  });

  readonly editingId      = signal<string | null>(null);
  readonly editLoading    = signal(false);
  readonly editLoadError  = signal<string | null>(null);
  readonly loadedProperty = signal<PropertyDetailDocument | null>(null);

  constructor() {
    const id = (this.route.snapshot.paramMap.get('id') ?? '').trim();
    if (id) {
      this.editingId.set(id);
      this.loadPropertyForEdit(id);
    }
  }

  onFormReady(key: 'basicInfo' | 'pricing' | 'contact' | 'description' | 'amenities' | 'media' | 'location', form: FormGroup): void {
    const assign: Record<typeof key, (f: FormGroup) => void> = {
      basicInfo:   f => this.basicInfoForm   = f,
      pricing:     f => this.pricingForm     = f,
      contact:     f => this.contactForm     = f,
      description: f => this.descriptionForm = f,
      amenities:   f => this.amenitiesForm   = f,
      media:       f => this.mediaForm       = f,
      location:    f => this.locationForm    = f,
    };
    assign[key](form);
    this.wireFormToTicks(form);
  }

  private wireFormToTicks(form: FormGroup): void {
    form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.listingFormsTick.update(n => n + 1));
    this.listingFormsTick.update(n => n + 1);
  }

  onWizardStepSelected(stepKey: string): void {
    if (!this.isAddListingStepKey(stepKey)) return;
    const targetIndex = this.stepOrder.indexOf(stepKey);
    if (targetIndex <= this.activeStepIndex()) { this.activeStepKey.set(stepKey); return; }
    const v = this.stepValidityMap();
    if (this.stepOrder.slice(0, targetIndex).every(key => v[key as keyof typeof v] ?? true)) {
      this.activeStepKey.set(stepKey);
    }
  }

  goToNextStep(): void {
    const next = this.activeStepIndex() + 1;
    if (next < this.stepOrder.length) this.activeStepKey.set(this.stepOrder[next]);
  }

  goToPreviousStep(): void {
    const prev = this.activeStepIndex() - 1;
    if (prev >= 0) this.activeStepKey.set(this.stepOrder[prev]);
  }

  goToAiDescriptionStep(): void { this.activeStepKey.set('contact-description'); }

  toggleProgressTray(): void { this.progressTrayOpen.update(open => !open); }
  closeProgressTray(): void  { this.progressTrayOpen.set(false); }

  onExistingImageRemoved(index: number): void {
    this.existingPropertyImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  scrollToTop(): void { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async onHeaderAction(actionId: string): Promise<void> {
    if (actionId === 'update-property')                               await this.onUpdateProperty();
    else if (actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT)      await this.onSaveDraft();
    else if (actionId === ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING) await this.onPublishListing();
  }

  async onReviewPrimaryAction(): Promise<void> {
    await (this.editingId() ? this.onUpdateProperty() : this.onPublishListing());
  }

  async onReviewSaveDraft(): Promise<void> { await this.onSaveDraft(); }

  onFeaturedToggle(checked: boolean): void {
    if (!checked)                                    { this.isFeatured.set(false); return; }
    if (this.wasFeaturedWhenLoaded())                { this.isFeatured.set(true);  return; }
    if (!this.assertFeaturedListingQuotaAvailable()) { this.isFeatured.set(false); return; }
    this.isFeatured.set(true);
  }

  private async onPublishListing(): Promise<void> {
    if (this.isSubmitting()) return;
    if (!this.allFormsValid(true)) { this.markAllListingFormsTouched(); this.notifyMissingRequiredFields(); return; }
    if (this.isBecomingFeatured() && !this.assertFeaturedListingQuotaAvailable()) return;

    this.isSubmitting.set(true);
    try {
      if (this.isBecomingFeatured()) await this.consumeFeaturedListingQuota();
      const payload = this.buildPayload(await this.mediaStep!.uploadForCreate());
      await firstValueFrom(this.addListingService.createListing(payload));
      this.notifications.success('Property added successfully');
      await this.router.navigate(['/properties']);
    } catch (error: unknown) {
      this.handleAddListingSubmitError(error, ADD_LISTING_HEADER_ACTIONS.PUBLISH_LISTING);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async onSaveDraft(): Promise<void> {
    if (this.isSubmitting()) return;
    if (!this.allFormsValid(true)) { this.markAllListingFormsTouched(); this.notifyMissingRequiredFields(); return; }

    this.isSubmitting.set(true);
    try {
      const payload = this.buildPayload(await this.mediaStep!.uploadForCreate());
      await firstValueFrom(this.addListingService.saveDraft(payload));
      this.notifications.success('Draft saved successfully');
      await this.router.navigate(['/properties']);
    } catch (error: unknown) {
      this.handleAddListingSubmitError(error, ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async onUpdateProperty(): Promise<void> {
    const id = this.editingId();
    if (!id || this.isSubmitting()) return;
    if (!this.allFormsValid()) { this.markAllListingFormsTouched(); this.notifyMissingRequiredFields(); return; }

    const totalImages = this.existingPropertyImages().length + ((this.mediaForm?.value.images ?? []) as File[]).length;
    if (totalImages < 3) { this.notifications.warning('At least 3 photos are required.'); return; }
    if (this.isBecomingFeatured() && !this.assertFeaturedListingQuotaAvailable()) return;

    this.isSubmitting.set(true);
    try {
      if (this.isBecomingFeatured())      await this.consumeFeaturedListingQuota();
      else if (this.isRemovingFeatured()) await this.restoreFeaturedListingQuota();
      const payload = this.buildPayload(await this.mediaStep!.uploadForEdit());
      await firstValueFrom(this.addListingService.updateProperty(id, payload));
      this.notifications.success('Property updated successfully');
      await this.router.navigate(['/properties']);
    } catch (error: unknown) {
      this.handleAddListingSubmitError(error, 'update-property');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private buildPayload(uploadedMedia: UploadedMediaPayload): CreateListingPayload {
    const forms: ListingFormSnapshot = {
      basic:       this.basicInfoForm.getRawValue(),
      description: this.descriptionForm.getRawValue(),
      pricing:     this.pricingForm.getRawValue(),
      amenities:   this.amenitiesForm.getRawValue(),
      contact:     this.contactForm.getRawValue(),
      location:    this.locationForm.getRawValue(),
    };
    return buildListingPayload(forms, uploadedMedia, this.isFeatured());
  }

  private handleAddListingSubmitError(error: unknown, actionId: string): void {
    const parsed   = parseHttpApiError(error);
    const fallback = actionId === ADD_LISTING_HEADER_ACTIONS.SAVE_DRAFT ? 'Failed to save draft' : 'Failed to publish listing';
    this.notifications.error(parsed.summary || fallback);
    applyServerFieldErrors(
      parsed.fieldErrors,
      [
        { form: this.basicInfoForm,   map: ADD_LISTING_BASIC_INFO_API_MAP  },
        { form: this.descriptionForm, map: ADD_LISTING_DESCRIPTION_API_MAP },
        { form: this.pricingForm,     map: ADD_LISTING_PRICING_API_MAP     },
        { form: this.locationForm,    map: ADD_LISTING_LOCATION_API_MAP    },
        { form: this.contactForm,     map: ADD_LISTING_CONTACT_API_MAP     },
      ],
      this.destroyRef
    );
  }

  private loadPropertyForEdit(id: string): void {
    this.editLoading.set(true);
    this.editLoadError.set(null);
    this.addListingService.getPropertyById(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.editLoading.set(false)))
      .subscribe({
        next: doc => {
          if (!doc) { this.editLoadError.set('Property could not be loaded.'); return; }
          this.loadedProperty.set(doc);
          this.patchFormsFromProperty(doc);
        },
        error: () => this.editLoadError.set('Property could not be loaded.'),
      });
  }

  private patchFormsFromProperty(doc: PropertyDetailDocument): void {
    this.basicStep?.patchFromProperty(doc);
    this.pricingStep?.patchFromProperty(doc);
    this.contactStep?.patchFromProperty(doc);
    this.descriptionStep?.patchFromProperty(doc);
    this.amenitiesStep?.patchFromProperty(doc);
    this.locationStep?.patchFromProperty(doc);

    this.wasFeaturedWhenLoaded.set(doc.isFeatured === true);
    this.isFeatured.set(doc.isFeatured === true);
    this.existingPropertyImages.set((doc.images ?? []) as ListingImagePayload[]);

    this.refreshListingFormValidity();
    [this.basicInfoForm, this.pricingForm, this.contactForm, this.descriptionForm, this.locationForm]
      .forEach(form => form?.markAsUntouched());
  }

  private allFormsValid(includeMedia = false): boolean {
    return (
      this.basicInfoForm.valid   &&
      this.pricingForm.valid     &&
      this.contactForm.valid     &&
      this.descriptionForm.valid &&
      this.locationForm.valid    &&
      (this.locationStep?.hasCoordinates() ?? false) &&
      (!includeMedia || this.mediaForm.valid)
    );
  }

  private markAllListingFormsTouched(): void {
    [this.basicInfoForm, this.pricingForm, this.mediaForm, this.contactForm, this.descriptionForm, this.locationForm]
      .forEach(form => form?.markAllAsTouched());
  }

  private notifyMissingRequiredFields(): void {
    const sections = this.collectInvalidFormSectionLabels();
    const detail   = sections.length ? ` Check: ${sections.join(', ')}.` : '';
    const message  = this.editingId()
      ? `Please fill all required fields before saving changes.${detail}`
      : `Please fill all required fields before uploading and submitting.${detail}`;
    this.notifications.warning(message);
  }

  private collectInvalidFormSectionLabels(): string[] {
    const invalid: string[] = [];
    if (this.basicInfoForm.invalid)                                                   invalid.push('Basic information');
    if (this.pricingForm.invalid)                                                     invalid.push('Pricing');
    if (this.locationForm.invalid || !(this.locationStep?.hasCoordinates() ?? false)) invalid.push('Location (map pin)');
    if (this.contactForm.invalid)                                                     invalid.push('Contact');
    if (this.descriptionForm.invalid)                                                 invalid.push('Description');
    if (!this.editingId() && this.mediaForm.invalid)                                  invalid.push('Media');
    return invalid;
  }

  private refreshListingFormValidity(): void {
    for (const form of [this.basicInfoForm, this.pricingForm, this.locationForm, this.contactForm, this.descriptionForm]) {
      form?.updateValueAndValidity({ emitEvent: true });
    }
    this.listingFormsTick.update(n => n + 1);
  }

  private getStoredSubscription(): Subscription | null {
    const user = this.auth.getCurrentUser();
    return user?._id ? this.subscriptionStorage.getForUser(user._id, user.agencyId ?? null) : null;
  }

  private isBecomingFeatured(): boolean { return this.isFeatured() && !this.wasFeaturedWhenLoaded(); }
  private isRemovingFeatured(): boolean { return this.wasFeaturedWhenLoaded() && !this.isFeatured(); }

  private assertFeaturedListingQuotaAvailable(): boolean {
    const sub = this.getStoredSubscription();
    if (!sub?._id)                              { this.notifications.warning('No active subscription found. Choose a plan before featuring a listing.'); return false; }
    if ((sub.numberOfFeatureListing ?? 0) <= 0) { this.notifications.warning(FEATURED_LISTING_QUOTA_MESSAGE); return false; }
    return true;
  }

  private async persistFeaturedListingQuota(nextCount: number): Promise<void> {
    const sub = this.getStoredSubscription();
    if (!sub?._id) throw new Error('No active subscription found.');
    const res     = await firstValueFrom(this.subscriptionsApi.updateSubscription({ _id: sub._id, numberOfFeatureListing: Math.max(0, nextCount) }));
    const updated = extractSubscriptionFromSuccessResponse(res);
    if (!updated) throw new Error('Could not update subscription quota.');
    this.subscriptionStorage.write(updated);
  }

  private async consumeFeaturedListingQuota(): Promise<void> {
    const sub = this.getStoredSubscription();
    if (!sub?._id) throw new Error('No active subscription found.');
    if ((sub.numberOfFeatureListing ?? 0) <= 0) throw new Error(FEATURED_LISTING_QUOTA_MESSAGE);
    await this.persistFeaturedListingQuota(sub.numberOfFeatureListing - 1);
    this.wasFeaturedWhenLoaded.set(true);
  }

  private async restoreFeaturedListingQuota(): Promise<void> {
    const sub = this.getStoredSubscription();
    if (!sub?._id) throw new Error('No active subscription found.');
    await this.persistFeaturedListingQuota(sub.numberOfFeatureListing + 1);
    this.wasFeaturedWhenLoaded.set(false);
  }

  private formatReviewValue(value: unknown, fallback = 'Not provided'): string {
    if (value == null) return fallback;
    if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('en-US') : fallback;
    return value.toString().trim() || fallback;
  }

  private formatCurrencyValue(value: unknown): string {
    if (value == null || value === '') return 'Not provided';
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? `PKR ${n.toLocaleString('en-US')}` : this.formatReviewValue(value);
  }

  private formatLocationHierarchyForReview(hierarchy: unknown): string {
    if (!Array.isArray(hierarchy) || !hierarchy.length) return 'Not provided';
    const items = hierarchy as LocationHierarchyItem[];
    const leaf  = items[items.length - 1];
    const city  = items.find(i => i.level === 2);
    return city && city.name !== leaf.name ? `${leaf.name}, ${city.name}` : leaf.name;
  }

  private formatDescriptionValue(value: unknown): string {
    const text = this.formatReviewValue(value, '');
    return text ? `${text.length.toLocaleString('en-US')} characters` : 'Not provided';
  }

  private isAddListingStepKey(stepKey: string): stepKey is AddListingStepKey {
    return this.stepOrder.some(k => k === stepKey);
  }
}
