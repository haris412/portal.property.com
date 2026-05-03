import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { EMPTY, catchError, merge, of, switchMap, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { SegmentedOptionGroupComponent } from '../../../../shared/ui/segmented-option-group/segmented-option-group';
import { ActionChipListComponent } from '../../../../shared/ui/action-chip-list/action-chip-list';
import { OptionItem, ActionChipData } from '../../../../core/models/ui.models';
import { KeyValueItem } from '../../../../core/models/common.model';
import { ESelectEntity } from '../../../../core/enums/select-entity.enum';
import { CommonService } from '../../../../core/services/common.service';
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
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly form = input.required<FormGroup>();

  readonly purposeOptions: readonly OptionItem<ListingPurpose>[] = [
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' },
  ];

  readonly propertyTypes = signal<readonly KeyValueItem[]>([]);
  readonly availableSubtypes = signal<readonly KeyValueItem[]>([]);
  readonly typesLoading = signal(true);
  readonly typesError = signal(false);
  readonly subtypesLoading = signal(false);

  readonly titleActions: readonly ActionChipData[] = [
    { id: 'generate-title', label: 'Ask AI to generate title' },
    { id: 'title-loading', label: 'Generating and populating field', muted: true, disabled: true },
  ];

  ngOnInit(): void {
    this.loadPropertyTypes();
    this.listenToFormChanges();
    this.listenToTypeSelection();
  }

  onPurposeChange(value: string): void {
    const ctrl = this.form().get('purpose');
    ctrl?.setValue(value as ListingPurpose);
    ctrl?.markAsTouched();
    this.cdr.markForCheck();
  }

  onPropertyTypePanelToggle(opened: boolean): void {
    if (!opened) {
      this.form().get('propertyCategoryName')?.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  onCategoryFieldPanelToggle(opened: boolean): void {
    if (!opened) {
      this.form().get('propertySubtypeName')?.markAsTouched();
      this.cdr.markForCheck();
    }
  }

  onListingTitleBlur(): void {
    this.form().get('listingTitle')?.markAsTouched();
    this.cdr.markForCheck();
  }

  retryLoadTypes(): void {
    this.typesError.set(false);
    this.typesLoading.set(true);
    this.loadPropertyTypes();
  }

  // Triggers markForCheck whenever a form field's value or validation state changes.
  // Required because OnPush does not track reactive form control updates automatically.
  private listenToFormChanges(): void {
    const controls = ['purpose', 'propertyCategoryName', 'propertySubtypeName', 'listingTitle']
      .map((name) => this.form().get(name))
      .filter((ctrl): ctrl is NonNullable<typeof ctrl> => ctrl !== null)
      .map((ctrl) => merge(ctrl.valueChanges, ctrl.statusChanges));

    if (controls.length) {
      merge(...controls)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.cdr.markForCheck());
    }
  }

  // Reacts to property type changes: resets the subtype field and fetches
  // the new subtype list from the API. switchMap cancels any in-flight
  // subtype request when the user changes the type before it resolves.
  private listenToTypeSelection(): void {
    this.form()
      .get('propertyCategoryName')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.form().get('propertySubtypeName')?.setValue('', { emitEvent: false });
          this.availableSubtypes.set([]);
        }),
        switchMap((typeName: string) => {
          if (!typeName) {
            this.subtypesLoading.set(false);
            this.updateSubtypeValidators([]);
            return EMPTY;
          }
          this.subtypesLoading.set(true);
          return this.commonService
            .querySelectItems(ESelectEntity.PropertySubtype, typeName)
            .pipe(catchError(() => of([] as KeyValueItem[])));
        }),
      )
      .subscribe((subtypes) => {
        this.availableSubtypes.set(subtypes);
        this.subtypesLoading.set(false);
        this.updateSubtypeValidators(subtypes);
      });
  }

  private loadPropertyTypes(): void {
    this.commonService
      .querySelectItems(ESelectEntity.PropertyType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types) => {
          this.propertyTypes.set(types);
          this.typesLoading.set(false);
          this.typesError.set(false);
          // Edit mode: a type is already selected, pre-load its subtypes.
          const existingType = this.form().get('propertyCategoryName')?.value;
          if (existingType) {
            this.loadSubtypesFor(existingType);
          }
        },
        error: () => {
          this.typesLoading.set(false);
          this.typesError.set(true);
        },
      });
  }

  private loadSubtypesFor(typeName: string): void {
    this.subtypesLoading.set(true);
    this.commonService
      .querySelectItems(ESelectEntity.PropertySubtype, typeName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (subtypes) => {
          this.availableSubtypes.set(subtypes);
          this.subtypesLoading.set(false);
          this.updateSubtypeValidators(subtypes);
        },
        error: () => {
          this.subtypesLoading.set(false);
        },
      });
  }

  private updateSubtypeValidators(subtypes: readonly KeyValueItem[]): void {
    const ctrl = this.form().get('propertySubtypeName');
    if (!ctrl) return;
    if (subtypes.length > 0) {
      ctrl.setValidators(Validators.required);
    } else {
      ctrl.clearValidators();
      ctrl.setValue('', { emitEvent: false });
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }
}
