import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { PortfolioMetric } from '../../dashboard.mock';

@Component({
  selector: 'app-portfolio-breakdown-card',
  standalone: true,
  imports: [SectionCardComponent, MatIconModule],
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
