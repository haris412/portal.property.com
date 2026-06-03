import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { VideoCallControlButtonComponent } from '../video-call-control-button/video-call-control-button.component';

@Component({
  selector: 'app-video-call-topbar',
  standalone: true,
  imports: [MatIconModule, VideoCallControlButtonComponent],
  templateUrl: './video-call-topbar.component.html',
  styleUrl: './video-call-topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCallTopbarComponent {
  @Input({ required: true }) callRoomLabel = '';
  @Input() remoteDisconnected = false;
  @Input() remoteHasVideo = false;
  @Input() isMuted = false;
  @Input() isVideoOff = false;
  @Input() chatOpen = false;

  @Output() muteToggle = new EventEmitter<void>();
  @Output() videoToggle = new EventEmitter<void>();
  @Output() endCall = new EventEmitter<void>();
  @Output() appointmentsBack = new EventEmitter<void>();
  @Output() chatToggle = new EventEmitter<void>();

  get participantStatus(): string {
    if (this.remoteDisconnected) return 'Participant left';
    return this.remoteHasVideo ? 'Connected' : 'Waiting to connect';
  }
}
