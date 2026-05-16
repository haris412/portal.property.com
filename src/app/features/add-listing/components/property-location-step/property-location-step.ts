import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, merge } from 'rxjs';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { LocationMapPickerComponent } from '../location-map-picker/location-map-picker';
import { LocationCatalogService } from '../../../../core/services/location-catalog.service';
import type { GeoNamePlace } from '../../../../core/models/geonames.models';
import type { OsmLocationPickItem, OsmPickKind } from '../../../../core/models/overpass.models';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/** Default listing country for GeoNames populated-place catalog (ISO alpha-2). */
const LISTING_COUNTRY_CODE = 'PK';

@Component({
  selector: 'app-property-location-step',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    SectionCardComponent,
    InfoBannerComponent,
    LocationMapPickerComponent,
  ],
  templateUrl: './property-location-step.html',
  styleUrl: './property-location-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyLocationStepComponent implements OnInit {
  @Input({ required: true }) form!: FormGroup;

  private readonly catalog = inject(LocationCatalogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  readonly locationBanner = toSignal(
    this.translate.stream('addListing.location.banner'),
    { initialValue: '' }
  );

  readonly allPlaces = signal<GeoNamePlace[]>([]);
  readonly filteredPlaces = signal<GeoNamePlace[]>([]);
  readonly citiesLoading = signal(false);
  readonly citiesError = signal<string | null>(null);

  readonly allNeighborhoods = signal<OsmLocationPickItem[]>([]);
  readonly filteredNeighborhoods = signal<OsmLocationPickItem[]>([]);
  readonly neighborhoodsLoading = signal(false);
  readonly neighborhoodsError = signal<string | null>(null);

  /** Mat-autocomplete display for city when the control briefly holds a `GeoNamePlace`. */
  readonly displayCityPlace = (value: GeoNamePlace | string | null | undefined): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value.name;
  };

  /** Keep autocomplete input text as the area name while options use full OSM rows. */
  readonly displayNeighborhood = (value: OsmLocationPickItem | string | null | undefined): string => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value.name;
  };

  pickTrackKey(item: OsmLocationPickItem): string {
    return `${item.kind}-${item.osmType}-${item.osmId}`;
  }

  pickKindLabel(kind: OsmPickKind): string {
    switch (kind) {
      case 'suburb':
      case 'neighbourhood':
        return 'Area';
      case 'road':
        return 'Road';
      case 'restaurant':
        return 'Restaurant';
    }
  }

  private lastOsmGeonameId: number | null = null;

  ngOnInit(): void {
    const cityCtrl = this.form.get('city');
    if (!cityCtrl) return;

    const neighborhoodCtrl = this.form.get('neighborhood');
    const fullAddress = this.form.get('fullAddress');
    const streams = [cityCtrl, neighborhoodCtrl, fullAddress]
      .filter(Boolean)
      .map((c) => merge(c!.valueChanges, c!.statusChanges));
    if (streams.length) {
      merge(...streams)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.cdr.markForCheck());
    }

    this.citiesLoading.set(true);
    this.citiesError.set(null);

    this.catalog
      .getPopulatedPlaces({ countryCode: LISTING_COUNTRY_CODE })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.allPlaces.set(rows);
          this.applyCityFilter(cityTermFromControl(cityCtrl.value));
          this.tryLoadNeighborhoodsFromCityString(cityTermFromControl(cityCtrl.value));
          this.citiesLoading.set(false);
        },
        error: () => {
          this.citiesLoading.set(false);
          this.citiesError.set('Cities list could not be loaded. You can still enter a city manually.');
        },
      });

    cityCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => {
      this.applyCityFilter(cityTermFromControl(v));
    });

    cityCtrl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((v) => {
        this.tryLoadNeighborhoodsFromCityString(cityTermFromControl(v));
      });

    neighborhoodCtrl?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        this.applyNeighborhoodFilter(String(v ?? ''));
      });
  }

  onCitySelected(event: MatAutocompleteSelectedEvent): void {
    const place = event.option.value as GeoNamePlace;
    if (!place?.geonameId) return;
    this.form.get('city')?.setValue(place.name, { emitEvent: false });
    this.applyCityFilter(place.name);
    this.lastOsmGeonameId = null;
    this.fetchNeighborhoodsForPlace(place);
  }

  onNeighborhoodSelected(event: MatAutocompleteSelectedEvent): void {
    const pick = event.option.value as OsmLocationPickItem;
    if (pick?.osmId == null) return;
    this.form.get('neighborhood')?.setValue(pick.name, { emitEvent: false });
    this.applyNeighborhoodFilter(pick.name);
    this.patchMapPin(pick.lat, pick.lon);
  }

  markLocationControlTouched(name: 'city' | 'neighborhood' | 'fullAddress'): void {
    this.form.get(name)?.markAsTouched();
    this.cdr.markForCheck();
  }

  private applyCityFilter(term: string): void {
    const list = this.allPlaces();
    this.filteredPlaces.set(filterPlacesByTerm(list, term));
  }

  private applyNeighborhoodFilter(term: string): void {
    const list = this.allNeighborhoods();
    this.filteredNeighborhoods.set(filterOsmPickByTerm(list, term));
  }

  private tryLoadNeighborhoodsFromCityString(term: string): void {
    const trimmed = term.trim();
    if (!trimmed) {
      this.resetNeighborhoodCatalog();
      return;
    }
    const matches = this.allPlaces().filter(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (matches.length !== 1) {
      this.resetNeighborhoodCatalog();
      return;
    }
    this.fetchNeighborhoodsForPlace(matches[0]);
  }

  private resetNeighborhoodCatalog(): void {
    this.lastOsmGeonameId = null;
    this.allNeighborhoods.set([]);
    this.filteredNeighborhoods.set([]);
    this.neighborhoodsError.set(null);
  }

  /**
   * Updates the Leaflet pin via the same `latitude` / `longitude` controls the map reads.
   * `LocationMapPickerComponent` listens to `form.valueChanges` and keeps the marker in sync;
   * drag + “Use my location” still patch these fields as before.
   */
  private patchMapPin(lat: number, lng: number): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    this.form.patchValue({ latitude: lat, longitude: lng, mapLink }, { emitEvent: true });
    this.cdr.markForCheck();
  }

  private fetchNeighborhoodsForPlace(place: GeoNamePlace): void {
    const lat = Number(place.lat);
    const lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      this.resetNeighborhoodCatalog();
      return;
    }

    this.patchMapPin(lat, lng);

    if (this.lastOsmGeonameId === place.geonameId) return;
    this.lastOsmGeonameId = place.geonameId;

    this.neighborhoodsLoading.set(true);
    this.neighborhoodsError.set(null);

    this.catalog
      .getMergedLocationSuggestionsAround({ lat, lng })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.neighborhoodsLoading.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (list) => {
          this.allNeighborhoods.set(list);
          this.applyNeighborhoodFilter(String(this.form.get('neighborhood')?.value ?? ''));
        },
        error: () => {
          this.neighborhoodsError.set(
            'Areas list could not be loaded. You can type the neighborhood manually.'
          );
          this.allNeighborhoods.set([]);
          this.filteredNeighborhoods.set([]);
        },
      });
  }
}

function cityTermFromControl(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const p = value as GeoNamePlace;
  return p.name ?? '';
}

function filterPlacesByTerm(places: GeoNamePlace[], term: string): GeoNamePlace[] {
  const t = term.trim().toLowerCase();
  if (!t) {
    return places.slice(0, 80);
  }
  return places
    .filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.toponymName.toLowerCase().includes(t) ||
        (p.adminName1?.toLowerCase().includes(t) ?? false)
    )
    .slice(0, 100);
}

function filterOsmPickByTerm(items: OsmLocationPickItem[], term: string): OsmLocationPickItem[] {
  const t = term.trim().toLowerCase();
  if (!t) {
    return items.slice(0, 100);
  }
  return items.filter((a) => a.name.toLowerCase().includes(t)).slice(0, 100);
}
