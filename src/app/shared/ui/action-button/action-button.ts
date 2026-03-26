import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './action-button.html',
  styleUrl: './action-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionButtonComponent {
  readonly label = input.required<string>();
  readonly icon = input<string>('add');
  readonly variant = input<'filled' | 'ghost'>('filled');
  readonly type = input<'button' | 'submit'>('button');
  readonly clicked = output<void>();

  readonly classes = computed(() => ({
    'action-button--ghost': this.variant() === 'ghost'
  }));
}