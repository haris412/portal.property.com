import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { SegmentedOptionGroupComponent } from '../../../../shared/ui/segmented-option-group/segmented-option-group';
import { ActionChipListComponent } from '../../../../shared/ui/action-chip-list/action-chip-list';
import { OptionItem, ActionChipData } from '../../../../core/models/ui.models';

type ListingPurpose = 'sale' | 'rent';

@Component({
  selector: 'app-basic-information-section',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SectionCardComponent,
    InfoBannerComponent,
    SegmentedOptionGroupComponent,
    ActionChipListComponent
  ],
  templateUrl: './basic-information-section.html',
  styleUrl: './basic-information-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicInformationSectionComponent {
  readonly purposeOptions = signal<readonly OptionItem<ListingPurpose>[]>([
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' }
  ]);

  readonly propertyTypes = signal([
    { id: 'house', label: 'House' },
    { id: 'apartment', label: 'Apartment' },
    { id: 'villa', label: 'Villa' },
    { id: 'penthouse', label: 'Penthouse' }
  ]);

  readonly titleActions = signal<readonly ActionChipData[]>([
    { id: 'generate-title', label: 'Ask AI to generate title' },
    { id: 'title-loading', label: 'Generating and populating field', muted: true, disabled: true }
  ]);

  readonly descriptionActions = signal<readonly ActionChipData[]>([
    { id: 'generate-description', label: 'Ask AI to generate description' },
    { id: 'description-loading', label: 'AI loader preview shown here', muted: true, disabled: true }
  ]);

  @Input({ required: true }) form!: FormGroup;
}