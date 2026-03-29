import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { SegmentedOptionGroupComponent } from '../../../../shared/ui/segmented-option-group/segmented-option-group';
import { ActionChipListComponent } from '../../../../shared/ui/action-chip-list/action-chip-list';
import { OptionItem, ActionChipData } from '../../../../core/models/ui.models';
import {
  PropertyCatalogCategory,
  PropertyCatalogSubtype
} from '../../../../core/models/property-catalog.model';
import { AddListingService } from '../../../../core/services/add-listing.service';

type ListingPurpose = 'sale' | 'rent';

@Component({
  selector: 'app-basic-information-section',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    SectionCardComponent,
    InfoBannerComponent,
    SegmentedOptionGroupComponent,
    ActionChipListComponent
  ],
  templateUrl: './basic-information-section.html',
  styleUrl: './basic-information-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicInformationSectionComponent implements OnInit {
  private readonly addListingService = inject(AddListingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly purposeOptions = signal<readonly OptionItem<ListingPurpose>[]>([
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' }
  ]);

  readonly categories = signal<readonly PropertyCatalogCategory[]>([]);
  readonly availableSubtypes = signal<readonly PropertyCatalogSubtype[]>([]);
  readonly catalogLoading = signal(true);
  readonly catalogError = signal(false);

  readonly titleActions = signal<readonly ActionChipData[]>([
    { id: 'generate-title', label: 'Ask AI to generate title' },
    { id: 'title-loading', label: 'Generating and populating field', muted: true, disabled: true }
  ]);

  readonly descriptionActions = signal<readonly ActionChipData[]>([
    { id: 'generate-description', label: 'Ask AI to generate description' },
    { id: 'description-loading', label: 'AI loader preview shown here', muted: true, disabled: true }
  ]);

  @Input({ required: true }) form!: FormGroup;

  ngOnInit(): void {
    this.loadCatalog();

    this.form
      .get('propertyCategoryName')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((categoryName) => {
        this.form.get('propertySubtypeName')?.setValue('', { emitEvent: false });
        this.applyCategorySelection(categoryName ?? '');
      });
  }

  retryLoadCatalog(): void {
    this.addListingService.invalidatePropertyCatalogCache();
    this.catalogError.set(false);
    this.catalogLoading.set(true);
    this.loadCatalog();
  }

  private loadCatalog(): void {
    this.addListingService
      .getPropertyCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.categories.set(data.categories ?? []);
          this.catalogLoading.set(false);
          this.catalogError.set(false);
          const categoryName = this.form.get('propertyCategoryName')?.value;
          if (categoryName) {
            this.applyCategorySelection(categoryName);
          }
        },
        error: () => {
          this.catalogLoading.set(false);
          this.catalogError.set(true);
        }
      });
  }

  private applyCategorySelection(categoryName: string): void {
    const category = this.categories().find((c) => c.name === categoryName);
    const subtypes = category?.subtypes ?? [];
    this.availableSubtypes.set(subtypes);

    const subtypeCtrl = this.form.get('propertySubtypeName');
    if (!subtypeCtrl) {
      return;
    }

    if (subtypes.length > 0) {
      subtypeCtrl.setValidators(Validators.required);
    } else {
      subtypeCtrl.clearValidators();
      subtypeCtrl.setValue('', { emitEvent: false });
    }
    subtypeCtrl.updateValueAndValidity({ emitEvent: false });
  }
}
