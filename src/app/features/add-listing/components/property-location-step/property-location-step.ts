import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith, catchError, debounceTime, distinctUntilChanged, filter, finalize, merge, of, switchMap, take, tap } from 'rxjs';
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

  readonly isActive       = input(false);
  readonly isValid        = signal(false);
  readonly hasCoordinates = signal(false);
  // True once a real location is chosen — either a map pin (hasCoordinates) or a placeId
  // picked from search. Place Details no longer auto-fills coordinates, so coordinates alone
  // can't gate "location chosen" anymore.
  readonly hasLocation    = signal(false);
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

    // Place Details is no longer called from the frontend — the backend resolves full
    // address/coordinates from placeId internally. Only the placeId + autocomplete's
    // own text are captured here; latitude/longitude are set by the map pin (click/drag).
    this.form.patchValue({
      placeId:     suggestion.placeId,
      fullAddress: [suggestion.mainText, suggestion.secondaryText].filter(Boolean).join(', '),
    });
    this.suggestions.set([]);
    this.sessionToken = crypto.randomUUID();
  }

  patchFromProperty(doc: PropertyDetailDocument): void {
    const hierarchy            = this.buildLocationHierarchyFromProperty(doc);
    const { latitude, longitude, mapLink } = this.resolveCoordinates(doc);
    const locationQueryDisplay = hierarchy.length
      ? hierarchy[hierarchy.length - 1].name
      : (doc.neighborhood ?? doc.city ?? '').toString().trim();

    // emitEvent:false prevents locationQuery.valueChanges from triggering wireSearch,
    // which would clear locationHierarchy after its 300ms debounce.
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
      { emitEvent: false }
    );

    if (latitude == null || longitude == null) {
      this.geocodeMissingCoordinates(locationQueryDisplay, doc.fullAddress ?? '');
    }
  }

  geocodeMissingCoordinates(locationQuery: string, fullAddress: string): void {
    const searchText = (fullAddress || locationQuery).trim();
    if (!searchText) return;

    const sessionToken = crypto.randomUUID();

    // Place Details is no longer called from the frontend — this can only recover a
    // placeId from the top autocomplete match now, not coordinates. Latitude/longitude for
    // legacy properties missing them must be set manually via the map pin.
    this.googlePlaces.searchPlaces(searchText, sessionToken)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(suggestions => {
        const first = suggestions[0];
        if (!first?.placeId || this.form.controls.placeId.value) return;
        this.form.controls.placeId.setValue(first.placeId);
      });
  }

  private buildForm() {
    const form = this.fb.nonNullable.group({
      locationQuery:     [''],
      locationHierarchy: [[] as LocationHierarchyItem[]],
      placeId:           [''],
      fullAddress:       ['', Validators.required],
      mapLink:           [''],
      zipCode:           [''],
      latitude:          [null as number | null],
      longitude:         [null as number | null],
    });

    merge(
      form.statusChanges.pipe(startWith(form.status)),
      form.controls.latitude.valueChanges,
      form.controls.longitude.valueChanges,
      form.controls.placeId.valueChanges
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const lat = coerceCoordinate(form.controls.latitude.value);
        const lng = coerceCoordinate(form.controls.longitude.value);
        this.hasCoordinates.set(lat != null && lng != null);
        this.hasLocation.set(this.hasCoordinates() || !!form.controls.placeId.value?.trim());
        this.isValid.set(form.status === 'VALID' && this.hasLocation());
      });

    form.controls.locationHierarchy.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hierarchy => this.selectedHierarchy.set(hierarchy ?? []));

    return form;
  }

  private wireSearch(): void {
    this.form.controls.locationQuery.valueChanges
      .pipe(
        // Selecting a mat-option writes the raw suggestion object into this control's value
        // (a real, emitEvent:true change) before onPlaceSelected()'s own corrective setValue
        // runs. Without this guard, that object reaches debounceTime/tap below and — once its
        // 300ms debounce elapses — silently wipes out the hierarchy onPlaceSelected() already
        // built from a valid selection.
        filter((value): value is string => typeof value === 'string'),
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
