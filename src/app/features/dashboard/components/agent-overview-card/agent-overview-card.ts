import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SectionCardComponent } from '../../../../shared/ui/section-card/section-card';

export interface AgentOverviewMetric {
  title: string;
  value: number;
  hint: string;
  icon: string;
}

@Component({
  selector: 'app-agent-overview-card',
  standalone: true,
  imports: [SectionCardComponent, MatIconModule, RouterLink],
  templateUrl: './agent-overview-card.html',
  styleUrl: './agent-overview-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgentOverviewCardComponent {
  readonly total = input.required<number>();
  readonly active = input.required<number>();
  readonly inactive = input.required<number>();

  readonly metrics = computed<AgentOverviewMetric[]>(() => [
    {
      title: 'Total agents',
      value: this.total(),
      hint: 'Agents linked to your agency',
      icon: 'groups'
    },
    {
      title: 'Active agents',
      value: this.active(),
      hint: 'Currently active on the platform',
      icon: 'person_check'
    },
    {
      title: 'Inactive agents',
      value: this.inactive(),
      hint: 'Pending or deactivated accounts',
      icon: 'person_off'
    }
  ]);
}
