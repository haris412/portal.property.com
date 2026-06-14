// src/app/chat/models/message.model.ts

export interface Message {
  _id:            string;
  conversationId: string;
  senderId:       string;
  text:           string;
  readBy:         string[];
  createdAt:      Date;
  updatedAt:      Date;
  status?:        'sending' | 'sent' | 'seen'; // frontend only
}

export interface SendMessageDto {
  conversationId: string;
  text:           string;
}

export interface MessagePage {
  messages: Message[];
  hasMore:  boolean;
}