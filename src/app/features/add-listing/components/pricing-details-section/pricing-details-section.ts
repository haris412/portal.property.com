import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
  readonly pricingFields = signal<PricingField[]>([
    {
      id: 'price',
      label: 'Price',
      value: '1,250,000',
      prefix: '$',
      hint: 'Total'
    },
    {
      id: 'area',
      label: 'Area Size',
      value: '2,450',
      suffix: 'sqft'
    }
  ]);

  readonly counters = signal<CounterItem[]>([
    { id: 'bedrooms', label: 'Bedrooms', value: 4 },
    { id: 'bathrooms', label: 'Bathrooms', value: 3 },
    { id: 'parking', label: 'Parking Spaces', value: 2 },
    { id: 'floors', label: 'Floors', value: 2 }
  ]);

  decrementCounter(id: string): void {
    this.counters.update((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, value: Math.max(0, item.value - 1) }
          : item
      )
    );
  }

  incrementCounter(id: string): void {
    this.counters.update((items) =>
      items.map((item) =>
        item.id === id ? { ...item, value: item.value + 1 } : item
      )
    );
  }
}