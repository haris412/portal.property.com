export interface VideoCallChatMessage {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  readonly timeLabel: string;
  readonly own: boolean;
}
