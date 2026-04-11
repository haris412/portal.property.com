import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-section-card',
  templateUrl: './section-card.html',
  styleUrl: './section-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly density = input<'comfortable' | 'compact'>('comfortable');

  readonly classes = computed(() => ({
    'section-card--compact': this.density() === 'compact'
  }));
}