import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InboxConversations } from '../../components/inbox-conversations/inbox-conversations';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [InboxConversations],
  templateUrl: './inbox-page.html',
  styleUrl: './inbox-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InboxPage {}