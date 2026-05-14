# LocateHome Admin Add Listing Stepper Redesign Task Tracker

This file is the single source of truth for redesigning the LocateHome Admin Add Listing page into a professional multi-step listing creation flow.

Future Codex runs should only need this prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

## Project Context

- Project: LocateHome Admin Angular project.
- Feature area: `src/app/features/add-listing`.
- Goal: Redesign the current long Add Listing form into a polished real-estate admin multi-step listing creation wizard.
- This task concerns the admin-side Add Listing experience, not public marketing pages.
- Use the current LocateHome admin deep blue + gray token system.
- Do not use the older peach/coral theme.
- Do not change or add design tokens.
- Do not create a new theme file.
- Do not hardcode random new colors.
- Keep fixed admin/header/sidebar conventions consistent with the rest of the app.
- No existing functionality should break.
- No existing data bindings should be removed.
- Preserve current add/edit listing behavior.

## Current Phase

Current phase: **Phase 10 - Responsive, accessibility, and final polish**

Phase 0 was completed by inspection only. No Add Listing implementation files were edited during Phase 0.

## Reference Design Direction

The user provided reference images in chat on 2026-05-14. Future agents should rely on this written direction if image context is unavailable:

- Professional multi-step wizard for real-estate listing creation.
- Deep blue + gray LocateHome admin theme.
- Clean white cards.
- Subtle borders.
- Soft shadows.
- Rounded corners.
- Stronger visual hierarchy.
- Better spacing and alignment.
- Productive admin-console feel, not a marketing landing page.
- Right-side summary/progress panel if the layout supports it.

## Echo-Loop Workflow

This is a Ralph Wiggum / echo-loop workflow:

- Work one small phase at a time.
- At the start of every future run, read this markdown file.
- Identify the current phase from this file.
- Implement only the current phase.
- Do not implement multiple phases in one run.
- Do not jump ahead.
- After completing the phase, update this markdown file.
- Mark a phase complete only if implementation and checks are successful.
- Record changed files.
- Record what changed.
- Record preserved bindings/handlers relevant to the phase.
- Record assumptions/risks.
- Set the next phase as current.
- Add a ready-to-copy next prompt.
- Stop.

## Per-Run Process

Every future Codex run must:

1. Read `docs/add-listing-stepper-redesign-tasks.md`.
2. Read relevant `docs/agent/context-pack` files if needed.
3. Find the current phase.
4. Implement only that phase.
5. Avoid unrelated changes.
6. Preserve existing functionality and bindings.
7. Use existing design tokens only.
8. Run available checks such as build/lint/typecheck.
9. Update `docs/add-listing-stepper-redesign-tasks.md`.
10. Mark the phase complete only if successful.
11. List changed files.
12. List preserved bindings/handlers relevant to the phase.
13. Add notes/risks.
14. Set the next phase as current.
15. Add a ready-to-copy next prompt.
16. Stop without implementing the next phase.

Ready-to-copy next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

## Context Pack Files Read In Phase 0

- `docs/agent/context-pack/00_OVERVIEW.md`
- `docs/agent/context-pack/01_ARCHITECTURE.md`
- `docs/agent/context-pack/03_REUSABLE_COMPONENTS.md`
- `docs/agent/context-pack/04_DEVELOPMENT_RULES.md`
- `docs/agent/context-pack/05_API_AND_DATA_FLOW.md`
- `docs/scss-system.md`

Note: the user initially referred to `docs/context-pack`; in this repository, the context pack is under `docs/agent/context-pack`.

## Add Listing Files Inspected In Phase 0

- `src/app/features/add-listing/add-listing.routes.ts`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.html`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.scss`
- `src/app/features/add-listing/constants/add-listing.constants.ts`
- `src/app/features/add-listing/constants/add-listing-api-field-maps.ts`
- `src/app/features/add-listing/components/basic-information-section/basic-information-section.ts`
- `src/app/features/add-listing/components/basic-information-section/basic-information-section.html`
- `src/app/features/add-listing/components/pricing-details-section/pricing-details-section.ts`
- `src/app/features/add-listing/components/pricing-details-section/pricing-details-section.html`
- `src/app/features/add-listing/components/features-amenities-section/features-amenities-section.ts`
- `src/app/features/add-listing/components/features-amenities-section/features-amenities-section.html`
- `src/app/features/add-listing/components/property-media-section/property-media-section.ts`
- `src/app/features/add-listing/components/property-media-section/property-media-section.html`
- `src/app/features/add-listing/components/property-location-step/property-location-step.ts`
- `src/app/features/add-listing/components/property-location-step/property-location-step.html`
- `src/app/features/add-listing/components/contact-information-step/contact-information-step.ts`
- `src/app/features/add-listing/components/contact-information-step/contact-information-step.html`
- `src/app/features/add-listing/components/property-description-step/property-description-step.ts`
- `src/app/features/add-listing/components/property-description-step/property-description-step.html`
- `src/app/features/add-listing/components/location-map-picker/location-map-picker.ts`
- `src/app/features/add-listing/components/location-map-picker/location-map-picker.html`

## Shared/Core Files Inspected In Phase 0

- `src/app/shared/ui/step-card/step-card.ts`
- `src/app/shared/ui/step-card/step-card.html`
- `src/app/shared/ui/step-card/step-card.scss`
- `src/app/shared/ui/segmented-tabs/segmented-tabs.component.ts`
- `src/app/shared/ui/segmented-tabs/segmented-tabs.component.html`
- `src/app/shared/ui/segmented-option-group/segmented-option-group.ts`
- `src/app/shared/ui/section-card/section-card.ts`
- `src/app/shared/ui/upload-dropzone/upload-dropzone.ts`
- `src/app/core/services/add-listing.service.ts`
- `src/app/core/services/media-upload.service.ts`
- `src/app/core/services/location-catalog.service.ts`
- `src/app/core/services/geolocation.service.ts`
- `src/app/core/models/add-listing.model.ts`
- `src/styles.scss`
- `src/styles/_theme-colors.scss`

## Existing Add Listing Route and Page Structure

- Route entry: `src/app/features/add-listing/add-listing.routes.ts`.
- Route path `''` renders `AddListingPageComponent`.
- Route path `':id'` renders the same `AddListingPageComponent` for edit mode and has title `Edit listing`.
- Top-level app route lazy-loads this feature at `/add-listing`.
- The page currently uses `PageHeaderComponent` with save/publish/update actions.
- The page layout is a two-column Bootstrap grid:
  - Left column: basic info, pricing, features/amenities, media, back-to-top button.
  - Right column: location, contact, description.
- Edit mode loads an existing property by id and patches the same forms.

## Existing Form Structure Summary

`AddListingPageComponent` owns these reactive forms:

- `basicInfoForm`
  - `purpose`
  - `propertyCategoryName`
  - `propertySubtypeName`
  - `listingTitle`
- `pricingForm`
  - `price`
  - `areaSize`
  - `areaUnit`
  - `numBedrooms`
  - `numBathrooms`
  - `numParkingSpaces`
  - `numFloors`
- `amenitiesForm`
  - `selectedFeatureIds`
- `mediaForm`
  - `images`
  - `videoFiles`
- `locationForm`
  - `city`
  - `neighborhood`
  - `fullAddress`
  - `mapLink`
  - `latitude`
  - `longitude`
- `contactForm`
  - `contactName`
  - `contactEmail`
  - `contactPhoneNumber`
  - `contactLocation`
- `descriptionForm`
  - `propertyDescription`

Important existing validators:

- required validators on purpose, category, title, price, area size/unit, bedroom/bathroom/parking/floor counters, city, neighborhood, full address, contact name/email/phone, description.
- max length on listing title.
- minimum length on property description.
- minimum numeric values on pricing/counter fields.
- custom phone format validator for `contactPhoneNumber`.
- dynamic required validator for `propertySubtypeName` when selected category has subtypes.

## Existing Functional Behavior To Preserve

- `pageActions()` returns:
  - edit mode: `update-property`
  - create mode: `save-draft`, `publish-listing`
