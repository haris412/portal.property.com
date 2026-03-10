import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-counter-field',
  imports: [MatIconModule],
  templateUrl: './counter-field.html',
  styleUrl: './counter-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CounterFieldComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly decremented = output<void>();
  readonly incremented = output<void>();
}