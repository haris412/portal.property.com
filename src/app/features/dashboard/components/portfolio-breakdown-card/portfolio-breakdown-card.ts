import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { MetricTileComponent } from '../../../../shared/ui/metric-tile/metric-tile';
import { PortfolioMetric } from '../../dashboard.mock';

@Component({
  selector: 'app-portfolio-breakdown-card',
  standalone: true,
  imports: [SectionCardComponent, MetricTileComponent],
  templateUrl: './portfolio-breakdown-card.html',
  styleUrl: './portfolio-breakdown-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioBreakdownCardComponent {
  title = 'My Property Portfolio';
  description = '';
  readonly activePortfolio = input.required<number>();
  readonly monthlyHint = input.required<string>();
  readonly saleShare = input.required<number>();
  readonly rentShare = input.required<number>();
  readonly footerText = input.required<string>();
  readonly metrics = input.required<PortfolioMetric[]>();
}