- `onHeaderAction(actionId)` handles save draft, publish listing, and update property.
- `onUpdateProperty()` updates an existing property.
- `uploadSelectedMedia()` uploads selected images/videos before save/publish.
- `uploadSelectedMediaForEdit()` preserves existing media when edit mode has no newly selected files.
- `buildPayload()` constructs nested and flat API-compatible payload fields.
- `handleAddListingSubmitError()` maps API field errors back to forms.
- `onGenerateDescription()` calls AI description generation and patches `descriptionForm`.
- `aiDescriptionContextReady` depends on valid basic/pricing/location forms and selected amenities.
- `loadPropertyForEdit()` loads property, catalog, and features with `forkJoin`.
- `patchFormsFromProperty()` patches all forms in edit mode.
- `BasicInformationSectionComponent` loads property catalog, manages category/subtype dependency, and has a retry path.
- `FeaturesAmenitiesSectionComponent` loads features, syncs chips with `selectedFeatureIds`, and has a retry path.
- `PropertyMediaSectionComponent` manages selected image previews, video selection, and object URL cleanup.
- `PropertyLocationStepComponent` loads GeoNames cities, OSM suggestions, patches map pin coordinates and map link, and handles loading/error states.
- `LocationMapPickerComponent` uses Leaflet and browser geolocation, supports click/drag pin and "Use my location".
- `ContactInformationStepComponent` preserves contact validation and touched state handling.
- `PropertyDescriptionStepComponent` emits `generateDescription` and shows AI action disabled/loading state.

## Binding Preservation Checklist

Future implementation phases must preserve this checklist unless the user explicitly asks to change behavior.

### Page-Level Bindings

Template file:
`src/app/features/add-listing/pages/add-listing-page/add-listing-page.html`

Preserve:

- `<app-page-header>` bindings:
  - `[title]="(editingId() ? 'addListing.titleEdit' : 'addListing.title') | translate"`
  - `[subtitle]="'addListing.subtitle' | translate"`
  - `[actions]="pageActions()"`
  - `(actionClicked)="onHeaderAction($event)"`
- Edit-mode loading/error banners:
  - `editingId()`
  - `editLoading()`
  - `editLoadError()`
  - `app-info-banner` with loading/error copy
- Child section form inputs:
  - `<app-basic-information-section [form]="basicInfoForm" />`
  - `<app-pricing-details-section [form]="pricingForm" />`
  - `<app-features-amenities-section [form]="amenitiesForm" />`
  - `<app-property-media-section [form]="mediaForm" />`
  - `<app-property-location-step [form]="locationForm" />`
  - `<app-contact-information-step [form]="contactForm" />`
  - `<app-property-description-step [form]="descriptionForm" ... />`
- Description AI bindings:
  - `[aiDescriptionEnabled]="aiDescriptionContextReady()"`
  - `[aiDescriptionLoading]="isGeneratingDescription()"`
  - `(generateDescription)="onGenerateDescription()"`
- Back-to-top action if retained:
  - `(click)="scrollToTop()"`

Phase note:

- Future step grouping may move these child components between step containers, but the form instances and bindings above must remain connected.

### Page-Level Forms and Validators

File:
`src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`

Preserve these forms and controls:

- `basicInfoForm`
  - `purpose`: required, default `rent`
  - `propertyCategoryName`: required
  - `propertySubtypeName`: dynamically required by `BasicInformationSectionComponent` when selected category has subtypes
  - `listingTitle`: required, max length 120
- `descriptionForm`
  - `propertyDescription`: required, min length 20
- `pricingForm`
  - `price`: required, min 0, default 75000
  - `areaSize`: required, min 0, default 1200
  - `areaUnit`: required, default `sqft`
  - `numBedrooms`: required, min 0
  - `numBathrooms`: required, min 0
  - `numParkingSpaces`: required, min 0
  - `numFloors`: required, min 0
- `amenitiesForm`
  - `selectedFeatureIds`: string array
- `mediaForm`
  - `images`: `File[]`
  - `videoFiles`: `File[]`
- `contactForm`
  - `contactName`: required
  - `contactEmail`: required, email
  - `contactPhoneNumber`: required, `contactPhoneFormatValidator`
  - `contactLocation`: optional
- `locationForm`
  - `city`: required
  - `neighborhood`: required
  - `fullAddress`: required
  - `mapLink`: optional/server-error aware
  - `latitude`: `number | null`
  - `longitude`: `number | null`

Preserve these state signals/computed values:

- `isSubmitting`
- `isGeneratingDescription`
- `aiListingFormsTick`
- `aiDescriptionContextReady`
- `pageActions`
- `editingId`
- `editLoading`
- `editLoadError`
- `loadedProperty`

Preserve these injected services:

- `AddListingService`
- `NotificationService`
- `MediaUploadService`
- `Router`
- `ActivatedRoute`
- `DestroyRef`

Preserve the existing `FormBuilder`-created reactive form structure. A future stepper may add local step state, but should not replace the form model unless explicitly asked.

### Submit, Save, Publish, and Edit Handlers

Preserve:

- `onHeaderAction(actionId)`
  - ignores create actions while `isSubmitting()`
  - routes edit mode `update-property` to `onUpdateProperty()`
  - handles `SAVE_DRAFT` and `PUBLISH_LISTING`
  - validates required forms before media upload
  - marks invalid forms touched
  - warns through `NotificationService`
  - uploads media before creating/saving
  - saves draft through `addListingService.saveDraft(payload)`
  - publishes through `addListingService.createListing(payload)`
  - navigates to `/properties` after success
  - catches errors with `handleAddListingSubmitError`
- `onUpdateProperty()`
  - validates forms
  - uploads/reuses media via `uploadSelectedMediaForEdit()`
  - calls `addListingService.updateProperty(id, payload)`
  - navigates to `/properties`
- `buildPayload(uploadedMedia)`
  - preserves nested payload fields
  - preserves flat API compatibility fields
  - preserves amenity booleans from `buildAmenityBooleanPayload`
  - preserves image/video fields
  - preserves flat pricing fields
  - preserves flat location/contact fields
- `handleAddListingSubmitError(error, actionId)`
  - uses `parseHttpApiError`
  - uses `apiErrorSummary`
  - uses `applyServerFieldErrors`
  - maps server fields through all `ADD_LISTING_*_API_MAP` constants
- `uploadSelectedMedia()`
  - reads `mediaForm.value.images`
  - reads `mediaForm.value.videoFiles`
  - calls `mediaUploadService.uploadImages`
  - calls `mediaUploadService.uploadVideo`
  - shows upload success/error notifications
- `uploadSelectedMediaForEdit()`
  - preserves existing image/video URLs when no new files are selected
  - uploads new media only when selected

### Edit Mode and Patch Behavior

Preserve:

- Route `:id` support in `src/app/features/add-listing/add-listing.routes.ts`.
- Constructor route id read from `this.route.snapshot.paramMap.get('id')`.
- `loadPropertyForEdit(id)`
  - sets `editLoading`
  - clears/sets `editLoadError`
  - fetches property, catalog, and features using `forkJoin`
  - stores `loadedProperty`
  - calls `patchFormsFromProperty(doc, catalog, features)`
- `patchFormsFromProperty`
  - patches purpose, title, category, subtype in a two-step order
  - emits category change so subtype options populate
  - patches description, pricing, contact, location, selected feature ids
  - emits pricing changes so OnPush counter fields repaint
  - emits amenities changes so feature chips sync
  - leaves media file inputs empty because existing media are URLs
  - marks forms untouched after patching
- `resolveCategoryNameFromCatalog`
- `resolveSelectedFeatureIdsFromAmenityFlags`

### AI Description Flow

Preserve:

- `aiDescriptionContextReady`
  - invalid when basic/pricing/location forms are invalid
  - requires at least one selected amenity id
- `evalAiDescriptionContextReady()`
- `buildAiDescriptionRequestBody()`
  - reads basic/pricing/amenities/contact/location forms
  - converts purpose to `For Sale` / `For Rent`
  - derives property type using `getCoarsePropertyTypeFromLabels`
  - includes amenity booleans
  - includes location/contact/pricing/detail values
- `onGenerateDescription()`
  - blocks if disabled/loading
  - sets `isGeneratingDescription`
  - calls `addListingService.generateListingDescription`
  - patches `descriptionForm.propertyDescription`
  - shows success/warning/error notifications
