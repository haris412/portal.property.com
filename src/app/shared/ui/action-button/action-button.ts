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
  readonly size = input<'default' | 'compact'>('default');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input<boolean>(false);
  readonly clicked = output<void>();

  readonly classes = computed(() => ({
    'action-button--ghost': this.variant() === 'ghost',
    'action-button--compact': this.size() === 'compact'
  }));
}