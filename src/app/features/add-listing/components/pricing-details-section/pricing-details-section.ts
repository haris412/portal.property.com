import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { CounterFieldComponent } from '../../../../shared/ui/counter-field/counter-field';

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
export class PricingDetailsSectionComponent {
  @Input({ required: true }) form!: FormGroup;

  readonly counters = signal<CounterItem[]>([
    { id: 'numBedrooms', label: 'Bedrooms', value: 2 },
    { id: 'numBathrooms', label: 'Bathrooms', value: 2 },
    { id: 'numParkingSpaces', label: 'Parking Spaces', value: 0 },
    { id: 'numFloors', label: 'Floors', value: 0 }
  ]);

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