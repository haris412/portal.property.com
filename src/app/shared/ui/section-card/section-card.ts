import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-section-card',
  imports: [MatIconModule],
  templateUrl: './section-card.html',
  styleUrl: './section-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  readonly icon = input<string>('');
  readonly variant = input<'default' | 'dashboard'>('default');
  readonly headerLayout = input<'stacked' | 'split'>('stacked');
  readonly fullHeight = input<boolean>(false);

  readonly classes = computed(() => ({
    'section-card--compact': this.density() === 'compact',
    'section-card--dashboard': this.variant() === 'dashboard',
    'section-card--split-header': this.headerLayout() === 'split',
    'section-card--with-icon': !!this.icon(),
    'section-card--full-height': this.fullHeight()
  }));
}
