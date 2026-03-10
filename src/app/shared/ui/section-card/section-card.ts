import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-card',
  templateUrl: './section-card.html',
  styleUrl: './section-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectionCardComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}