import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';

@Component({
  selector: 'app-listing-help-card',
  imports: [MatIconModule, SectionCardComponent],
  templateUrl: './listing-help-card.html',
  styleUrl: './listing-help-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListingHelpCardComponent {
  readonly title = input<string>('Need help?');
  readonly description = input<string>(
    'Use AI tools to generate titles, descriptions, and cleaner listing copy faster.'
  );
  readonly actionLabel = input<string>('Explore AI Tools');
  readonly actionIcon = input<string>('auto_awesome');

  readonly actionClicked = output<void>();
}

