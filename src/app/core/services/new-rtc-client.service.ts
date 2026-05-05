import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { Device, types as mediasoupTypes } from 'mediasoup-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

type Json = Record<string, unknown>;

type CreateTransportDirection = 'send' | 'recv';

interface RoomJoinedPayload {
  routerRtpCapabilities?: mediasoupTypes.RtpCapabilities;
}

interface NewProducerPayload {
  producerUserId: string;
  producerId: string;
  kind: mediasoupTypes.MediaKind;
}

@Injectable({ providedIn: 'root' })
export class NewRtcClientService {
  private socket: Socket | null = null;
  private device: Device | null = null;
  private sendTransport: mediasoupTypes.Transport | null = null;
  private recvTransport: mediasoupTypes.Transport | null = null;

  private localStream: MediaStream | null = null;

  private readonly connected$ = new BehaviorSubject<boolean>(false);
  private readonly localStream$ = new BehaviorSubject<MediaStream | null>(null);

  private readonly roomJoinedSubject = new Subject<RoomJoinedPayload>();
  private readonly roomJoinErrorSubject = new Subject<unknown>();
  private readonly sessionExpiredSubject = new Subject<void>();
  private readonly userJoinedSubject = new Subject<unknown>();
  private readonly userLeftSubject = new Subject<unknown>();
  private readonly userReconnectedSubject = new Subject<unknown>();
  private readonly newProducerSubject = new Subject<NewProducerPayload>();

  /** Emits `true` after socket connects. */
  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /** Emits current local stream (or null). */
  get localMedia$(): Observable<MediaStream | null> {
    return this.localStream$.asObservable();
  }

  /** Socket event streams. */
  get roomJoined$(): Observable<RoomJoinedPayload> {
    return this.roomJoinedSubject.asObservable();
  }
  get roomJoinError$(): Observable<unknown> {
    return this.roomJoinErrorSubject.asObservable();
  }
  get sessionExpired$(): Observable<void> {
    return this.sessionExpiredSubject.asObservable();
  }
  get userJoinedRoom$(): Observable<unknown> {
    return this.userJoinedSubject.asObservable();
  }
  get userLeftRoom$(): Observable<unknown> {
    return this.userLeftSubject.asObservable();
  }
  get userReconnected$(): Observable<unknown> {
    return this.userReconnectedSubject.asObservable();
  }
  get newProducer$(): Observable<NewProducerPayload> {
    return this.newProducerSubject.asObservable();
  }

  connect(token?: string): void {
    if (this.socket) return;

    // `environment.newRtcUrl` is equivalent to REACT_APP_NEWRTC_URL.
    this.socket = io(environment.newRtcUrl || 'http://localhost:8000', {
      transports: ['websocket'],
      auth: token ? { token } : undefined
    });

    this.socket.on('connect', () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));

