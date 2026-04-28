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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { CounterFieldComponent } from '../../../../shared/ui/counter-field/counter-field';
import { TranslateModule } from '@ngx-translate/core';

interface PricingField {
  id: string;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

interface CounterItem {
  id: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-pricing-details-section',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    SectionCardComponent,
    CounterFieldComponent
  ],
  templateUrl: './pricing-details-section.html',
  styleUrl: './pricing-details-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingDetailsSectionComponent implements OnInit {
  @Input({ required: true }) form!: FormGroup;

  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private static readonly NON_NEGATIVE_FIELDS = [
    'price',
    'areaSize',
    'numBedrooms',
    'numBathrooms',
    'numParkingSpaces',
    'numFloors',
  ] as const;

  readonly counters = signal<CounterItem[]>([
    { id: 'numBedrooms', label: 'Bedrooms', value: 2 },
    { id: 'numBathrooms', label: 'Bathrooms', value: 2 },
    { id: 'numParkingSpaces', label: 'Parking Spaces', value: 0 },
    { id: 'numFloors', label: 'Floors', value: 0 }
  ]);

  ngOnInit(): void {
    // Ensure the section updates under OnPush when parent patches the same FormGroup instance
    // (e.g. edit mode loads data and calls `form.patchValue`).
    const controls = PricingDetailsSectionComponent.NON_NEGATIVE_FIELDS.map((name) => this.form.get(name))
      .filter(Boolean)
      .map((c) => merge(c!.valueChanges, c!.statusChanges));
    if (controls.length) {
      merge(...controls)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.cdr.markForCheck());
    }

    for (const name of PricingDetailsSectionComponent.NON_NEGATIVE_FIELDS) {
      this.form
        .get(name)
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.clampToNonNegative(name));
    }
  }

  /** Price / area: user cannot type `-` (paste / programmatic values still clamped). */
  blockMinusOnNonNegativeNumberInput(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === '−' || event.code === 'NumpadSubtract') {
      event.preventDefault();
    }
  }

  private clampToNonNegative(controlName: string): void {
    const c = this.form.get(controlName);
    if (!c) {
      return;
    }
    const raw = c.value;
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Object.is(n, -0) || (Number.isFinite(n) && n < 0)) {
      this.setNonNegativeControlValue(c, 0);
    }
  }

  private setNonNegativeControlValue(c: AbstractControl, v: number): void {
    c.setValue(v, { emitEvent: false });
    c.updateValueAndValidity({ emitEvent: false });
    this.cdr.markForCheck();
  }

  decrementCounter(id: string): void {
    const control = this.form.get(id);
    if (!control) {
      return;
    }

    const current = Number(control.value) || 0;
    const next = Math.max(0, current - 1);
    control.setValue(next);
  }

  incrementCounter(id: string): void {
    const control = this.form.get(id);
    if (!control) {
      return;
    }

    const current = Number(control.value) || 0;
    const next = current + 1;
    control.setValue(next);
  }
}