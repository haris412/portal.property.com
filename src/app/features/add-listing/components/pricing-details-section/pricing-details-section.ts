import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import type { PropertyDetailDocument } from '../../../../core/models/property-detail.model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { CounterFieldComponent } from '../../../../shared/ui/counter-field/counter-field';
import { TranslateModule } from '@ngx-translate/core';

const NUMERIC_CONTROLS = [
  'price', 'areaSize', 'numBedrooms', 'numBathrooms', 'numParkingSpaces', 'numFloors',
] as const;

@Component({
  selector: 'app-pricing-details-section',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    SectionCardComponent,
    CounterFieldComponent,
  ],
  templateUrl: './pricing-details-section.html',
  styleUrl: './pricing-details-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingDetailsSectionComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly destroyRef  = inject(DestroyRef);

  readonly form     = this.buildForm();
  readonly isValid  = toSignal(this.form.statusChanges.pipe(startWith(this.form.status), map(s => s === 'VALID')), { initialValue: this.form.valid });

  readonly counters: readonly { id: string; label: string }[] = [
    { id: 'numBedrooms',      label: 'Bedrooms'       },
    { id: 'numBathrooms',     label: 'Bathrooms'      },
    { id: 'numParkingSpaces', label: 'Parking Spaces' },
    { id: 'numFloors',        label: 'Floors'         },
  ];

  // parent receives the form reference once, on init
  @Output() readonly formReady = new EventEmitter<FormGroup>();

  ngOnInit(): void {
    this.formReady.emit(this.form);
  }

  patchFromProperty(doc: PropertyDetailDocument): void {
    this.form.patchValue({
      price:            doc.price            ?? 0,
      areaSize:         doc.areaSize         ?? 0,
      areaUnit:         doc.areaUnit         ?? 'sqft',
      numBedrooms:      doc.numBedrooms      ?? 0,
      numBathrooms:     doc.numBathrooms     ?? 0,
      numParkingSpaces: doc.numParkingSpaces ?? 0,
      numFloors:        doc.numFloors        ?? 0,
    }, { emitEvent: false });
  }

  // single method for both +/- on counters and price/area steppers
  stepControl(controlName: string, direction: 1 | -1): void {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return;
    const next = Math.max(0, Number(ctrl.value ?? 0) + direction);
    ctrl.setValue(next);
    ctrl.markAsTouched();
  }

  // prevents user typing '-' into number inputs — paste/programmatic values still clamped in buildForm
  blockMinus(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === '−' || event.code === 'NumpadSubtract') {
      event.preventDefault();
    }
  }
  private buildForm() {
    const form = this.fb.nonNullable.group({
      price:            [75000,  [Validators.required, Validators.min(0)]],
      areaSize:         [1200,   [Validators.required, Validators.min(0)]],
      areaUnit:         ['sqft',  Validators.required],
      numBedrooms:      [2,      [Validators.required, Validators.min(0)]],
      numBathrooms:     [2,      [Validators.required, Validators.min(0)]],
      numParkingSpaces: [0,      [Validators.required, Validators.min(0)]],
      numFloors:        [0,      [Validators.required, Validators.min(0)]],
    });

    // clamp all numeric fields to ≥ 0 (handles paste and programmatic negative values)
    for (const name of NUMERIC_CONTROLS) {
      form.controls[name].valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(val => {
          const n = Number(val);
          if (Number.isFinite(n) && n < 0) {
            form.controls[name].setValue(0, { emitEvent: false });
          }
        });
    }

    return form;
  }
}
