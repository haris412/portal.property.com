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
import { startWith, catchError, debounceTime, distinctUntilChanged, finalize, merge, of, switchMap, take, tap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { LocationMapPickerComponent } from '../location-map-picker/location-map-picker';
import { GooglePlacesService } from '../../../../core/services/google-places.service';
import type { LocationHierarchyItem, PlaceSuggestion } from '../../../../core/models/google-places.models';
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';

function coerceCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseLatLngFromMapLink(mapLink: string): { lat: number; lng: number } | null {
  const text = mapLink.trim();
  if (!text) return null;
  const patterns = [
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }
  return null;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

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
  private readonly fb           = inject(FormBuilder);
  private readonly googlePlaces = inject(GooglePlacesService);
  private readonly destroyRef   = inject(DestroyRef);

  readonly canContinue    = signal(false);
  readonly hasCoordinates = signal(false);
  readonly form           = this.buildForm();

  readonly suggestions    = signal<PlaceSuggestion[]>([]);
  readonly searchState    = signal<SearchState>({ status: 'idle' });
  readonly searchErrorMsg = computed(() => { const s = this.searchState(); return s.status === 'error' ? s.message : null; });

  readonly selectedHierarchy = signal<LocationHierarchyItem[]>([]);

  private sessionToken = crypto.randomUUID();

  readonly displaySuggestion = (value: PlaceSuggestion | string | null | undefined): string => {
    if (!value) return '';
    return typeof value === 'string' ? value : value.mainText;
  };

  @Output() readonly formReady = new EventEmitter<FormGroup>();

  ngOnInit(): void {
    this.formReady.emit(this.form);
    this.wireSearch();
  }

  markLocationControlTouched(name: 'locationQuery' | 'fullAddress'): void {
    this.form.controls[name].markAsTouched();
    this.form.controls.locationHierarchy.markAsTouched();
  }

  onPlaceSelected(event: MatAutocompleteSelectedEvent): void {
    const suggestion = event.option.value as PlaceSuggestion;
    this.form.controls.locationQuery.setValue(suggestion.mainText, { emitEvent: false });
    this.searchState.set({ status: 'loading' });

    this.googlePlaces
      .getPlaceDetails(suggestion.placeId, this.sessionToken)
      .pipe(
        finalize(() => this.searchState.set({ status: 'idle' })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: details => {
          if (!details) {
            this.searchState.set({ status: 'error', message: 'Could not load place details. Please try again.' });
            return;
          }
          this.form.patchValue({
            locationHierarchy: this.googlePlaces.buildLocationHierarchy(suggestion.placeId, details.addressComponents),
            latitude:          details.latitude,
            longitude:         details.longitude,
            fullAddress:       details.formattedAddress,
            mapLink:           `https://maps.google.com/?q=${details.latitude},${details.longitude}`,
          });
          this.suggestions.set([]);
          this.sessionToken = crypto.randomUUID();
        },
      });
  }

  patchFromProperty(doc: PropertyDetailDocument): void {
    const hierarchy            = this.buildLocationHierarchyFromProperty(doc);
    const { latitude, longitude, mapLink } = this.resolveCoordinates(doc);
    const locationQueryDisplay = hierarchy.length
      ? hierarchy[hierarchy.length - 1].name
      : (doc.neighborhood ?? doc.city ?? '').toString().trim();

    this.form.patchValue(
      {
        locationQuery:     locationQueryDisplay,
        locationHierarchy: hierarchy,
        fullAddress:       doc.fullAddress ?? '',
        mapLink,
        zipCode:           (doc as any).zipCode ?? '',
        latitude,
        longitude,
      },
      { emitEvent: latitude != null && longitude != null }
    );

    if (latitude == null || longitude == null) {
      this.geocodeMissingCoordinates(locationQueryDisplay, doc.fullAddress ?? '');
    }
  }

  geocodeMissingCoordinates(locationQuery: string, fullAddress: string): void {
    const searchText = (fullAddress || locationQuery).trim();
    if (!searchText) return;

    const sessionToken = crypto.randomUUID();

    this.googlePlaces.searchPlaces(searchText, sessionToken)
      .pipe(
        take(1),
        switchMap(suggestions => {
          const first = suggestions[0];
          if (!first?.placeId) return of(null);
          return this.googlePlaces.getPlaceDetails(first.placeId, sessionToken);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(details => {
        if (!details) return;

        const currentLat = coerceCoordinate(this.form.controls.latitude.value);
        const currentLng = coerceCoordinate(this.form.controls.longitude.value);
        if (currentLat != null && currentLng != null) return;

        const existingMapLink = this.form.controls.mapLink.value?.trim();
        this.form.patchValue({
          latitude:    details.latitude,
          longitude:   details.longitude,
          mapLink:     existingMapLink || `https://maps.google.com/?q=${details.latitude},${details.longitude}`,
          fullAddress: this.form.controls.fullAddress.value?.trim() || details.formattedAddress,
        }, { emitEvent: true });
      });
  }

  private buildForm() {
    const form = this.fb.nonNullable.group({
      locationQuery:     [''],
      locationHierarchy: [[] as LocationHierarchyItem[]],
      fullAddress:       ['', Validators.required],
      mapLink:           [''],
      zipCode:           [''],
      latitude:          [null as number | null],
      longitude:         [null as number | null],
    });

    merge(
      form.statusChanges.pipe(startWith(form.status)),
      form.controls.latitude.valueChanges,
      form.controls.longitude.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const lat = coerceCoordinate(form.controls.latitude.value);
        const lng = coerceCoordinate(form.controls.longitude.value);
        this.hasCoordinates.set(lat != null && lng != null);
        this.canContinue.set(form.status === 'VALID' && this.hasCoordinates());
      });

    form.controls.locationHierarchy.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hierarchy => this.selectedHierarchy.set(hierarchy ?? []));

    return form;
  }

  private wireSearch(): void {
    this.form.controls.locationQuery.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.searchState.set({ status: 'idle' });
          this.form.controls.locationHierarchy.setValue([], { emitEvent: false });
        }),
        switchMap(value => {
          const input = (value ?? '').toString().trim();
          if (!input) return of([] as PlaceSuggestion[]);

          this.searchState.set({ status: 'loading' });

          return this.googlePlaces.searchPlaces(input, this.sessionToken).pipe(
            catchError(() => {
              this.searchState.set({ status: 'error', message: 'Could not load suggestions. Please try again.' });
              return of([] as PlaceSuggestion[]);
            }),
            finalize(() => this.searchState.set({ status: 'idle' }))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(results => this.suggestions.set(results));
  }

  private buildLocationHierarchyFromProperty(doc: PropertyDetailDocument): LocationHierarchyItem[] {
    if (Array.isArray(doc.location) && doc.location.length > 0) {
      return doc.location.map(item => ({ id: item.id, level: item.level, name: item.name }));
    }
    const hierarchy: LocationHierarchyItem[] = [];
    const city         = (doc.city        ?? '').toString().trim();
    const neighborhood = (doc.neighborhood ?? '').toString().trim();
    if (city)         hierarchy.push({ level: 2, name: city });
    if (neighborhood) hierarchy.push({ level: 4, name: neighborhood });
    if (!hierarchy.length) {
      const fallback = (doc.fullAddress ?? '').toString().trim();
      if (fallback) hierarchy.push({ level: 4, name: fallback.length > 120 ? `${fallback.slice(0, 117)}...` : fallback });
    }
    return hierarchy;
  }

  private resolveCoordinates(doc: PropertyDetailDocument): { latitude: number | null; longitude: number | null; mapLink: string } {
    const mapLink   = (doc.mapLink ?? '').toString().trim();
    const latitude  = coerceCoordinate(doc.latitude);
    const longitude = coerceCoordinate(doc.longitude);

    if (latitude != null && longitude != null) {
      return { latitude, longitude, mapLink: mapLink || `https://maps.google.com/?q=${latitude},${longitude}` };
    }

    const fromLink = parseLatLngFromMapLink(mapLink);
    if (fromLink) {
      return { latitude: fromLink.lat, longitude: fromLink.lng, mapLink: mapLink || `https://maps.google.com/?q=${fromLink.lat},${fromLink.lng}` };
    }

    return { latitude, longitude, mapLink };
  }
}
