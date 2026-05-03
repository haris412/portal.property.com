import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { map, startWith, take } from 'rxjs';
import { AlertService } from '../../../../core/services/alert.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AddListingService } from '../../../../core/services/add-listing.service';
import { LocationCatalogService } from '../../../../core/services/location-catalog.service';
import type { PropertyAlert, AlertPurpose } from '../../../../core/models/alert.models';
import type { PropertyCatalogCategory, PropertyCatalogSubtype } from '../../../../core/models/property-catalog.model';
import type { GeoNamePlace } from '../../../../core/models/geonames.models';

export interface AlertFormDialogData {
  alert?: PropertyAlert;
}

@Component({
  selector: 'app-alert-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './alert-form-dialog.component.html',
  styleUrl: './alert-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertFormDialogComponent {
  private readonly dialogRef   = inject(MatDialogRef<AlertFormDialogComponent>);
  private readonly data        = inject<AlertFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb          = inject(FormBuilder);
  private readonly alertSvc    = inject(AlertService);
  private readonly notify      = inject(NotificationService);
  private readonly catalogSvc  = inject(AddListingService);
  private readonly locationSvc = inject(LocationCatalogService);

  readonly submitting = signal(false);
  readonly isEdit     = !!this.data.alert;

  readonly purposes: AlertPurpose[] = ['For Sale', 'For Rent', 'Any'];

  readonly form = this.fb.group({
    purpose:      [null as AlertPurpose | null, Validators.required],
    city:         [null as string | null, [Validators.required, Validators.maxLength(100)]],
    neighborhood:     [null as string | null],
    propertyCategory: [null as string | null, Validators.required],
    propertySubtype:  [{ value: null as string | null, disabled: true }],
    minPrice:     [null as number | null, [Validators.min(0)]],
    maxPrice:     [null as number | null, [Validators.min(0)]],
    minBedrooms:  [null as number | null, [Validators.min(0), Validators.max(20)]],
  });

  // ── Catalog data ─────────────────────────────────────────────────────────────

  readonly categories = toSignal(
    this.catalogSvc.getPropertyCatalog().pipe(map((d) => d.categories)),
    { initialValue: [] as PropertyCatalogCategory[] }
  );

  private readonly allCities = toSignal(
    this.locationSvc.getPopulatedPlaces({ countryCode: 'PK', maxRows: 80 }),
    { initialValue: [] as GeoNamePlace[] }
  );

  private readonly cityQuery = toSignal(
    this.form.controls.city.valueChanges.pipe(startWith(null)),
    { initialValue: null as string | null }
  );

  readonly filteredCities = computed(() => {
    const q = (this.cityQuery() ?? '').toLowerCase().trim();
    const all = this.allCities();
    if (!q) return all.slice(0, 30);
    return all.filter((c) => c.name.toLowerCase().startsWith(q)).slice(0, 30);
  });

  private readonly selectedCategory = toSignal(
    this.form.controls.propertyCategory.valueChanges.pipe(startWith(null)),
    { initialValue: null as string | null }
  );

  readonly availableSubtypes = computed((): PropertyCatalogSubtype[] => {
    const catName = this.selectedCategory();
    if (!catName) return [];
    return this.categories().find((c) => c.name === catName)?.subtypes ?? [];
  });

  // ── Init ──────────────────────────────────────────────────────────────────────

  constructor() {
    if (this.data.alert) {
      const { purpose, city, neighborhood, minPrice, maxPrice, minBedrooms, propertyType, subtype } = this.data.alert;
      this.form.patchValue({
        purpose,
        city,
        neighborhood:     neighborhood ?? null,
        propertyCategory: propertyType ?? null,
        minPrice,
        maxPrice,
        minBedrooms,
      });
      if (propertyType) {
        this.form.controls.propertySubtype.enable();
        this.form.controls.propertySubtype.setValue(subtype ?? null);
      }
    }
  }

  onCategoryChange(): void {
    this.form.controls.propertySubtype.reset(null);
    this.form.controls.propertySubtype.enable();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const raw = this.form.getRawValue();
    const payload = {
      purpose:      raw.purpose,
      city:         raw.city?.trim() || null,
      neighborhood: raw.neighborhood?.trim() || null,
      propertyType: raw.propertyCategory || null,
      subtype:      raw.propertySubtype  || null,
      minPrice:     raw.minPrice ?? null,
      maxPrice:     raw.maxPrice ?? null,
      minBedrooms:  raw.minBedrooms ?? null,
      isActive:     this.data.alert?.isActive ?? true,
    };

    this.submitting.set(true);

    const op$ = this.isEdit && this.data.alert
      ? this.alertSvc.update(this.data.alert._id, payload)
      : this.alertSvc.create(payload);

    op$.pipe(take(1)).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: unknown) => {
        this.submitting.set(false);
        this.notify.error((err instanceof Error) ? err.message : 'Could not save alert');
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
