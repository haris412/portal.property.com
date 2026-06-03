import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { VideoCallChatMessage } from '../../models/video-call-chat-message';

@Component({
  selector: 'app-video-call-chat-panel',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './video-call-chat-panel.component.html',
  styleUrl: './video-call-chat-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCallChatPanelComponent {
  @Input() open = false;
  @Input() connected = false;
  @Input() messages: readonly VideoCallChatMessage[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() messageSend = new EventEmitter<string>();

  draft = '';

  send(): void {
    const message = this.draft.trim();
    if (!message) return;
    this.draft = '';
    this.messageSend.emit(message);
  }
}
