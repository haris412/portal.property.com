import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-info-banner',
  imports: [MatIconModule],
  templateUrl: './info-banner.html',
  styleUrl: './info-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoBannerComponent {
  readonly icon = input<string>('info');
  readonly text = input.required<string>();
}