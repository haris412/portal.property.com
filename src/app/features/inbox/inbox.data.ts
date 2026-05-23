export type InboxTab = 'all' | 'read' | 'unread';
export type MessageSender = 'other' | 'me';

export interface ConversationMessage {
  _id: string;
  sender: MessageSender;
  text: string;
  at: string;
}

export interface ConversationItem {
  _id: string;
  senderName: string;
  lastMessage?: ConversationMessage;
  avatar: string;
  roleLabel: string;
  title: string;
  propertyTitle: string;
  listTime: string;
  unread: boolean;
  messages: ConversationMessage[];
}
