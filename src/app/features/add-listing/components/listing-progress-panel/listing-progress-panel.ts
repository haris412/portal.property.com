import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { WizardStepperItem } from '../../../../shared/ui/wizard-stepper/wizard-stepper';

export type ListingStepReadiness = 'complete' | 'attention';

export interface ListingProgressStep extends WizardStepperItem {
  readiness: ListingStepReadiness;
  readinessLabel: string;
}

@Component({
  selector: 'app-listing-progress-panel',
  imports: [MatIconModule],
  templateUrl: './listing-progress-panel.html',
  styleUrl: './listing-progress-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListingProgressPanelComponent {
  readonly steps = input.required<readonly ListingProgressStep[]>();

  readonly progressPercent = input.required<number>();
  readonly progressDegrees = input.required<string>();
  readonly activeStepCountLabel = input.required<string>();
  readonly completedStepCount = input.required<number>();

  readonly trayOpen = input.required<boolean>();

  readonly toggleTray = output<void>();
  readonly closeTray = output<void>();
}
