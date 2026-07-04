import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { PlanFeature } from '../../dashboard.mock';

@Component({
  selector: 'app-plan-summary-card',
  standalone: true,
  imports: [SectionCardComponent, MatIconModule],
  templateUrl: './plan-summary-card.html',
  styleUrl: './plan-summary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanSummaryCardComponent {
  readonly name = input.required<string>();
  readonly price = input.required<string>();
  readonly renewalText = input.required<string>();
  readonly status = input.required<string>();
  readonly listingLimit = input.required<number | null>();
  readonly used = input.required<number>();
  readonly usagePercentage = input.required<number>();
  readonly features = input.required<PlanFeature[]>();

  readonly listingLimitLabel = computed(() => {
    const limit = this.listingLimit();
    return limit === null ? 'unlimited' : String(limit);
  });

  readonly usagePercent = computed(() =>
    Math.min(Math.max(Math.round(this.usagePercentage()), 0), 100)
  );

  readonly description = computed(() => `${this.price()} - ${this.renewalText()}`);

  featureIcon(label: string): string {
    const normalized = label.toLowerCase();
    if (normalized.includes('limit')) return 'query_stats';
    if (normalized.includes('featured')) return 'workspace_premium';
    if (normalized.includes('boost')) return 'rocket_launch';
    if (normalized.includes('visibility')) return 'groups';
    if (normalized.includes('credit')) return 'near_me';
    return 'check_circle';
  }
}
