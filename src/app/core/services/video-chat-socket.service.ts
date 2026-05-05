import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

type Json = Record<string, unknown>;

export type TimerSyncAction = 'request-sync' | 'sync-response' | 'start' | 'reset' | 'no-timer';

@Injectable({ providedIn: 'root' })
export class VideoChatSocketService {
  private socket: Socket | null = null;

  private readonly connected$ = new BehaviorSubject<boolean>(false);
  private readonly messageSubject = new Subject<unknown>();
  private readonly historySubject = new Subject<unknown>();
  private readonly errorSubject = new Subject<unknown>();
  private readonly timerSyncSubject = new Subject<unknown>();
  private readonly paymentCaptureFailedSubject = new Subject<unknown>();

  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }
  get message$(): Observable<unknown> {
    return this.messageSubject.asObservable();
  }
  get history$(): Observable<unknown> {
    return this.historySubject.asObservable();
  }
  get error$(): Observable<unknown> {
    return this.errorSubject.asObservable();
  }
  get timerSync$(): Observable<unknown> {
    return this.timerSyncSubject.asObservable();
  }
  get paymentCaptureFailed$(): Observable<unknown> {
    return this.paymentCaptureFailedSubject.asObservable();
  }

  /** Connects to Socket.IO namespace `/video-chat` on the same host as `environment.apiUrl`. */
  connect(token?: string | null): void {
    if (this.socket) return;

    const base = (environment.apiUrl ?? '').replace(/\/+$/, '');
    const url = `${base || 'http://localhost:3000'}/video-chat`;

    const trimmed = token?.trim();
    this.socket = io(url, {
      transports: ['websocket'],
      ...(trimmed ? { auth: { token: trimmed } } : {}),
    });

    this.socket.on('connect', () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));

    this.socket.on('video-chat-message', (p: unknown) => this.messageSubject.next(p));
    this.socket.on('video-chat-history', (p: unknown) => this.historySubject.next(p));
    this.socket.on('video-chat-error', (p: unknown) => this.errorSubject.next(p));
    this.socket.on('timer-sync', (p: unknown) => this.timerSyncSubject.next(p));
    this.socket.on('payment-capture-failed', (p: unknown) =>
      this.paymentCaptureFailedSubject.next(p)
    );
  }

  joinRoom(roomName: string): void {
    this.requireSocket().emit('join-video-chat-room', { roomName });
  }

  sendMessage(roomName: string, message: string): void {
    this.requireSocket().emit('send-video-chat-message', { roomName, message });
  }

  /**
   * Timer sync behavior (same action names as reference).
   * - request-sync: client asks server for current timer state
   * - sync-response: client responds with current timer state
   * - start/reset/no-timer: control actions
   */
  timerSync(roomName: string, action: TimerSyncAction, data: Json = {}): void {
    this.requireSocket().emit('timer-sync', {
      roomName,
      action,
      ...data
    });
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.connected$.next(false);
  }

  private requireSocket(): Socket {
    if (!this.socket) throw new Error('Video chat socket not connected. Call connect() first.');
    return this.socket;
  }
}