    // Required listeners (names must match backend).
    this.socket.on('room-joined', (payload: RoomJoinedPayload) => {
      this.roomJoinedSubject.next(payload);
    });
    this.socket.on('user-joined-room', (payload: unknown) => {
      this.userJoinedSubject.next(payload);
    });
    this.socket.on('user-left-room', (payload: unknown) => {
      this.userLeftSubject.next(payload);
    });
    this.socket.on('user-reconnected', (payload: unknown) => {
      this.userReconnectedSubject.next(payload);
    });
    this.socket.on('new-producer', (payload: NewProducerPayload) => {
      this.newProducerSubject.next(payload);
    });
    this.socket.on('room-join-error', (payload: unknown) => {
      this.roomJoinErrorSubject.next(payload);
    });
    this.socket.on('session-expired', () => {
      this.sessionExpiredSubject.next();
    });
  }

  async joinRoom(roomName: string): Promise<void> {
    const socket = this.requireSocket();

    // Emit join request first; server will answer via `room-joined`.
    socket.emit('join-video-room', { roomName });

    const joined = await this.waitForRoomJoinedOnce();
    const routerCaps = joined.routerRtpCapabilities;
    if (!routerCaps) {
      throw new Error('room-joined payload missing routerRtpCapabilities');
    }

    this.device = new Device();
    await this.device.load({ routerRtpCapabilities: routerCaps });

    // Create transports after device is loaded.
    this.sendTransport = await this.createTransport('send');
    this.recvTransport = await this.createTransport('recv');
  }

  leaveRoom(): void {
    const socket = this.socket;
    if (socket) {
      socket.emit('leave-video-room');
    }
    this.closeTransports();
  }

  async startLocalMedia(
    constraints: MediaStreamConstraints = { audio: true, video: true }
  ): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream = stream;
    this.localStream$.next(stream);
    return stream;
  }

  async createProducer(track: MediaStreamTrack): Promise<mediasoupTypes.Producer> {
    const socket = this.requireSocket();
    const transport = this.requireSendTransport();

    const producer = await transport.produce({ track });

    // Inform server about the new producer (ack).
    await this.emitAck('create-producer', {
      transportId: transport.id,
      kind: producer.kind,
      rtpParameters: producer.rtpParameters,
      appData: producer.appData ?? {}
    });

    producer.on('transportclose', () => {
      try {
        producer.close();
      } catch {
        // ignore
      }
    });

    // Common: if server needs explicit close, you can add it later.
    // producer.on('close', ...)

    return producer;
  }

  async requestExistingProducers(): Promise<unknown> {
    return await this.emitAck('request-existing-producers', {});
  }

  async createConsumer(
    producerUserId: string,
    producerId: string,
    kind: mediasoupTypes.MediaKind
  ): Promise<mediasoupTypes.Consumer> {
    const transport = this.requireRecvTransport();
    const device = this.requireDevice();

    const data = (await this.emitAck('create-consumer', {
      transportId: transport.id,
      producerUserId,
      producerId,
      rtpCapabilities: device.rtpCapabilities,
      kind
    })) as Json;

    const id = String(data['id'] ?? '');
    const consumerProducerId = String(data['producerId'] ?? producerId);
    const rtpParameters = data['rtpParameters'] as mediasoupTypes.RtpParameters | undefined;
    const consumerKind = (data['kind'] as mediasoupTypes.MediaKind | undefined) ?? kind;

    if (!id || !rtpParameters) {
      throw new Error('create-consumer ack missing required fields');
    }

    const consumer = await transport.consume({
      id,
      producerId: consumerProducerId,
      kind: consumerKind,
      rtpParameters
    });

    await this.emitAck('resume-consumer', { consumerId: consumer.id });

    consumer.on('transportclose', () => {
      try {
        consumer.close();
      } catch {
        // ignore
      }
    });

    return consumer;
  }

  disconnect(): void {
    this.cleanup();
  }

  cleanup(): void {
    this.leaveRoom();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.device = null;

    if (this.localStream) {
      for (const t of this.localStream.getTracks()) {
        try {
          t.stop();
        } catch {
          // ignore
        }
      }
      this.localStream = null;
      this.localStream$.next(null);
    }

    this.connected$.next(false);
  }

  // ---------- internals ----------

  private closeTransports(): void {
    try {
      this.sendTransport?.close();
    } catch {
      // ignore
    }
    try {
      this.recvTransport?.close();
    } catch {
      // ignore
    }
    this.sendTransport = null;
    this.recvTransport = null;
  }

  private requireSocket(): Socket {
    if (!this.socket) throw new Error('Socket not connected. Call connect() first.');
    return this.socket;
  }

  private requireDevice(): Device {
    if (!this.device) throw new Error('Device not ready. Call joinRoom() first.');
    return this.device;
  }

  private requireSendTransport(): mediasoupTypes.Transport {
    if (!this.sendTransport) throw new Error('Send transport not ready. Call joinRoom() first.');
    return this.sendTransport;
  }

  private requireRecvTransport(): mediasoupTypes.Transport {
    if (!this.recvTransport) throw new Error('Recv transport not ready. Call joinRoom() first.');
    return this.recvTransport;
  }

  private async waitForRoomJoinedOnce(): Promise<RoomJoinedPayload> {
    return await new Promise<RoomJoinedPayload>((resolve, reject) => {
      const ok = (p: RoomJoinedPayload) => {
        cleanup();
        resolve(p);
      };
      const err = (e: unknown) => {
        cleanup();
        reject(e);
      };
      const cleanup = () => {
        const socket = this.socket;
        if (!socket) return;
        socket.off('room-joined', ok);
        socket.off('room-join-error', err);
      };

      // Use socket `once` so we don't rely on Subject subscription internals.
      const socket = this.requireSocket();
      socket.once('room-joined', ok);
      socket.once('room-join-error', err);
    });
  }

  private async createTransport(
    direction: CreateTransportDirection
  ): Promise<mediasoupTypes.Transport> {
    const socket = this.requireSocket();
    const device = this.requireDevice();

    const params = (await this.emitAck('create-transport', { direction })) as Json;
    const transportOptions = params['transportOptions'] as Json | undefined;
    const options = (transportOptions ?? params) as unknown as mediasoupTypes.TransportOptions;

    const transport =
      direction === 'send'
        ? device.createSendTransport(options)
        : device.createRecvTransport(options);

    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.emitAck('connect-transport', {
        transportId: transport.id,
        dtlsParameters
      })
        .then(() => callback())
        .catch((e) => errback(e));
    });

    if (direction === 'send') {
      transport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
        this.emitAck('create-producer', {
          transportId: transport.id,
          kind,
          rtpParameters,
          appData: appData ?? {}
        })
          .then((res) => {
            const r = res as Json;
            const id = String(r['id'] ?? r['producerId'] ?? '');
            callback({ id });
          })
          .catch((e) => errback(e));
      });
    }

    return transport;
  }

  private emitAck(event: string, payload: Json): Promise<unknown> {
    const socket = this.requireSocket();
    return new Promise((resolve, reject) => {
      socket.emit(event, payload, (response: unknown) => {
        // Convention: backend may return { error } or { success:false }.
        if (response && typeof response === 'object') {
          const r = response as Record<string, unknown>;
          if (r['error']) return reject(r['error']);
          if (r['success'] === false) return reject(r);
        }
        resolve(response);
      });
    });
  }
}

