import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { SegmentedTabsComponent } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import {
  ConversationItem,
  ConversationMessage,
  InboxTab
} from '../../inbox.data';
import { ConversationService } from '../../services/conversations.service';
import { SmartTimePipe } from '../../../../shared/pipes/smart-time.pipe';
import { map } from 'rxjs';
import { MessagingService } from '../../services/messaging.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Message } from '../../models/message.model';

interface SegmentedTabItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-inbox-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentedTabsComponent, SmartTimePipe],
  templateUrl: './inbox-conversations.html',
  styleUrl: './inbox-conversations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InboxConversations implements AfterViewChecked, OnInit {
  private readonly conversationService = inject(ConversationService);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  private readonly messageService = inject(MessagingService);
  private readonly auth = inject(AuthService);
  readonly currentUserId = this.auth.getUserId();
  readonly replyText = signal('');
  readonly activeTab = signal<InboxTab>('all');
  readonly selectedConversationId = signal<string>('6a0636060f202b0cc50bef03');

  readonly conversations = signal<ConversationItem[]>([]);
  readonly messages = signal<any[]>([]);

  readonly tabs = computed<SegmentedTabItem[]>(() => {
    const items = this.conversations();
    const unreadCount = items.filter((item) => item.unread).length;
    const readCount = items.filter((item) => !item.unread).length;

    return [
      { key: 'all', label: `All (${items.length})` },
      { key: 'read', label: `Read (${readCount})` },
      { key: 'unread', label: `Unread (${unreadCount})` },
    ];
  });

  readonly filteredConversations = computed(() => {
    const active = this.activeTab();
    const items = this.conversations();
    console.log('Filtering conversations for tab:', active, 'Total items:', items);
    // if (active === 'read') {
    //   return items.filter(item => !item.unread);
    // }

    if (active === 'unread') {
      return items.filter((item) => item.unread);
    }

    return items;
  });

  readonly selectedConversation = computed(() => {
    const filtered = this.filteredConversations();
    const selectedId = this.selectedConversationId();

    return filtered.find((item) => item._id === selectedId) ?? filtered[0] ?? null;
  });

  private shouldScrollToBottom = false;

  ngOnInit(): void {
    this.loadConversations();
    const token = this.auth.getAccessToken();
    this.messageService.connect(token ?? '');

    // this.messageService.onError()
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(err => console.error('[Socket]', err));

    // this.messageService.onNewMessage()
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(msg => {
    //     if (msg.conversationId !== this.selectedConversationId()) return;
    //     this.messages.update(msgs => {
    //       // replace optimistic temp bubble if text matches, otherwise append
    //       const tempIdx = msgs.findIndex(m => m._id?.startsWith('temp_') && m.text === msg.text);
    //       if (tempIdx !== -1) {
    //         const updated = [...msgs];
    //         updated[tempIdx] = msg;
    //         return updated;
    //       }
    //       return [...msgs, msg];
    //     });
    //     this.shouldScrollToBottom = true;
    //     this.cdr.markForCheck();
    //   });
  }

  loadMessages(id: string): void {
    this.conversationService
      .getMessages(id)
      .pipe(map((res) => res?.data?.messages ?? []))
      .subscribe({
        next: (msgs) => {
          this.messages.set(msgs);
          this.shouldScrollToBottom = true;
        },
        error: (err) => console.error('Failed to load messages:', err),
      });
  }

  loadConversations(): void {
    this.conversationService
      .getConversations()
      .pipe(map((res) => res?.data?.conversations ?? []))
      .subscribe({
        next: (conversations) => {
          this.conversations.set(conversations);
        },
        error: (err) => console.error('Failed to load conversations:', err),
      });
  }

  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      const filtered = this.filteredConversations();
      const selectedId = this.selectedConversationId();

      if (!filtered.length) return;

      const stillExists = filtered.some((item) => item._id === selectedId);
      if (!stillExists) {
        this.selectedConversationId.set(filtered[0]._id);
      }
    });

    // effect(() => {
    //   const id = this.selectedConversationId();
    //   if (!id) return;
    //   this.loadMessages(id);
    // });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.messagesContainer?.nativeElement) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
      this.shouldScrollToBottom = false;
    }
  }

  onTabChanged(tab: string): void {
    this.activeTab.set(tab as InboxTab);
  }

  selectConversation(id: string): void {
    this.selectedConversationId.set(id);
    this.markConversationAsRead(id);
    this.messageService.joinConversation(id);
    this.shouldScrollToBottom = true;
    //   this.auth.currentUser$.subscribe(user => {
    //   if (user) {
    //     // getToken() reads it from localStorage or memory
    //     const token = this.auth.getAccessToken();
    //     this.messageService.connect(token ?? ''); // ← passed here
    //   }
    // });
  }

  // chat-window.component.ts
  send(): void {
    const text = this.replyText().trim();
    if (!text) return; // don't send empty messages

    // Step 1 — show message instantly (optimistic UI)
    const optimistic: Message = {
      _id: 'temp_' + Date.now(),
      conversationId: this.selectedConversation()?._id,
      senderId: this.auth.getUserId() ?? 'me',
      text,
      updatedAt: new Date(),
      readBy: [this.auth.getUserId() ?? 'me'],
      createdAt: new Date(),
      status: 'sending', // grey tick
    };
    this.messages.update((msgs) => [...msgs, optimistic]);

    // Step 2 — send via socket

    this.messageService.sendMessage(this.selectedConversation()?._id, text);

    // Step 3 — clear input
    this.replyText.set('');
    this.cdr.markForCheck();
  }
 
  onReplyKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  getPreview(item: ConversationItem): string {
    return item.lastMessage?.text ?? '';
  }

  trackByConversation(_: number, item: ConversationItem): string {
    return item._id;
  }

  trackByMessage(_: number, item: ConversationMessage): string {
    return item._id;
  }

  private markConversationAsRead(id: string): void {
    this.conversations.update((items) =>
      items.map((item) =>
        item._id === id
          ? {
              ...item,
              unread: false,
            }
          : item,
      ),
    );
  }
}