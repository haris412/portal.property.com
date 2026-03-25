import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button';
import { PlanFeature } from '../../dashboard.mock';

@Component({
  selector: 'app-plan-summary-card',
  standalone: true,
  imports: [SectionCardComponent, ActionButtonComponent],
  templateUrl: './plan-summary-card.html',
  styleUrl: './plan-summary-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanSummaryCardComponent {
  readonly name = input.required<string>();
  readonly price = input.required<string>();
  readonly renewalText = input.required<string>();
  readonly status = input.required<string>();
  readonly listingLimit = input.required<number>();
  readonly used = input.required<number>();
  readonly features = input.required<PlanFeature[]>();

  readonly usagePercent = computed(() => Math.min(Math.round((this.used() / this.listingLimit()) * 100), 100));
  readonly description = computed(() => `${this.price()} · ${this.renewalText()}`);
}