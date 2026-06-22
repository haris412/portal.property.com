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
import { FormGroup } from '@angular/forms';
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
  private readonly addListingService = inject(AddListingService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) form!: FormGroup;

  readonly chipItems = signal<readonly SelectableChipItem[]>([]);
  readonly featuresLoading = signal(true);
  readonly featuresError = signal(false);

  ngOnInit(): void {
    this.loadFeatures();

    this.form
      .get('selectedFeatureIds')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncChipsFromFormValue());
  }

  retryLoadFeatures(): void {
    this.addListingService.invalidatePropertyFeaturesCache();
    this.featuresError.set(false);
    this.featuresLoading.set(true);
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
          this.featuresLoading.set(false);
          this.featuresError.set(false);
          this.setChipsFromFeatures(features);
        },
        error: () => {
          this.featuresLoading.set(false);
          this.featuresError.set(true);
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