- `PropertyDescriptionStepComponent` output:
  - `(generateDescription)="onGenerateDescription()"`
- `PropertyDescriptionStepComponent` inputs:
  - `[aiDescriptionEnabled]="aiDescriptionContextReady()"`
  - `[aiDescriptionLoading]="isGeneratingDescription()"`

Known gap:

- `BasicInformationSectionComponent` currently shows a title action chip with id `generate-title`, but Phase 1 inspection did not find a parent output or implemented title-generation handler. Future phases must not claim title AI generation is functional unless it is implemented later by explicit request.

### Basic Information Section

Files:

- `src/app/features/add-listing/components/basic-information-section/basic-information-section.ts`
- `src/app/features/add-listing/components/basic-information-section/basic-information-section.html`

Preserve:

- Required `form` input.
- `purposeOptions` values:
  - `sale` / `For Sale`
  - `rent` / `For Rent`
- `categories`, `availableSubtypes`, `catalogLoading`, `catalogError`.
- `titleActions` display data.
- `loadCatalog()` call to `addListingService.getPropertyCatalog()`.
- `retryLoadCatalog()`.
- Category/subtype dependency:
  - changing `propertyCategoryName` clears `propertySubtypeName`
  - selected category populates `availableSubtypes`
  - subtype becomes required only when subtypes exist
- Touched-state handlers:
  - `onPurposeChange`
  - `onPropertyTypePanelToggle`
  - `onCategoryFieldPanelToggle`
  - `onListingTitleBlur`
- Template form bindings:
  - `[formGroup]="form"`
  - `formControlName="purpose"` via `app-segmented-option-group` selected/change bridge
  - `formControlName="propertySubtypeName"`
  - `formControlName="propertyCategoryName"`
  - `formControlName="listingTitle"`
- Server error display for purpose, subtype/category, property type/category, and title.
- Catalog retry error state with `app-info-banner` and retry button.

### Pricing Details Section

Files:

- `src/app/features/add-listing/components/pricing-details-section/pricing-details-section.ts`
- `src/app/features/add-listing/components/pricing-details-section/pricing-details-section.html`

Preserve:

- Required `form` input.
- `NON_NEGATIVE_FIELDS`.
- `counters` metadata for bedrooms, bathrooms, parking spaces, floors.
- OnPush value/status subscription for repainting patched form values.
- Negative input prevention:
  - `blockMinusOnNonNegativeNumberInput`
  - `clampToNonNegative`
  - `setNonNegativeControlValue`
- Counter handlers:
  - `decrementCounter`
  - `incrementCounter`
  - `stepNumberControl`
- Template form bindings:
  - `[formGroup]="form"`
  - `formControlName="price"`
  - `formControlName="areaSize"`
  - `formControlName="areaUnit"`
  - `app-counter-field` bindings for each counter:
    - `[label]="counter.label"`
    - `[value]="form.get(counter.id)?.value ?? counter.value"`
    - `(decremented)="decrementCounter(counter.id)"`
    - `(incremented)="incrementCounter(counter.id)"`
- Material suffix stepper controls for price and area size.
- Server/required error messages for pricing fields.

### Features and Amenities Section

Files:

- `src/app/features/add-listing/components/features-amenities-section/features-amenities-section.ts`
- `src/app/features/add-listing/components/features-amenities-section/features-amenities-section.html`

Preserve:

- Required `form` input.
- `chipItems`, `featuresLoading`, `featuresError`.
- `loadFeatures()` call to `addListingService.getPropertyFeatures()`.
- `retryLoadFeatures()` and cache invalidation.
- `toggleAmenity(featureId)`
  - updates `selectedFeatureIds`
  - keeps chip selected state in sync
  - intentionally uses `{ emitEvent: false }` to avoid the documented double-sync bug.
- `syncChipsFromFormValue`.
- Template states:
  - error banner + retry button
  - loading text
  - `app-selectable-chip-grid [items]="chipItems()" (toggled)="toggleAmenity($event)"`

### Property Media Section

Files:

- `src/app/features/add-listing/components/property-media-section/property-media-section.ts`
- `src/app/features/add-listing/components/property-media-section/property-media-section.html`

Preserve:

- Required `form` input.
- `PROPERTY_MEDIA_BLOCK_IDS`.
- `selectedImagePreviews`.
- `selectedVideoName`.
- `mediaBlocks` for photos and video:
  - photos accept `.svg,.png,.jpg,.jpeg`
  - video accept `.mp4,.webm,.mov`
  - photos are multiple
- `onFilesSelected(blockId, files)`
  - dedupes photos by file key
  - creates object URLs for previews
  - writes selected image files to `mediaForm.images`
  - writes selected video file array to `mediaForm.videoFiles`
  - stores selected video name
- `removeSelectedImage(index)`
  - revokes object URL
  - removes preview
  - updates `mediaForm.images`
- `ngOnDestroy()` and `revokeImagePreviews()`.
- Template bindings:
  - `app-upload-dropzone` inputs `icon`, `title`, `subtitle`, `accept`, `multiple`
  - `(filesSelected)="onFilesSelected(block.id, $event)"`
  - preview image `[src]`, `[alt]`, remove button, selected-image count, selected-video name.

### Location Step and Map Picker

Files:

- `src/app/features/add-listing/components/property-location-step/property-location-step.ts`
- `src/app/features/add-listing/components/property-location-step/property-location-step.html`
- `src/app/features/add-listing/components/location-map-picker/location-map-picker.ts`
- `src/app/features/add-listing/components/location-map-picker/location-map-picker.html`

Preserve:

- Required `form` input to both location step and map picker.
- `LISTING_COUNTRY_CODE = 'PK'`.
- `LocationCatalogService.getPopulatedPlaces`.
- `LocationCatalogService.getMergedLocationSuggestionsAround`.
- City state:
  - `allPlaces`
  - `filteredPlaces`
  - `citiesLoading`
  - `citiesError`
  - `displayCityPlace`
  - `onCitySelected`
- Neighborhood state:
  - `allNeighborhoods`
  - `filteredNeighborhoods`
  - `neighborhoodsLoading`
  - `neighborhoodsError`
  - `displayNeighborhood`
  - `onNeighborhoodSelected`
  - `pickTrackKey`
  - `pickKindLabel`
- Touched-state handler:
  - `markLocationControlTouched`
- Map synchronization:
  - `patchMapPin`
  - `latitude`
  - `longitude`
  - `mapLink`
  - `LocationMapPickerComponent` reading/writing the same form controls
- Leaflet map behavior:
  - initial Lahore fallback
  - tile layer
  - click-to-place pin
  - draggable marker
  - `invalidateSize` after paint
- Geolocation behavior:
  - `useMyLocation()`
  - `locating`
  - `geoError`
  - `GeolocationService.getCurrentPosition`
  - user-facing error message display
- Template bindings:
  - `formControlName="city"`
  - `formControlName="neighborhood"`
  - `formControlName="fullAddress"`
  - `formControlName="mapLink"`
  - city/neighborhood autocomplete references and option selected handlers
  - `<app-location-map-picker [form]="form" />`
  - map picker `[style.height.px]="heightPx"`
  - use-location button disabled state and click handler.

### Contact Information Step

Files:

- `src/app/features/add-listing/components/contact-information-step/contact-information-step.ts`
- `src/app/features/add-listing/components/contact-information-step/contact-information-step.html`

Preserve:

- Required `form` input.
- `contactBanner` translation stream.
- OnPush value/status subscription for name, email, and phone controls.
- `markContactTouched(control)`.
- Template bindings:
  - `[formGroup]="form"`
  - `formControlName="contactName"`
  - `formControlName="contactEmail"`
  - `formControlName="contactPhoneNumber"`
  - `formControlName="contactLocation"`
- Error display:
  - server errors
  - required errors
  - email format error
  - phone format error.

### Property Description Step

Files:

- `src/app/features/add-listing/components/property-description-step/property-description-step.ts`
- `src/app/features/add-listing/components/property-description-step/property-description-step.html`

Preserve:

