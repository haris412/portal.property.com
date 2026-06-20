// src/app/chat/services/messaging.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

import { socketIoBaseOptions } from '../../../core/http/socket-io-url';
import { environment } from '../../../../environments/environment';
import { CreateConversationDto } from '../models/createConversation.model';
import { Message } from '../models/message.model';
import { Conversation } from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class MessagingService implements OnDestroy {

  // ─── Socket instance ──────────────────────────────────────────────
  private socket!: Socket;

  // ─── Observable streams — components subscribe to these ──────────
  private newMessage$    = new Subject<Message>();
  private typingEvent$   = new Subject<{ userId: string; conversationId: string; isTyping: boolean }>();
  private readEvent$     = new Subject<{ userId: string; conversationId: string }>();
  private userOffline$   = new Subject<{ userId: string }>();
  private socketError$   = new Subject<string>();

  // ─── Connection state — show banner in UI when disconnected ──────
  connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // ─── Total unread count — for nav bar badge ───────────────────────
  totalUnread$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────────────────────────────
  // SOCKET METHODS
  // ──────────────────────────────────────────────────────────────────

  // Call once when user logs in
  connect(token: string): void {
    // Don't create duplicate connections
    if (this.socket?.connected) return;

    const { url, options } = socketIoBaseOptions(environment.wsUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    this.socket = io(url, options);

    // ─── Connection lifecycle events ────────────────────────────────
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connectionStatus$.next('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectionStatus$.next('disconnected');
    });

    this.socket.on('reconnecting', () => {
      this.connectionStatus$.next('reconnecting');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      this.connectionStatus$.next('disconnected');
    });

    // ─── Incoming real time events ──────────────────────────────────
    this.socket.on('new_message', (message: Message) => {
      console.log('Received new message:', message);
      this.newMessage$.next(message);
    });

    this.socket.on('user_typing', (event: any) => {
      this.typingEvent$.next(event);
    });

    this.socket.on('messages_read', (event: any) => {
      this.readEvent$.next(event);
    });

    this.socket.on('user_offline', (event: any) => {
      this.userOffline$.next(event);
    });

    this.socket.on('error', (err: any) => {
      const msg = err?.message ?? 'Unknown socket error';
      console.error('Socket error:', msg);
      this.socketError$.next(msg);
    });

    // NestJS gateway throws — emits 'exception' instead of 'error'
    this.socket.on('exception', (err: any) => {
      const msg = err?.message ?? JSON.stringify(err);
      console.error('Socket exception:', msg);
      this.socketError$.next(msg);
    });
  }

  // Disconnect — call on logout
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.connectionStatus$.next('disconnected');
    }
  }

  // Join a conversation room — call when chat window opens
  joinConversation(conversationId: string): void {
    this.socket.emit('join_conversation', conversationId);
  }

  // Send a message — via socket, not REST
  sendMessage(conversationId: string, text: string): void {
    console.log('socket.emit send_message:', { conversationId, text });
    console.log('socket connected:', this.socket?.connected);
    console.log('socket id:', this.socket?.id);
    this.socket.emit('send_message', { conversationId, text });
  }

  // Emit typing status — debounced in the component before calling this
  sendTyping(conversationId: string, isTyping: boolean): void {
    this.socket.emit('typing', { conversationId, isTyping });
  }

  // Mark all messages in a conversation as read
  markRead(conversationId: string): void {
    this.socket.emit('mark_read', { conversationId });
  }

  // ─── Observables — components subscribe to these ─────────────────

  // New message received in any conversation
  onNewMessage(): Observable<Message> {
    return this.newMessage$.asObservable();
  }

  // Someone is typing in a conversation
  onTyping(): Observable<{ userId: string; conversationId: string; isTyping: boolean }> {
    return this.typingEvent$.asObservable();
  }

  // Someone read messages in a conversation
  onRead(): Observable<{ userId: string; conversationId: string }> {
    return this.readEvent$.asObservable();
  }

  // Someone went offline
  onUserOffline(): Observable<{ userId: string }> {
    return this.userOffline$.asObservable();
  }

  // Socket error or NestJS gateway exception
  onError(): Observable<string> {
    return this.socketError$.asObservable();
  }

  // ──────────────────────────────────────────────────────────────────
  // REST METHODS
  // ──────────────────────────────────────────────────────────────────

  // Start a new conversation — called once from property listing page
  startConversation(dto: CreateConversationDto): Observable<{
    conversation: Conversation;
    message: Message | null;
  }> {
    return this.http.post<{
      conversation: Conversation;
      message: Message | null;
    }>(`${environment.apiUrl}/conversations`, dto);
  }

  // Load all conversations for inbox
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      `${environment.apiUrl}/conversations`
    );
  }

  // Load message history for a conversation
  // before = last message _id for cursor pagination
  getMessages(
    conversationId: string,
    before?: string,
    limit: number = 30
  ): Observable<{ messages: Message[]; hasMore: boolean }> {
    let url = `${environment.apiUrl}/conversations/${conversationId}/messages?limit=${limit}`;
    if (before) url += `&before=${before}`;

    return this.http.get<{ messages: Message[]; hasMore: boolean }>(url);
  }

  // ──────────────────────────────────────────────────────────────────
  // CLEANUP
  // ──────────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.disconnect();
    this.newMessage$.complete();
    this.typingEvent$.complete();
    this.readEvent$.complete();
    this.userOffline$.complete();
    this.socketError$.complete();
    this.totalUnread$.complete();
    this.connectionStatus$.complete();
  }
}