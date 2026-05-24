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
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, merge, of, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { InfoBannerComponent } from '../../../../shared/ui/info-banner/info-banner';
import { LocationMapPickerComponent } from '../location-map-picker/location-map-picker';
import { GooglePlacesService } from '../../../../core/services/google-places.service';
import type { LocationHierarchyItem, PlaceSuggestion } from '../../../../core/models/google-places.models';

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

  private readonly googlePlaces = inject(GooglePlacesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  readonly locationBanner = toSignal(
    this.translate.stream('addListing.location.banner'),
    { initialValue: '' }
  );

  readonly suggestions = signal<PlaceSuggestion[]>([]);
  readonly searchLoading = signal(false);
  readonly searchError = signal<string | null>(null);

  private readonly searchQuery$ = new Subject<string>();
  private sessionToken = crypto.randomUUID();

  readonly displaySuggestion = (value: PlaceSuggestion | string | null | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.mainText;
  };

  readonly selectedHierarchy = signal<LocationHierarchyItem[]>([]);

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => this.searchQuery$.complete());

    const queryCtrl = this.form.get('locationQuery');
    const hierarchyCtrl = this.form.get('locationHierarchy');
    const fullAddressCtrl = this.form.get('fullAddress');

    // Keep OnPush in sync and mirror locationHierarchy into the signal.
    const streams = [queryCtrl, hierarchyCtrl, fullAddressCtrl]
      .filter(Boolean)
      .map(c => merge(c!.valueChanges, c!.statusChanges));
    if (streams.length) {
      merge(...streams)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.selectedHierarchy.set(
            (hierarchyCtrl?.value as LocationHierarchyItem[]) ?? []
          );
          this.cdr.markForCheck();
        });
    }

    // switchMap cancels in-flight requests when the user types a new query.
    this.searchQuery$
      .pipe(
        switchMap(input => {
          if (!input) return of([] as PlaceSuggestion[]);
          this.searchLoading.set(true);
          return this.googlePlaces.searchPlaces(input, this.sessionToken).pipe(
            catchError(() => {
              this.searchError.set('Could not load suggestions. Please try again.');
              return of([] as PlaceSuggestion[]);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(results => {
        this.searchLoading.set(false);
        this.suggestions.set(results);
        this.cdr.markForCheck();
      });

    if (!queryCtrl) return;

    queryCtrl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        const trimmed = (value ?? '').toString().trim();
        // Any new keystroke invalidates the previously selected hierarchy.
        hierarchyCtrl?.setValue([], { emitEvent: false });
        this.searchError.set(null);
        this.searchQuery$.next(trimmed);
      });
  }

  onPlaceSelected(event: MatAutocompleteSelectedEvent): void {
    const suggestion = event.option.value as PlaceSuggestion;

    // Reset control to a plain string immediately so the form stays typed correctly.
    this.form.get('locationQuery')?.setValue(suggestion.mainText, { emitEvent: false });

    this.searchLoading.set(true);
    this.searchError.set(null);

    this.googlePlaces
      .getPlaceDetails(suggestion.placeId, this.sessionToken)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.searchLoading.set(false);
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: details => {
          if (!details) {
            this.searchError.set('Could not load place details. Please try again.');
            return;
          }

          const hierarchy = this.googlePlaces.buildLocationHierarchy(
            suggestion.placeId,
            details.addressComponents
          );
          const mapLink = `https://maps.google.com/?q=${details.latitude},${details.longitude}`;

          this.form.patchValue({
            locationHierarchy: hierarchy,
            latitude: details.latitude,
            longitude: details.longitude,
            fullAddress: details.formattedAddress,
            mapLink,
          });

          this.suggestions.set([]);
          // New session token for the next search — Google billing requirement.
          this.sessionToken = crypto.randomUUID();
        },
      });
  }

  markLocationControlTouched(name: 'locationQuery' | 'fullAddress'): void {
    this.form.get(name)?.markAsTouched();
    this.form.get('locationHierarchy')?.markAsTouched();
    this.cdr.markForCheck();
  }
}