- `form = input.required<FormGroup>()`.
- `aiDescriptionEnabled = input(false)`.
- `aiDescriptionLoading = input(false)`.
- `generateDescription = output<void>()`.
- `descriptionBanner` translation stream.
- `descriptionActions` computed state:
  - disabled when context is incomplete or loading
  - loading label while generating
- `onDescriptionAction(id)` emitting only for `generate-description`.
- Template bindings:
  - `[formGroup]="form()"`
  - `formControlName="propertyDescription"`
  - `cdkTextareaAutosize`
  - `cdkAutosizeMinRows="4"`
  - `cdkAutosizeMaxRows="12"`
  - `app-action-chip-list [items]="descriptionActions()" (actionClicked)="onDescriptionAction($event)"`
- Error display for server, required, and minlength states.

### API Field Error Maps

File:
`src/app/features/add-listing/constants/add-listing-api-field-maps.ts`

Preserve all map entries:

- `ADD_LISTING_BASIC_INFO_API_MAP`
- `ADD_LISTING_DESCRIPTION_API_MAP`
- `ADD_LISTING_PRICING_API_MAP`
- `ADD_LISTING_LOCATION_API_MAP`
- `ADD_LISTING_CONTACT_API_MAP`

Do not rename form controls without updating these maps and the server error flow.

### Service/API Calls

Preserve usage of:

- `AddListingService.getPropertyCatalog`
- `AddListingService.invalidatePropertyCatalogCache`
- `AddListingService.getPropertyFeatures`
- `AddListingService.invalidatePropertyFeaturesCache`
- `AddListingService.getCoarsePropertyTypeFromLabels`
- `AddListingService.buildAmenityBooleanPayload`
- `AddListingService.generateListingDescription`
- `AddListingService.saveDraft`
- `AddListingService.createListing`
- `AddListingService.getPropertyById`
- `AddListingService.updateProperty`
- `MediaUploadService.uploadImages`
- `MediaUploadService.uploadVideo`
- `LocationCatalogService.getPopulatedPlaces`
- `LocationCatalogService.getMergedLocationSuggestionsAround`
- `GeolocationService.getCurrentPosition`
- `GeolocationService.userFacingMessage`
- `NotificationService.success/error/warning/info`

### Route and Navigation Behavior

Preserve:

- `ADD_LISTING_ROUTES` path `''` for create mode.
- `ADD_LISTING_ROUTES` path `':id'` for edit mode.
- successful save/publish/update navigation to `/properties`.
- no route renames unless explicitly requested.

### Review/Stepper-Specific Preservation Notes

Future stepper phases may add:

- step metadata
- active step signal
- progress computed values
- next/back buttons
- right-side summary panel
- review summary

But they must not:

- replace the existing forms with new unrelated forms
- remove child section components without preserving all controls/handlers
- move save/publish/update logic into the stepper component
- bind the stepper directly to backend services
- invent draft autosave backend state
- claim a field is complete unless derived from existing form state.

## Existing Reusable Components Found

- `PageHeaderComponent`: current page header/actions component.
- `InfoBannerComponent`: current guidance/error banner.
- `SectionCardComponent`: reusable titled card section, recently supports dashboard-style inputs in this working tree.
- `StepCardComponent`: existing numbered card used by current location/contact/description sections.
- `SegmentedTabsComponent`: reusable tab-like component with active tab input/output, but currently supports only key/label and no descriptions/completed/pending step state.
- `SegmentedOptionGroupComponent`: used for purpose selection.
- `ActionChipListComponent`: used for title/description AI actions.
- `SelectableChipGridComponent`: used for amenities/features.
- `CounterFieldComponent`: used for numeric counters.
- `UploadDropzoneComponent`: used for media upload UI.

Stepper decision implication:

- `StepCardComponent` is not a full stepper; it is a numbered card wrapper.
- `SegmentedTabsComponent` is closer to navigation but lacks step descriptions, completed/pending states, and wizard semantics.
- Phase 2 decision: create a new generic shared `WizardStepperComponent` and leave `StepCardComponent` / `SegmentedTabsComponent` intact.
- New component path: `src/app/shared/ui/wizard-stepper/`.

## Shared Stepper Component Decision

Decision made in Phase 2:

- Do not extend `StepCardComponent`.
  - Reason: it is a content card wrapper with a numbered badge, not a navigation/progress component.
  - Existing Add Listing location/contact/description sections currently use it and should not be broken by wizard navigation behavior.
- Do not extend `SegmentedTabsComponent`.
  - Reason: it models tabs with peer views and animated pills, not a listing creation wizard.
  - It lacks descriptions, completed/pending state, disabled steps, and step-oriented ARIA semantics.
  - It is already used by auth, inbox, and appointments; changing it for wizard behavior would risk unrelated screens.
- Add a new shared `WizardStepperComponent`.
  - Reason: the Add Listing redesign needs a generic reusable step navigation component that can support future flows.
  - It is not hardcoded to Add Listing.
  - It owns no business logic and emits only selected step keys.

Created in Phase 2:

- `src/app/shared/ui/wizard-stepper/wizard-stepper.ts`
- `src/app/shared/ui/wizard-stepper/wizard-stepper.html`
- `src/app/shared/ui/wizard-stepper/wizard-stepper.scss`

Generic API:

- `WizardStepperItem`
  - `key: string`
  - `label: string`
  - `description?: string`
  - `state?: 'pending' | 'active' | 'completed' | 'disabled'`
  - `disabled?: boolean`
- `WizardStepperComponent` inputs:
  - `steps`
  - `activeKey`
  - `ariaLabel`
  - `orientation`
- `WizardStepperComponent` output:
  - `stepSelected`

Accessibility notes:

- Renders a named `<nav>`.
- Uses an ordered list for step order.
- Uses native buttons for keyboard/focus behavior.
- Uses `aria-current="step"` for the current step.
- Uses `aria-describedby` for optional descriptions.
- Uses disabled buttons for disabled steps.

Future usage note:

- Phase 3 should import this component into `AddListingPageComponent`, add typed step metadata, add local active-step state with signals, and wire `stepSelected`.
- The new stepper must remain presentation/navigation only. It must not call listing services, mutate forms, upload media, or submit listings.

## Theme and Token Files Found

- `src/styles.scss`
- `src/styles/_theme-colors.scss`
- `docs/scss-system.md`

Important token direction:

- Use `src/styles.scss` root tokens such as `--primary`, `--primary-hover`, `--primary-strong`, `--primary-soft`, `--surface`, `--surface-soft`, `--surface-muted`, `--surface-page`, `--font-main`, `--font-secondary`, `--border-soft`, `--border-field`, `--shadow-soft`, and radius/font tokens.
- Do not use the generated peach/coral palette in `src/styles/_theme-colors.scss` as the visual source for the redesign.
- Do not add new root variables unless explicitly asked.

## Stepper Design Direction

- Create or use a stepper UI that should preferably live in shared UI because it may be reused later.
- First check whether an existing reusable stepper/tabs/progress component exists.
- If an existing reusable component can be safely extended, extend it.
- Best option is to not remove existing reusable components.
- If no existing component fits cleanly, create a new shared stepper component.
- The shared stepper must be generic and not hardcoded to Add Listing.
- The shared stepper should support:
  - labels
  - optional descriptions
  - active state
  - completed state
  - pending state
  - disabled state if needed
  - accessible semantics
- The shared stepper should not own business logic.
- The shared stepper should receive data from the parent.
- The shared stepper should be keyboard/focus accessible.
- The shared stepper should use existing tokens only.

## Suggested Step Grouping

Phase work may adjust grouping if the existing form structure proves a different grouping is safer. If adjusted, document why.

1. Basic Info
   - purpose
   - listing title
   - property category/type
   - basic identifiers

2. Pricing & Details
   - price
   - area size
   - area unit
   - bedrooms
   - bathrooms
   - parking spaces
   - floors

3. Location
   - city/location
   - area/neighborhood
   - full address
   - pin/map link
   - map preview/use location

4. Features & Media
   - features and amenities
   - photos
   - video tour
   - uploads

5. Contact & Description
   - contact name
   - email
   - phone
   - contact location
   - property description
   - AI description helper

