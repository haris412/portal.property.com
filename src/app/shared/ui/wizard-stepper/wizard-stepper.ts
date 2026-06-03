import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type WizardStepState = 'pending' | 'active' | 'completed' | 'disabled';

export interface WizardStepperItem {
  key: string;
  label: string;
  description?: string;
  state?: WizardStepState;
  disabled?: boolean;
}

@Component({
  selector: 'app-wizard-stepper',
  imports: [MatIconModule],
  templateUrl: './wizard-stepper.html',
  styleUrl: './wizard-stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WizardStepperComponent {
  readonly steps = input.required<readonly WizardStepperItem[]>();
  readonly activeKey = input.required<string>();
  readonly ariaLabel = input<string>('Progress steps');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  readonly stepSelected = output<string>();

  readonly totalSteps = computed(() => this.steps().length);
  readonly classes = computed(() => ({
    'wizard-stepper--vertical': this.orientation() === 'vertical'
  }));

  stateFor(step: WizardStepperItem): WizardStepState {
    if (step.disabled || step.state === 'disabled') {
      return 'disabled';
    }
    if (step.key === this.activeKey()) {
      return 'active';
    }
    return step.state ?? 'pending';
  }

  isActive(step: WizardStepperItem): boolean {
    return this.stateFor(step) === 'active';
  }

  isCompleted(step: WizardStepperItem): boolean {
    return this.stateFor(step) === 'completed';
  }

  isDisabled(step: WizardStepperItem): boolean {
    return this.stateFor(step) === 'disabled';
  }

  descriptionId(index: number): string {
    return `wizard-stepper-step-${index + 1}-description`;
  }

  selectStep(step: WizardStepperItem): void {
    if (this.isDisabled(step)) {
      return;
    }
    this.stepSelected.emit(step.key);
  }
}
