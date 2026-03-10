import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { SelectableChipGridComponent } from '../../../../shared/ui/selectable-chip-grid/selectable-chip-grid';
import { SelectableChipItem } from '../../../../core/models/ui.models';

@Component({
  selector: 'app-features-amenities-section',
  imports: [SectionCardComponent, SelectableChipGridComponent],
  templateUrl: './features-amenities-section.html',
  styleUrl: './features-amenities-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturesAmenitiesSectionComponent {
  readonly amenities = signal<SelectableChipItem[]>([
    { id: 'wifi', label: 'Wi-Fi', selected: true },
    { id: 'pool', label: 'Swimming Pool', selected: true },
    { id: 'gym', label: 'Gym', selected: false },
    { id: 'garage', label: 'Garage', selected: true },
    { id: 'central-ac', label: 'Central AC', selected: true },
    { id: 'balcony', label: 'Balcony', selected: false },
    { id: 'security', label: 'Security', selected: false },
    { id: 'garden', label: 'Garden', selected: true },
    { id: 'elevator', label: 'Elevator', selected: false },
    { id: 'laundry', label: 'Laundry Room', selected: true },
    { id: 'furnished', label: 'Furnished', selected: false },
    { id: 'pet-friendly', label: 'Pet Friendly', selected: true }
  ]);

  toggleAmenity(id: string): void {
    this.amenities.update((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  }
}