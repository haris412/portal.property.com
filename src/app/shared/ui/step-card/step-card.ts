import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-step-card',
  templateUrl: './step-card.html',
  styleUrl: './step-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepCardComponent {
  readonly step = input.required<number>();
  readonly title = input.required<string>();
  readonly description = input<string>('');
}