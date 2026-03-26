import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { LocationDemand } from '../../dashboard.mock';

@Component({
  selector: 'app-locations-demand-card',
  standalone: true,
  imports: [SectionCardComponent],
  templateUrl: './locations-demand-card.html',
  styleUrl: './locations-demand-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationsDemandCardComponent {
  readonly locations = input.required<LocationDemand[]>();
}