6. Review & Publish
   - final overview if existing data supports it
   - save draft
   - publish listing
   - validation/requirements summary

## Right-Side Summary / Progress Panel Direction

- Add or redesign a right-side panel if the current layout supports it.
- It can show:
  - current step
  - progress percentage
  - list of steps
  - draft saved status if already available
  - requirements before publish
  - helpful AI tip
- Do not invent backend data.
- Do not add fake service logic.
- If some values are purely UI placeholders, document that clearly.

## Strict Functional Requirements

- Do not remove existing data bindings.
- Do not remove existing form controls.
- Do not remove existing validators.
- Do not remove existing service calls.
- Do not remove existing save/publish actions.
- Do not remove AI generation actions.
- Do not remove media upload actions.
- Do not remove location/map/contact/description sections.
- Do not remove retry/error states.
- Preserve existing routes and navigation.
- Preserve current add listing behavior.
- Components or groups of components can be distributed into steps based on the current form structure and sensible UX grouping.
- If a reusable component cannot support the design without risky changes, create a new focused shared/admin component instead.
- If grouping into steps requires local state, use signals.
- The stepper can initially be UI-only if the current form submission needs to remain intact, but the page should visually guide users step-by-step.
- Do not break final submit/publish behavior.

## Angular and TypeScript Rules

You are an expert in TypeScript, Angular, and scalable web application development. Write functional, maintainable, performant, accessible code following Angular and TypeScript best practices.

TypeScript:

- Use strict type checking.
- Prefer type inference when the type is obvious.
- Avoid the `any` type; use `unknown` when type is uncertain.

Angular:

- Always use standalone components over NgModules.
- Must NOT set `standalone: true` inside Angular decorators. It is the default in Angular v20+.
- Use signals for state management.
- Implement lazy loading for feature routes.
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead.
- Use `NgOptimizedImage` for all static images.
- `NgOptimizedImage` does not work for inline base64 images.
- Follow existing standalone component imports.
- Preserve `ChangeDetectionStrategy.OnPush`.

Accessibility:

- It MUST pass all AXE checks.
- It MUST follow WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
- Stepper must use accessible semantics.
- Interactive step controls must be keyboard accessible.
- Current step must be communicated to assistive technologies.
- Validation errors must remain accessible.

Components:

- Keep components small and focused on a single responsibility.
- Use `input()` and `output()` functions instead of decorators for new or touched component APIs where practical.
- Use `computed()` for derived state.
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component`.
- Prefer inline templates for small components.
- Prefer Reactive Forms instead of Template-driven forms.
- Do NOT use `ngClass`; use class bindings instead.
- Do NOT use `ngStyle`; use style bindings instead.
- When using external templates/styles, use paths relative to the component TS file.

State management:

- Use signals for local component state.
- Use `computed()` for derived state.
- Keep state transformations pure and predictable.
- Do NOT use `mutate` on signals; use `update` or `set` instead.

Templates:

- Keep templates simple and avoid complex logic.
- Use native control flow: `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use the async pipe to handle observables.
- Do not assume globals like `new Date()` are available.

Services:

- Design services around a single responsibility.
- Use `providedIn: 'root'` for singleton services.
- Use the `inject()` function instead of constructor injection for new services/classes.

## Styling Rules

- Use existing design tokens only.
- Do not add new root variables.
- Do not modify the global token system.
- Do not introduce a new color palette.
- Do not use `::ng-deep`.
- Use SCSS.
- Prefer BEM-style class structure where consistent with the project.
- Avoid broad global styles.
- Keep styles local unless a shared component genuinely requires shared styling.
- Use clean white cards, subtle borders, soft shadows, rounded corners, better spacing, and better hierarchy.
- Do not redesign unrelated components or feature areas.

## Phase Plan

### Phase 0 - Inspect only and create task file

Status: **Complete**

Scope:

- Read docs/agent/context-pack.
- Inspect features/add-listing.
- Inspect existing add-listing route/page/component structure.
- Inspect existing shared UI components that may support stepper/tabs/card/progress.
- Inspect existing design token files.
- Do not edit implementation files.
- Create `docs/add-listing-stepper-redesign-tasks.md`.
- Set Phase 1 as current.

### Phase 1 - Map current form structure and data bindings

Status: **Complete**

Scope:

- Identify all current form controls, bindings, inputs, outputs, service calls, save/publish handlers, AI handlers, upload handlers, retry states, and validation logic.
- Update this markdown with a binding preservation checklist.
- Do not visually redesign yet unless necessary for mapping.
- This phase should prevent accidental removal of existing logic.

Expected output:

- Add a detailed "Binding Preservation Checklist" section to this file.
- Include each child section and every form/control/handler to preserve.
- Run available checks if any implementation code is touched.

### Phase 2 - Shared stepper component decision

Status: **Complete**

Scope:

- Check if an existing reusable component can be extended.
- If safe, extend it.
- If not, create a new shared stepper component.
- The component must be generic, accessible, token-based, and reusable.
- It must not contain Add Listing business logic.
- Include typed inputs/outputs using `input()`/`output()`.
- Use OnPush.
- Use existing tokens only.
- Add minimal usage docs/comments if helpful.

### Phase 3 - Add Listing page step state

Status: **Complete**

Scope:

- Add local step state to the Add Listing page using signals.
- Define typed step metadata.
- Wire the shared stepper to the Add Listing page.
- Do not hide/remove form controls yet unless safely grouped.
- Preserve save/publish behavior.
- Add next/back handlers if needed.

### Phase 4 - Group form sections into steps

Status: **Complete**

Scope:

- Move or conditionally render existing sections into step groups.
- Do not remove controls or bindings.
- Use `@if`/`@switch` for step rendering.
- Preserve existing form group structure.
- Preserve validators and submit behavior.
- Keep all current data connected.

### Phase 5 - Redesign Basic Info / Pricing step UI

Status: **Complete**

Scope:

- Polish the first step view.
- Improve layout, labels, purpose toggle, title, property type/category, price, area, bedroom/bathroom/parking/floor counters.
- Preserve all current bindings.
- Keep AI title helper.
- Use existing tokens only.

### Phase 6 - Redesign Location step UI

Status: **Complete**

Scope:

- Polish city/location, area/neighborhood, full address, map link, and map preview section.
- Preserve existing location bindings and map behavior.
- Keep use-location behavior if present.
- Improve layout and helper text.

### Phase 7 - Redesign Features & Media step UI

Status: **Complete**

Scope:

- Polish amenities/features and media upload areas.
- Preserve retry states.
- Preserve upload actions and accepted file behavior.
- Keep photos/video sections.
- Use accessible upload controls.

### Phase 8 - Redesign Contact & Description step UI

Status: **Complete**

Scope:

- Polish contact information fields and description section.
- Preserve AI description generation action.
- Preserve all contact bindings.
- Keep validation accessible.

### Phase 9 - Review / Publish step

Status: **Complete**

Scope:

- Create a final review step only if existing form data can be safely summarized.
- Do not invent backend logic.
- Preserve Save Draft and Publish Listing actions.
- Show validation/requirements summary if it can be derived safely from existing form state.
- If review step is too risky, document the limitation and keep final actions accessible.

### Phase 10 - Responsive, accessibility, and final polish

Status: **Current**

Scope:

- Check desktop/tablet/mobile layout.
- Check keyboard navigation.
- Check focus states.
- Check ARIA states.
- Remove unused styles/classes introduced during the redesign.
- Run build/lint/typecheck if available.
- Update markdown with final result.

## Phase Completion Log

### Phase 9 Completion Notes - 2026-05-14

- Completed the Review / Publish step.
- Replaced the placeholder review panel with read-only summary sections derived from existing form values:
  - Listing basics
  - Pricing and details
  - Location
  - Features and media
  - Contact and description
- Added typed review summary interfaces and computed summary data in `AddListingPageComponent`.
- Added a review status chip showing completed checklist count from the existing `publishRequirements()` computed value.
- Added review-step action buttons that call the existing `onHeaderAction()` flow:
  - Save Draft in create mode
  - Publish Listing in create mode
  - Save changes in edit mode
