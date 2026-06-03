import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type VideoCallControlButtonVariant = 'default' | 'danger' | 'primary';

@Component({
  selector: 'app-video-call-control-button',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './video-call-control-button.component.html',
  styleUrl: './video-call-control-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCallControlButtonComponent {
  @Input({ required: true }) icon = '';
  @Input({ required: true }) label = '';
  @Input() variant: VideoCallControlButtonVariant = 'default';
  @Input() active = false;
  @Input() pressed: boolean | null = null;
  @Input() expanded: boolean | null = null;
  @Input() ariaControls: string | null = null;
  @Input() ariaLabel: string | null = null;

  @Output() controlClick = new EventEmitter<void>();
}
