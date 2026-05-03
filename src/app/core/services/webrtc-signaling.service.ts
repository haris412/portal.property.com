import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface RoomJoinedPayload {
  roomName: string;
  peerId: string;
  peers: Array<{ peerId: string }>;
}

export interface PeerJoinedPayload {
  peerId: string;
}

export interface PeerLeftPayload {
  peerId: string;
}

export interface OfferPayload {
  fromPeerId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  fromPeerId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  fromPeerId: string;
  candidate: RTCIceCandidateInit;
}

@Injectable({ providedIn: 'root' })
export class WebRtcSignalingService {
  private socket: Socket | null = null;
  private readonly connected$ = new BehaviorSubject<boolean>(false);

  private readonly roomJoinedSubject = new Subject<RoomJoinedPayload>();
  private readonly peerJoinedSubject = new Subject<PeerJoinedPayload>();
  private readonly peerLeftSubject = new Subject<PeerLeftPayload>();
  private readonly offerSubject = new Subject<OfferPayload>();
  private readonly answerSubject = new Subject<AnswerPayload>();
  private readonly iceSubject = new Subject<IceCandidatePayload>();
  private readonly errorSubject = new Subject<unknown>();
  private readonly sessionExpiredSubject = new Subject<void>();

  /**
   * Same host as REST `environment.apiUrl`, namespace `/webrtc`
   * (see LocateHome API README: `io(\`${API_BASE_URL}/webrtc\`, { ... })`).
   */
  private webrtcSocketUrl(): string {
    const base = (environment.apiUrl ?? '').replace(/\/+$/, '');
    return `${base || 'http://localhost:3000'}/webrtc`;
  }

  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }
  get roomJoined$(): Observable<RoomJoinedPayload> {
    return this.roomJoinedSubject.asObservable();
  }
  get peerJoined$(): Observable<PeerJoinedPayload> {
    return this.peerJoinedSubject.asObservable();
  }
  get peerLeft$(): Observable<PeerLeftPayload> {
    return this.peerLeftSubject.asObservable();
  }
  get offer$(): Observable<OfferPayload> {
    return this.offerSubject.asObservable();
  }
  get answer$(): Observable<AnswerPayload> {
    return this.answerSubject.asObservable();
  }
  get iceCandidate$(): Observable<IceCandidatePayload> {
    return this.iceSubject.asObservable();
  }
  get error$(): Observable<unknown> {
    return this.errorSubject.asObservable();
  }
  get sessionExpired$(): Observable<void> {
    return this.sessionExpiredSubject.asObservable();
  }

  connect(token?: string | null): void {
    if (this.socket) return;

    const url = this.webrtcSocketUrl();
    const trimmed = token?.trim();

    /**
     * Omit `auth` when there is no token. Some servers treat `auth: { token: '' }` as “verify
     * empty JWT” and respond with INVALID_TOKEN; anonymous joins need no auth object.
     */
    this.socket = io(url, {
      transports: ['websocket'],
      ...(trimmed ? { auth: { token: trimmed } } : {}),
    });

    this.socket.on('connect', () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));
    this.socket.on('connect_error', (err: unknown) => this.errorSubject.next(err));

    // Required signaling events.
    this.socket.on('room-joined', (p: RoomJoinedPayload) => this.roomJoinedSubject.next(p));
    this.socket.on('peer-joined', (p: PeerJoinedPayload) => this.peerJoinedSubject.next(p));
    this.socket.on('peer-left', (p: PeerLeftPayload) => this.peerLeftSubject.next(p));
    this.socket.on('offer', (p: OfferPayload) => this.offerSubject.next(p));
    this.socket.on('answer', (p: AnswerPayload) => this.answerSubject.next(p));
    this.socket.on('ice-candidate', (p: IceCandidatePayload) => this.iceSubject.next(p));

    // Common app-level events.
    this.socket.on('error', (p: unknown) => this.errorSubject.next(p));
    this.socket.on('session-expired', () => this.sessionExpiredSubject.next());
  }

  /**
   * Server expects `join-room` only after the socket is connected; emitting too early is ignored.
   */
  joinRoom(roomName: string): void {
    const socket = this.requireSocket();
    const emit = () => socket.emit('join-room', { roomName });
    if (socket.connected) emit();
    else socket.once('connect', emit);
  }

  leaveRoom(roomName: string): void {
    this.requireSocket().emit('leave-room', { roomName });
  }

  sendOffer(roomName: string, toPeerId: string, sdp: RTCSessionDescriptionInit): void {
    this.requireSocket().emit('offer', { roomName, toPeerId, sdp });
  }

  sendAnswer(roomName: string, toPeerId: string, sdp: RTCSessionDescriptionInit): void {
    this.requireSocket().emit('answer', { roomName, toPeerId, sdp });
  }

  sendIceCandidate(roomName: string, toPeerId: string, candidate: RTCIceCandidateInit): void {
    this.requireSocket().emit('ice-candidate', { roomName, toPeerId, candidate });
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.connected$.next(false);
  }

  private requireSocket(): Socket {
    if (!this.socket) throw new Error('Signaling socket not connected. Call connect() first.');
    return this.socket;
  }
}