- Kept the right-side `Checklist before publish` panel as the detailed requirements summary.
- Did not invent backend data, autosave logic, or new validation rules.
- Trimmed the review SCSS after an initial build failure so the Add Listing page stays below the hard 8 kB component style budget.
- Set current phase to Phase 10 - Responsive, accessibility, and final polish.

Changed files:

- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.html`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- Preserved `<app-page-header>` title/subtitle/actions and `(actionClicked)="onHeaderAction($event)"`.
- Preserved all page-owned reactive forms, validators, and child section bindings.
- Preserved save draft, publish listing, update listing, media upload, edit loading/patching, server error mapping, route navigation, and Back to Top behavior.
- Review action buttons delegate to the existing `onHeaderAction()` handler instead of adding separate submit logic.
- Preserved the existing media behavior: media remains informational in the checklist and is not made required.

Checks run:

- `npm run build` - first run failed because `add-listing-page.scss` exceeded the hard 8 kB component style budget by 169 bytes after the review styles were added.
- `npm run build` - passed after trimming the review SCSS.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for shared sidebar, shared header, admin add-agency page, inbox conversations, and appointments list.
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.scss` still exceeds the 4.00 kB warning budget by about 3.94 kB, but is now under the 8.00 kB error budget.

Risks and assumptions:

- The review summary is intentionally read-only and derived from current form state only.
- The summary shows selected feature and media counts because feature names and uploaded URLs are not owned by the parent form state.
- The detailed requirements list remains in the right-side progress rail to avoid duplicating large checklist UI in the review step and to keep the component under the style budget.
- Phase 10 should review responsive behavior, focus states, accessibility semantics, and whether any style extraction/reduction is needed.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 8 Completion Notes - 2026-05-14

- Completed Contact & Description step UI redesign.
- Replaced the older numbered `StepCardComponent` wrappers with the shared `SectionCardComponent`.
- Added dashboard card variants and section icons for Contact and Description.
- Reworked Contact fields into a responsive two-column grid.
- Tightened contact field label sizing and spacing.
- Reworked Description into a roomier editor layout with a larger autosizing textarea.
- Kept the AI description chip/list action visible in the description header.
- Kept the AI helper banner below the editor.
- Set current phase to Phase 9 - Review / Publish step.

Changed files:

- `src/app/features/add-listing/components/contact-information-step/contact-information-step.ts`
- `src/app/features/add-listing/components/contact-information-step/contact-information-step.html`
- `src/app/features/add-listing/components/contact-information-step/contact-information-step.scss`
- `src/app/features/add-listing/components/property-description-step/property-description-step.ts`
- `src/app/features/add-listing/components/property-description-step/property-description-step.html`
- `src/app/features/add-listing/components/property-description-step/property-description-step.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- Preserved required `[form]="contactForm"` binding from the Add Listing page.
- Preserved Contact form binding:
  - `[formGroup]="form"`
  - `formControlName="contactName"`
  - `formControlName="contactEmail"`
  - `formControlName="contactPhoneNumber"`
  - `formControlName="contactLocation"`
- Preserved contact touched handlers:
  - `(blur)="markContactTouched('contactName')"`
  - `(blur)="markContactTouched('contactEmail')"`
  - `(blur)="markContactTouched('contactPhoneNumber')"`
- Preserved contact validation/error rendering for server, required, email, and phone-format errors.
- Preserved required `[form]="descriptionForm"` binding from the Add Listing page.
- Preserved Description form binding:
  - `[formGroup]="form()"`
  - `formControlName="propertyDescription"`
- Preserved description validation/error rendering for server, required, and minlength errors.
- Preserved AI description inputs and output:
  - `[aiDescriptionEnabled]="aiDescriptionContextReady()"`
  - `[aiDescriptionLoading]="isGeneratingDescription()"`
  - `(generateDescription)="onGenerateDescription()"`
- Preserved `descriptionActions()` and `(actionClicked)="onDescriptionAction($event)"`.
- Preserved autosizing textarea attributes.

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for appointments list, shared sidebar, shared header, inbox conversations, Add Listing page SCSS, and admin add-agency page.

Risks and assumptions:

- No new AI generation behavior was added; this phase only preserved the existing description generation output.
- Contact and description helper copy is static UI guidance and does not imply backend changes.
- Phase 9 should build the Review / Publish step only from existing form data and existing save/publish actions.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 7 Completion Notes - 2026-05-14

- Completed Features & Media step UI redesign.
- Updated Features & Amenities to use the dashboard `SectionCardComponent` variant with a section icon.
- Added a compact helper line above the selectable amenities grid.
- Polished feature loading and retry states without changing data loading behavior.
- Updated Property Media to use the dashboard `SectionCardComponent` variant with a section icon.
- Replaced the Bootstrap row wrapper with a local responsive media grid.
- Polished selected image previews with larger responsive thumbnails, tokenized borders, and cleaner remove controls.
- Polished selected video metadata with an inline media icon and compact token-based container.
- Updated shared `SelectableChipGridComponent` styling for a softer admin selection style while preserving button semantics and `aria-pressed`.
- Updated shared `UploadDropzoneComponent` styling to use the deep blue/gray token system instead of older accent surfaces.
- Set current phase to Phase 8 - Redesign Contact & Description step UI.

Changed files:

- `src/app/features/add-listing/components/features-amenities-section/features-amenities-section.html`
- `src/app/features/add-listing/components/features-amenities-section/features-amenities-section.scss`
- `src/app/features/add-listing/components/property-media-section/property-media-section.html`
- `src/app/features/add-listing/components/property-media-section/property-media-section.scss`
- `src/app/shared/ui/selectable-chip-grid/selectable-chip-grid.scss`
- `src/app/shared/ui/upload-dropzone/upload-dropzone.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- Preserved required `[form]="amenitiesForm"` binding from the Add Listing page.
- Preserved `FeaturesAmenitiesSectionComponent` feature loading via `addListingService.getPropertyFeatures()`.
- Preserved feature retry behavior:
  - `(click)="retryLoadFeatures()"`
- Preserved chip grid bindings:
  - `[items]="chipItems()"`
  - `(toggled)="toggleAmenity($event)"`
- Preserved selected feature id syncing through `selectedFeatureIds`.
- Preserved required `[form]="mediaForm"` binding from the Add Listing page.
- Preserved media block rendering from `mediaBlocks()`.
- Preserved upload dropzone bindings:
  - `[icon]="block.icon"`
  - `[title]="block.title"`
  - `[subtitle]="block.subtitle"`
  - `[accept]="block.accept ?? ''"`
  - `[multiple]="block.id.toLowerCase() === PROPERTY_MEDIA_BLOCK_IDS.PHOTOS"`
  - `(filesSelected)="onFilesSelected(block.id, $event)"`
- Preserved selected image preview rendering and `removeSelectedImage(i)`.
- Preserved selected video name display.
- Preserved object URL cleanup in `ngOnDestroy()`.
- Preserved `UploadDropzoneComponent` click, keyboard, drag/drop, disabled, and `filesSelected` behavior.

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for shared sidebar, inbox conversations, shared header, Add Listing page SCSS, admin add-agency page, and appointments list.

Risks and assumptions:

- Shared `SelectableChipGridComponent` and `UploadDropzoneComponent` styles changed globally; this matches the reusable UI direction, but future agents should check other usages during Phase 10.
- The media checklist item remains informational because current save/publish behavior does not require media.
- No file size/type validation logic was added; existing accepted-file hints and browser accept attributes were preserved.
- Phase 8 should focus only on Contact & Description UI and preserve AI description generation.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 6 Completion Notes - 2026-05-14

- Completed Location step UI redesign.
- Replaced the older numbered `StepCardComponent` wrapper with the newer shared `SectionCardComponent`.
- Added a location icon and dashboard card variant for consistency with the redesigned Basic Info and Pricing steps.
- Reorganized the step into a responsive two-column layout:
  - city, neighborhood, address, and map link fields on the left
  - map preview and pin helper text on the right
- Kept the layout responsive so the map stacks below fields on narrower screens.
- Polished field labels, preview card spacing, map container border, and map toolbar styling using existing tokens.
- Kept all autocomplete, map pin, geolocation, map link, and touched-state behavior intact.
- Set current phase to Phase 7 - Redesign Features & Media step UI.

