import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SegmentedTabsComponent } from '../../../../shared/ui/segmented-tabs/segmented-tabs.component';
import {
  ConversationItem,
  ConversationMessage,
  INBOX_CONVERSATIONS,
  InboxTab
} from '../../inbox.data';
import { ConversationService } from '../../conversations.service';

interface SegmentedTabItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-inbox-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, SegmentedTabsComponent],
  templateUrl: './inbox-conversations.html',
  styleUrl: './inbox-conversations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InboxConversations implements AfterViewChecked, OnInit {
  private readonly conversationService = inject(ConversationService);
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  readonly replyText = signal('');
  readonly activeTab = signal<InboxTab>('all');
  readonly selectedConversationId = signal<string>('emma');

  readonly conversations = signal<ConversationItem[]>(structuredClone(INBOX_CONVERSATIONS));

  readonly tabs = computed<SegmentedTabItem[]>(() => {
    const items = this.conversations();
    const unreadCount = items.filter(item => item.unread).length;
    const readCount = items.filter(item => !item.unread).length;

    return [
      { key: 'all', label: `All (${items.length})` },
      { key: 'read', label: `Read (${readCount})` },
      { key: 'unread', label: `Unread (${unreadCount})` }
    ];
  });

  readonly filteredConversations = computed(() => {
    const active = this.activeTab();
    const items = this.conversations();

    if (active === 'read') {
      return items.filter(item => !item.unread);
    }

    if (active === 'unread') {
      return items.filter(item => item.unread);
    }

    return items;
  });

  readonly selectedConversation = computed(() => {
    const filtered = this.filteredConversations();
    const selectedId = this.selectedConversationId();

    return filtered.find(item => item.id === selectedId) ?? filtered[0] ?? null;
  });

  private shouldScrollToBottom = false;

  ngOnInit(): void {
    this.loadConversations();
  }

  loadConversations(): void {
    this.conversationService.getConversations().subscribe({
      next: (data) => console.log('Conversations:', data),
      error: (err) => console.error('Failed to load conversations:', err),
    });
  }

  constructor() {
    effect(() => {
      const filtered = this.filteredConversations();
      const selectedId = this.selectedConversationId();

      if (!filtered.length) {
        return;
      }

      const stillExists = filtered.some(item => item.id === selectedId);

      if (!stillExists) {
        this.selectedConversationId.set(filtered[0].id);
      }
    });
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
    this.shouldScrollToBottom = true;
  }

  sendMessage(): void {
    const text = this.replyText().trim();
    const activeConversation = this.selectedConversation();

    if (!text || !activeConversation) {
      return;
    }

    const nextMessage: ConversationMessage = {
      id: this.generateId(),
      sender: 'me',
      text,
      time: this.getCurrentTime()
    };

    this.conversations.update(items =>
      items.map(item =>
        item.id === activeConversation.id
          ? {
              ...item,
              unread: false,
              listTime: 'Just now',
              messages: [...item.messages, nextMessage]
            }
          : item
      )
    );

    this.replyText.set('');
    this.shouldScrollToBottom = true;
  }

  onReplyKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getPreview(item: ConversationItem): string {
    const lastMessage = item.messages[item.messages.length - 1];
    return lastMessage?.text ?? '';
  }

  trackByConversation(_: number, item: ConversationItem): string {
    return item.id;
  }

  trackByMessage(_: number, item: ConversationMessage): string {
    return item.id;
  }

  private markConversationAsRead(id: string): void {
    this.conversations.update(items =>
      items.map(item =>
        item.id === id
          ? {
              ...item,
              unread: false
            }
          : item
      )
    );
  }

  private getCurrentTime(): string {
    return new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}