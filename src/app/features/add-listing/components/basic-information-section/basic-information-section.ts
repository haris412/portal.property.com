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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs';
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
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';

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

  readonly form    = this.buildForm();
  readonly isValid = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status), map(s => s === 'VALID')),
    { initialValue: this.form.valid }
  );

  readonly catalogStatus       = signal<'loading' | 'ready' | 'error'>('loading');
  readonly categories          = signal<readonly PropertyCatalogCategory[]>([]);
  private readonly selectedCategoryId = signal('');

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

  @Output() readonly formReady = new EventEmitter<FormGroup>();

  ngOnInit(): void {
    this.formReady.emit(this.form);
    this.loadCatalog();
  }

  // emitEvent:false on the patch skips propertyTypeId.valueChanges so we sync manually.
  refreshCategory(): void {
    const id = this.form.controls.propertyTypeId.value;
    this.selectedCategoryId.set(id);
    this.toggleSubtypeValidator(id);
  }

  patchFromProperty(doc: PropertyDetailDocument): void {
    const purpose        = (doc.purpose ?? '').toString().toLowerCase().includes('sale') ? 'sale' : 'rent';
    const listingTitle   = (doc.listingTitle ?? '').toString();
    const propertyTypeId = (doc.propertyTypeId ?? '').toString();
    const subtypeId      = (doc.subtypeId      ?? '').toString();

    // emitEvent:false prevents propertyTypeId.valueChanges from clearing subtypeId mid-patch.
    this.form.patchValue({ purpose, listingTitle, propertyTypeId, subtypeId }, { emitEvent: false });
    this.refreshCategory();
  }

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
    this.addListingService.invalidateListingConfigCache();
    this.catalogStatus.set('loading');
    this.loadCatalog();
  }

  private buildForm() {
    const form = this.fb.nonNullable.group({
      purpose:        ['rent' as ListingPurpose, Validators.required],
      propertyTypeId: ['', Validators.required],
      subtypeId:      [''],
      listingTitle:   ['', [Validators.required, Validators.maxLength(120)]],
    });

    form.controls.propertyTypeId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        form.controls.subtypeId.setValue('', { emitEvent: false });
        this.selectedCategoryId.set(id);
        this.toggleSubtypeValidator(id);
      });

    return form;
  }

  private loadCatalog(): void {
    this.addListingService.getListingConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ catalog }) => {
          this.categories.set(catalog.categories ?? []);
          this.catalogStatus.set('ready');
          this.refreshCategory();
        },
        error: () => this.catalogStatus.set('error'),
      });
  }

  private toggleSubtypeValidator(categoryId: string): void {
    const hasSubtypes = this.categories().some(c => c._id === categoryId && c.subtypes.length > 0);
    const ctrl = this.form.controls.subtypeId;
    hasSubtypes ? ctrl.setValidators(Validators.required) : ctrl.clearValidators();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }
}