Changed files:

- `src/app/features/add-listing/components/property-location-step/property-location-step.ts`
- `src/app/features/add-listing/components/property-location-step/property-location-step.html`
- `src/app/features/add-listing/components/property-location-step/property-location-step.scss`
- `src/app/features/add-listing/components/location-map-picker/location-map-picker.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- Preserved required `[form]="locationForm"` binding from the Add Listing page.
- Preserved `[formGroup]="form"`.
- Preserved `formControlName="city"`.
- Preserved `formControlName="neighborhood"`.
- Preserved `formControlName="fullAddress"`.
- Preserved `formControlName="mapLink"`.
- Preserved city autocomplete binding:
  - `[matAutocomplete]="cityAuto"`
  - `[displayWith]="displayCityPlace"`
  - `(optionSelected)="onCitySelected($event)"`
- Preserved neighborhood autocomplete binding:
  - `[matAutocomplete]="neighborhoodAuto"`
  - `[displayWith]="displayNeighborhood"`
  - `(optionSelected)="onNeighborhoodSelected($event)"`
- Preserved touched handlers:
  - `(blur)="markLocationControlTouched('city')"`
  - `(blur)="markLocationControlTouched('neighborhood')"`
  - `(blur)="markLocationControlTouched('fullAddress')"`
- Preserved `<app-location-map-picker [form]="form" />`.
- Preserved `useMyLocation()` behavior inside `LocationMapPickerComponent`; only local map styling was adjusted.

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for shared header, shared sidebar, Add Listing page SCSS, inbox conversations, admin add-agency page, and appointments list.

Risks and assumptions:

- Location helper copy is static UI guidance and does not imply any new backend behavior.
- The map remains controlled by the existing Leaflet/geolocation implementation.
- The Add Listing page SCSS budget warning remains from Phase 5 and was not addressed in this phase.
- Phase 7 should focus only on Features & Media UI and preserve feature loading, retry, selected feature ids, media upload selection, previews, and object URL cleanup.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 5 Completion Notes - 2026-05-14

- Completed Basic Info / Pricing step UI work with the user's updated direction.
- Split Pricing into its own wizard step instead of keeping it inside Basic Info.
- Updated the wizard step flow to six steps:
  - Basic Info
  - Pricing
  - Location
  - Features & Media
  - Contact & Description
  - Review & Publish
- Updated `AddListingStepKey`, `stepOrder`, and `stepDefinitions` to include the separate `pricing` step.
- Moved `<app-pricing-details-section [form]="pricingForm" />` into its own `@case ('pricing')`.
- Added a right-side rail matching the reference direction:
  - Listing Progress card
  - circular progress indicator
  - ordered step progress tracker
  - checklist before publish
  - Need help card with AI tools action
- Added derived progress/checklist state from existing signals/forms only.
- Did not add autosave behavior or fake backend data.
- `Need help` action moves the user to the existing Contact & Description step where the AI description tool already lives.
- Polished Basic Information and Pricing cards:
  - added section icons
  - used `variant="dashboard"` on existing `app-section-card`
  - tightened field-label sizing
  - adjusted Basic Info layout for a cleaner wizard-card presentation
  - updated visible AI title helper copy without adding fake generation behavior
- Set current phase to Phase 6 - Redesign Location step UI.

Changed files:

- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.html`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.scss`
- `src/app/features/add-listing/components/basic-information-section/basic-information-section.ts`
- `src/app/features/add-listing/components/basic-information-section/basic-information-section.html`
- `src/app/features/add-listing/components/basic-information-section/basic-information-section.scss`
- `src/app/features/add-listing/components/pricing-details-section/pricing-details-section.html`
- `src/app/features/add-listing/components/pricing-details-section/pricing-details-section.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- Preserved `<app-page-header>` title/subtitle/actions and `(actionClicked)="onHeaderAction($event)"`.
- Preserved edit-mode loading/error banners.
- Preserved all Add Listing form instances and validators.
- Preserved Basic Info bindings:
  - `[formGroup]="form"`
  - `formControlName="purpose"`
  - `formControlName="propertyCategoryName"`
  - `formControlName="propertySubtypeName"`
  - `formControlName="listingTitle"`
  - catalog loading/retry behavior
  - purpose/category/subtype/title touched handlers
- Preserved Pricing bindings:
  - `[formGroup]="form"`
  - `formControlName="price"`
  - `formControlName="areaSize"`
  - `formControlName="areaUnit"`
  - all counter bindings and increment/decrement handlers
  - non-negative number guards
- Preserved save draft, publish listing, update listing, media upload, edit loading/patching, server error mapping, route navigation, and Back to Top behavior.
- Preserved AI description generation behavior; no AI title-generation handler was added.

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for shared sidebar, inbox conversations, shared header, admin add-agency page, and appointments list.
- New style budget warning: `src/app/features/add-listing/pages/add-listing-page/add-listing-page.scss` exceeds the 4.00 kB component style budget by about 2.24 kB after adding the right-side progress/help rail styles.

Risks and assumptions:

- The separate Pricing step is a deliberate adjustment from the previous five-step flow based on the user's latest instruction.
- The checklist is derived from existing form validity and selected media only. It does not enforce validation or alter save/publish behavior.
- The media checklist item is informational; current submit logic does not require media.
- The right-side progress rail is page-local for now. If similar rails are needed elsewhere, a later phase can extract it into shared UI.
- The page SCSS now exceeds the style budget. Phase 10 should either accept this budget warning if project policy allows it or extract/reduce styles.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 4 Completion Notes - 2026-05-14

- Completed form section grouping behind the Add Listing wizard step state.
- Replaced the old always-visible two-column section layout with an `@switch (activeStepKey())` template.
- Grouped current sections as:
  - `basic-pricing`: `BasicInformationSectionComponent` and `PricingDetailsSectionComponent`
  - `location`: `PropertyLocationStepComponent`
  - `features-media`: `FeaturesAmenitiesSectionComponent` and `PropertyMediaSectionComponent`
  - `contact-description`: `ContactInformationStepComponent` and `PropertyDescriptionStepComponent`
  - `review-publish`: lightweight review/publish guidance only
- Added `activeStepIndex`, `isFirstStep`, `isLastStep`, and `activeStepLabel` computed values.
- Added `goToPreviousStep()` and `goToNextStep()` handlers for basic wizard navigation.
- Added local SCSS for the step content stack, navigation buttons, and temporary review panel using existing tokens only.
- Kept Save Draft, Publish Listing, and Update Listing in the existing `PageHeaderComponent` actions.
- Set current phase to Phase 5 - Redesign Basic Info / Pricing step UI.

Changed files:

- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.html`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- Preserved `<app-page-header>` title/subtitle/actions and `(actionClicked)="onHeaderAction($event)"`.
- Preserved edit-mode loading/error banners.
- Preserved all child section form bindings, now rendered conditionally by step:
  - `<app-basic-information-section [form]="basicInfoForm" />`
  - `<app-pricing-details-section [form]="pricingForm" />`
  - `<app-features-amenities-section [form]="amenitiesForm" />`
  - `<app-property-media-section [form]="mediaForm" />`
  - `<app-property-location-step [form]="locationForm" />`
  - `<app-contact-information-step [form]="contactForm" />`
  - `<app-property-description-step [form]="descriptionForm" ... />`
- Preserved AI description bindings:
  - `[aiDescriptionEnabled]="aiDescriptionContextReady()"`
  - `[aiDescriptionLoading]="isGeneratingDescription()"`
  - `(generateDescription)="onGenerateDescription()"`
- Preserved save draft, publish listing, update listing, media upload, edit loading/patching, server error mapping, route navigation, and Back to Top behavior.
- Did not change form instances, validators, services, API payload building, or route configuration.

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for admin add-agency page, inbox conversations, shared header, appointments list, and shared sidebar.

Risks and assumptions:

- The Review & Publish step is intentionally not a full review summary yet. Phase 9 should replace or extend it if existing form data can be safely summarized.
- Navigation between steps does not validate or block movement yet. Submission behavior remains controlled by the existing save/publish/update handlers.
- Because inactive step components are conditionally removed from the DOM, child component local UI-only state may reset when changing steps. The page-level reactive forms and selected files remain owned by `AddListingPageComponent`.
- Phase 5 should polish only the Basic Info / Pricing step UI and preserve all bindings.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 3 Completion Notes - 2026-05-14

- Completed Add Listing page step state wiring.
- Imported the generic shared `WizardStepperComponent` into `AddListingPageComponent`.
- Added typed local step keys and step metadata using `AddListingStepKey` and `AddListingWizardStep`.
- Added `activeStepKey` as a signal and `listingSteps` as a computed step model.
- Wired `stepSelected` to `onWizardStepSelected`.
- Kept the stepper presentation-only; it does not submit, validate, mutate forms, upload media, call services, or navigate.
- Rendered the stepper above the existing Add Listing form sections.
- Did not hide, remove, or regroup any form sections in this phase.
- Used a five-step flow for the initial page wiring:
  - Basic Info
  - Location
  - Features & Media
  - Contact & Description
  - Review & Publish
- Reason for five-step flow: it matches the current phase plan and the supplied reference direction more closely than the original six-step suggestion. Phase 4 may still refine grouping, but must preserve all bindings.
- Set current phase to Phase 4 - Group form sections into steps.

Changed files:

- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.html`
- `src/app/features/add-listing/pages/add-listing-page/add-listing-page.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- Preserved `<app-page-header>` title/subtitle/actions and `(actionClicked)="onHeaderAction($event)"`.
- Preserved edit-mode loading/error banners.
- Preserved all child form section bindings:
  - `[form]="basicInfoForm"`
  - `[form]="pricingForm"`
  - `[form]="amenitiesForm"`
  - `[form]="mediaForm"`
  - `[form]="locationForm"`
  - `[form]="contactForm"`
  - `[form]="descriptionForm"`
- Preserved AI description bindings:
  - `[aiDescriptionEnabled]="aiDescriptionContextReady()"`
  - `[aiDescriptionLoading]="isGeneratingDescription()"`
  - `(generateDescription)="onGenerateDescription()"`
- Preserved save draft, publish listing, update listing, upload, edit patching, server error mapping, and route navigation behavior.
- Preserved the Back to Top action.

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for admin add-agency page, shared header, shared sidebar, inbox conversations, and appointments list.

Risks and assumptions:

- The stepper is currently UI/navigation state only; selecting a step changes active/completed styling but does not hide or scroll form sections yet.
- Phase 4 should use the existing `activeStepKey` signal when grouping sections into steps.
- Phase 4 must keep every existing form instance and binding connected.
- Review & Publish is currently represented only as step metadata; Phase 9 should decide whether a review summary can be safely derived.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 2 Completion Notes - 2026-05-14

- Completed the shared stepper component decision and implementation.
- Rechecked existing reusable candidates:
  - `StepCardComponent`
  - `SegmentedTabsComponent`
- Decided not to extend either existing component because both have existing semantics/usages that do not match a wizard stepper.
- Created a new generic shared `WizardStepperComponent`.
- Kept the component generic and not hardcoded to Add Listing.
- Used `input()` and `output()` APIs.
- Used `ChangeDetectionStrategy.OnPush`.
- Used existing design tokens only.
- Added accessible step semantics with native buttons, ordered list structure, `aria-current="step"`, disabled button support, and optional step descriptions.
- Did not wire the stepper into Add Listing yet.
- Did not edit Add Listing implementation files.
- Set current phase to Phase 3 - Add Listing page step state.

Changed files:

- `src/app/shared/ui/wizard-stepper/wizard-stepper.ts`
- `src/app/shared/ui/wizard-stepper/wizard-stepper.html`
- `src/app/shared/ui/wizard-stepper/wizard-stepper.scss`
- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- All Add Listing page/component bindings and handlers remain unchanged in this phase.
- `StepCardComponent` and `SegmentedTabsComponent` remain unchanged.

Checks run:

- `npm run build` - passed.

Build warnings still present:

- `CdkAutofill` unused in `src/app/features/add-listing/pages/add-listing-page/add-listing-page.ts`.
- `FeatureCardComponent` unused in `src/app/features/auth/components/login-card/login-card.component.ts`.
- Initial bundle exceeds budget by about 38.59 kB.
- Existing style budget warnings remain for admin add-agency page, shared sidebar, inbox conversations, appointments list, and shared header.

Risks and assumptions:

- The new stepper is not wired into Add Listing until Phase 3.
- Because it is shared UI, future changes should keep it generic and avoid Add Listing-specific labels or validation logic.
- The component uses native buttons for keyboard support. If Phase 10 AXE/manual review finds that arrow-key roving behavior is needed, add it as a generic enhancement then.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 1 Completion Notes - 2026-05-14

- Completed the binding/data-flow mapping phase.
- Added a detailed Binding Preservation Checklist covering:
  - page-level header/edit/section bindings
  - every reactive form and control
  - validators and touched/error behavior
  - submit/save draft/publish/update flows
  - edit-mode loading and patching
  - AI description generation
  - basic info catalog loading/retry
  - pricing counters and non-negative guards
  - features/amenities loading/retry/chip sync
  - media upload previews, video selection, object URL cleanup
  - location autocomplete, OSM suggestions, map pin, geolocation
  - contact and description section bindings
  - API field error maps
  - service/API calls
  - route/navigation behavior
- Documented that the visible `generate-title` chip is display data only at this point; Phase 1 inspection did not find an implemented title-generation output/handler.
- Did not edit Add Listing implementation files.
- Did not create the stepper.
- Did not redesign the page.
- Set current phase to Phase 2 - Shared stepper component decision.

Changed files:

- `docs/add-listing-stepper-redesign-tasks.md`

Preserved bindings/handlers:

- All Add Listing implementation files were left unchanged.
- The checklist now explicitly records the bindings/handlers future phases must preserve.

Checks run:

- Documentation edit only. No build was run because no implementation files were changed.

Risks and assumptions:

- Future phases must decide whether to extend `SegmentedTabsComponent` or create a new shared stepper. A new generic stepper still appears likely cleaner, but Phase 2 must make the decision from code context.
- The reference image groups "Features & Pricing" and "Media & Contact" into fewer steps than the initial six-step plan. Future phases may adjust grouping, but must document the reason and preserve all bindings.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.

### Phase 0 Completion Notes - 2026-05-14

- Completed inspection-only Phase 0.
- Read the actual context pack under `docs/agent/context-pack`.
- Inspected Add Listing page, route, constants, child components, service/data flow, reusable UI candidates, and theme/token files.
- Created `docs/add-listing-stepper-redesign-tasks.md`.
- Did not edit Add Listing implementation files.
- Did not create a stepper component.
- Did not redesign the page.
- Set current phase to Phase 1 - Map current form structure and data bindings.

Changed files:

- `docs/add-listing-stepper-redesign-tasks.md`

Checks run:

- Inspection commands only. No build was run because this phase is documentation-only and no implementation files were changed.

Risks and assumptions:

- The current page already has section components but not a true wizard state model.
- Existing child components use a mix of `@Input` and `input()` APIs. Future changes should prefer `input()`/`output()` for touched/new component APIs, but must avoid risky churn.
- `StepCardComponent` is a numbered card, not a full stepper.
- `SegmentedTabsComponent` is reusable but likely not sufficient for completed/pending wizard states without extension.
- The add-listing feature uses both internal APIs and external browser/network APIs: AI generation, media upload, GeoNames, Overpass, Leaflet, and browser geolocation.
- `CdkAutofill` is imported in `AddListingPageComponent`; previous builds reported it unused. Do not remove it unless a dedicated cleanup phase confirms it is safe.
- Source files contain some mojibake encoding artifacts in comments/text. Avoid unrelated encoding churn.
- The provided reference image could not be attached by Codex, so this file captures the design direction in text.

Next prompt:

> Read docs/add-listing-stepper-redesign-tasks.md and continue the current phase. Follow all rules in that file. Implement only the current phase, preserve all existing data bindings and functionality, run available checks, then update the markdown with completed work, changed files, preserved bindings, risks, and the next phase. Do not jump ahead.
