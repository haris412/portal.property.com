import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { SegmentedOptionGroupComponent } from '../../../../shared/ui/segmented-option-group/segmented-option-group';
import { ActionChipListComponent } from '../../../../shared/ui/action-chip-list/action-chip-list';
import { OptionItem, ActionChipData } from '../../../../core/interfaces/ui.models';
import { PropertyCatalogCategory } from '../../../../core/models/property-catalog.model';
import { AddListingService } from '../../../../core/services/add-listing.service';
import { TranslateModule } from '@ngx-translate/core';

type ListingPurpose = 'sale' | 'rent';

@Component({
  selector: 'app-basic-information-section',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    SectionCardComponent,
    InfoBannerComponent,
    SegmentedOptionGroupComponent,
    ActionChipListComponent,
  ],
  templateUrl: './basic-information-section.html',
  styleUrl: './basic-information-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicInformationSectionComponent implements OnInit {
  private readonly fb                = inject(FormBuilder);
  private readonly addListingService = inject(AddListingService);
  private readonly destroyRef        = inject(DestroyRef);

  // declared before buildForm() — buildForm() subscribes to statusChanges immediately on creation
  readonly canContinue = signal(false);
  readonly form        = this.buildForm();

  // catalog
  readonly catalogStatus = signal<'loading' | 'ready' | 'error'>('loading');
  readonly categories    = signal<readonly PropertyCatalogCategory[]>([]);

  // tracks the selected category _id — set when user picks or when edit-mode patch arrives
  private readonly selectedCategoryId = signal('');

  // derived automatically — no manual .set() anywhere, just reads two signals
  readonly availableSubtypes = computed(() =>
    this.categories().find(c => c._id === this.selectedCategoryId())?.subtypes ?? []
  );

  readonly purposeOptions: readonly OptionItem<ListingPurpose>[] = [
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' },
  ];

  readonly titleActions: readonly ActionChipData[] = [
    { id: 'generate-title', label: 'AI can help generate title' },
    { id: 'title-loading',  label: 'Generating and populating field', muted: true, disabled: true },
  ];

  // parent receives the form reference once, on init
  @Output() readonly formReady = new EventEmitter<FormGroup>();

  ngOnInit(): void {
    console.log('[BasicInfo] init');
    this.formReady.emit(this.form);
    this.loadCatalog();
  }

  // parent calls this after patching form with emitEvent:false in edit mode
  // emitEvent:false skips propertyTypeId.valueChanges so we sync manually
  refreshCategory(): void {
    const id = this.form.controls.propertyTypeId.value;
    console.log('[BasicInfo] refreshCategory — id:', id || 'none');
    this.selectedCategoryId.set(id);
    this.toggleSubtypeValidator(id);
  }

  // —— template events ——

  onPurposeChange(value: string): void {
    this.form.controls.purpose.setValue(value as ListingPurpose);
    this.form.controls.purpose.markAsTouched();
  }

  onPropertyTypePanelToggle(opened: boolean): void {
    if (!opened) this.form.controls.propertyTypeId.markAsTouched();
  }

  onSubtypePanelToggle(opened: boolean): void {
    if (!opened) this.form.controls.subtypeId.markAsTouched();
  }

  onListingTitleBlur(): void {
    this.form.controls.listingTitle.markAsTouched();
  }

  retryLoadCatalog(): void {
    this.addListingService.invalidatePropertyCatalogCache();
    this.catalogStatus.set('loading');
    this.loadCatalog();
  }

  // —— private ——

  private buildForm() {
    const form = this.fb.nonNullable.group({
      purpose:        ['rent' as ListingPurpose, Validators.required],
      propertyTypeId: ['', Validators.required], // category _id → payload
      subtypeId:      [''],                       // subtype  _id → payload
      listingTitle:   ['', [Validators.required, Validators.maxLength(120)]],
    });

    // gate the Continue button — valid only when all required fields are filled
    form.statusChanges
      .pipe(startWith(form.status), takeUntilDestroyed(this.destroyRef))
      .subscribe(status => this.canContinue.set(status === 'VALID'));

    // user changed category → reset subtype, sync signal so availableSubtypes recomputes
    form.controls.propertyTypeId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        form.controls.subtypeId.setValue('', { emitEvent: false });
        this.selectedCategoryId.set(id);
        this.toggleSubtypeValidator(id);
      });

    return form;
  }

  // single responsibility — fetches categories, sets catalogStatus, nothing else
  private loadCatalog(): void {
    this.addListingService.getPropertyCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories }) => {
          this.categories.set(categories ?? []);
          this.catalogStatus.set('ready');
          console.log('[BasicInfo] catalog ready —', categories.length, 'categories');
          // sync selectedCategoryId in case form was pre-filled (edit mode)
          // so availableSubtypes computed reflects the already-patched value
          this.refreshCategory();
        },
        error: (err) => {
          console.error('[BasicInfo] catalog error:', err);
          this.catalogStatus.set('error');
        },
      });
  }

  // only toggles subtypeId required validator based on whether the category has subtypes
  private toggleSubtypeValidator(categoryId: string): void {
    const hasSubtypes = this.categories().some(c => c._id === categoryId && c.subtypes.length > 0);
    const ctrl = this.form.controls.subtypeId;
    hasSubtypes ? ctrl.setValidators(Validators.required) : ctrl.clearValidators();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }
}
