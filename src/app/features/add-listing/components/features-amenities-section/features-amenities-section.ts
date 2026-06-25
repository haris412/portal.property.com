import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { SelectableChipGridComponent } from '../../../../shared/ui/selectable-chip-grid/selectable-chip-grid';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { SelectableChipItem } from '../../../../core/interfaces/ui.models';
import { PropertyFeature } from '../../../../core/models/property-features.model';
import { AddListingService } from '../../../../core/services/add-listing.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-features-amenities-section',
  imports: [
    TranslateModule,
    SectionCardComponent,
    SelectableChipGridComponent,
    InfoBannerComponent,
    MatButtonModule
  ],
  templateUrl: './features-amenities-section.html',
  styleUrl: './features-amenities-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesAmenitiesSectionComponent implements OnInit {
  private readonly fb                = inject(FormBuilder);
  private readonly addListingService = inject(AddListingService);
  private readonly destroyRef        = inject(DestroyRef);

  @Output() readonly formReady = new EventEmitter<FormGroup>();

  readonly form      = this.fb.nonNullable.group({ selectedFeatureIds: [[] as string[]] });
  readonly chipItems     = signal<readonly SelectableChipItem[]>([]);
  readonly featuresState = signal<'loading' | 'error' | 'loaded'>('loading');

  ngOnInit(): void {
    this.formReady.emit(this.form);
    this.loadFeatures();

    this.form
      .get('selectedFeatureIds')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncChipsFromFormValue());
  }

  retryLoadFeatures(): void {
    this.addListingService.invalidatePropertyFeaturesCache();
    this.featuresState.set('loading');
    this.loadFeatures();
  }

  toggleAmenity(featureId: string): void {
    const ctrl = this.form.get('selectedFeatureIds');
    const current: string[] = [...(ctrl?.value ?? [])];
    const idx = current.indexOf(featureId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(featureId);
    }
    // Avoid emitEvent so we do not run a second sync that then gets overwritten by
    // a per-chip flip (that bug made only one chip appear selected).
    ctrl?.setValue(current, { emitEvent: false });

    const selected = new Set(current);
    this.chipItems.update((items) =>
      items.map((item) => ({ ...item, selected: selected.has(item.id) }))
    );
  }

  private loadFeatures(): void {
    this.addListingService
      .getPropertyFeatures()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (features) => {
          this.featuresState.set('loaded');
          this.setChipsFromFeatures(features);
        },
        error: () => {
          this.featuresState.set('error');
          this.chipItems.set([]);
        }
      });
  }

  private setChipsFromFeatures(features: PropertyFeature[]): void {
    this.syncChipsFromFormValue(features);
  }

  private syncChipsFromFormValue(featureSource?: PropertyFeature[]): void {
    const selected = new Set<string>(this.form.get('selectedFeatureIds')?.value ?? []);
    if (featureSource !== undefined) {
      this.chipItems.set(
        featureSource.map((f) => ({
          id: f._id,
          label: f.name,
          selected: selected.has(f._id)
        }))
      );
      return;
    }
    this.chipItems.update((items) =>
      items.map((item) => ({ ...item, selected: selected.has(item.id) }))
    );
  }
}
