import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { PropertyAlert } from '../../../../core/models/alert.models';

@Component({
  selector: 'app-alert-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule, MatTooltipModule],
  templateUrl: './alert-card.component.html',
  styleUrl: './alert-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertCardComponent {
  readonly alert = input.required<PropertyAlert>();

  readonly editClicked   = output<void>();
  readonly deleteClicked = output<void>();
  readonly toggleClicked = output<void>();

  readonly summaryLine = computed(() => {
    const a = this.alert();
    const parts: string[] = [];
    if (a.city)         parts.push(a.city);
    if (a.neighborhood) parts.push(a.neighborhood);
    if (a.purpose)      parts.push(a.purpose);
    if (a.propertyType) parts.push(a.propertyType);
    if (a.subtype)      parts.push(a.subtype);
    return parts.join(' · ') || 'No filters set';
  });

  readonly bedsLabel = computed(() => {
    const beds = this.alert().minBedrooms;
    return beds != null ? `${beds}+ Beds` : null;
  });

  readonly priceLabel = computed(() => {
    const { minPrice, maxPrice } = this.alert();
    if (minPrice == null && maxPrice == null) return null;
    if (minPrice != null && maxPrice != null) return `PKR ${this.fmt(minPrice)} – ${this.fmt(maxPrice)}`;
    if (maxPrice != null) return `Max PKR ${this.fmt(maxPrice)}`;
    return `Min PKR ${this.fmt(minPrice!)}`;
  });

  private fmt(n: number): string {
    return n.toLocaleString('en-PK');
  }
}
