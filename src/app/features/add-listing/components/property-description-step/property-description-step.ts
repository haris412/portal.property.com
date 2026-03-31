import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StepCardComponent } from '../../../../shared/ui/step-card/step-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { ActionChipListComponent } from '../../../../shared/ui/action-chip-list/action-chip-list';
import { ActionChipData } from '../../../../core/models/ui.models';

@Component({
  selector: 'app-property-description-step',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    StepCardComponent,
    InfoBannerComponent,
    ActionChipListComponent,
  ],
  templateUrl: './property-description-step.html',
  styleUrl: './property-description-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDescriptionStepComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly form = input.required<FormGroup>();
  readonly aiDescriptionEnabled = input(false);
  readonly aiDescriptionLoading = input(false);
  readonly generateDescription = output<void>();

  readonly descriptionBanner = input(
    'Fill basic info, pricing, location, and pick at least one amenity to enable AI. You can always type the description yourself.'
  );

  readonly descriptionActions = computed<readonly ActionChipData[]>(() => {
    const enabled = this.aiDescriptionEnabled();
    const loading = this.aiDescriptionLoading();
    return [
      {
        id: 'generate-description',
        label: loading ? 'Generating description…' : 'Ask AI to generate description',
        disabled: !enabled || loading,
      },
    ];
  });

  ngOnInit(): void {
    const desc = this.form().get('propertyDescription');
    if (!desc) return;
    merge(desc.valueChanges, desc.statusChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  onDescriptionAction(id: string): void {
    if (id === 'generate-description') {
      this.generateDescription.emit();
    }
  }
}
