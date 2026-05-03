import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, take } from 'rxjs/operators';
import { WebRtcSignalingService } from '../../../../core/services/webrtc-signaling.service';
import { AuthService } from '../../../../core/services/auth.service';

const REMOTE_LEFT_STATUS = 'The other participant left the call';

@Component({
  selector: 'app-video-call',
  standalone: true,
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoCallComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly signaling = inject(WebRtcSignalingService);
  private readonly auth = inject(AuthService);

  @ViewChild('localVideo', { static: true })
  private localVideoRef!: ElementRef<HTMLVideoElement>;

  @ViewChild('remoteVideo', { static: true })
  private remoteVideoRef!: ElementRef<HTMLVideoElement>;

  private readonly subs = new Subscription();

  private roomName = '';
  private localStream: MediaStream | null = null;
  private readonly remoteStream: MediaStream = new MediaStream();

  private peerId: string | null = null;
  private readonly pcs = new Map<string, RTCPeerConnection>();
  /** One automatic retry after INVALID_TOKEN (refresh then reconnect). */
  private retriedAfterInvalidToken = false;
  /** `peer-joined` can arrive before `room-joined`; queue until we know our `peerId`. */
  private readonly pendingPeerJoinIds: string[] = [];
  /** User explicitly ended the call (skip duplicate teardown in destroy). */
  private userEndedCall = false;

  /** Shown in template */
  statusText: string | null = null;
  remoteHasVideo = false;
  /** True after remote peer left while we stayed on the page. */
  remoteDisconnected = false;
  /** Room id from route (for header). */
  callRoomLabel = '';

  /** Short-lived join / connection hints (both sides). Clears after a few seconds. */
  transientBanner: string | null = null;
  private transientBannerTimer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit(): Promise<void> {
    const roomName$ = this.route.paramMap.pipe(
      map((p) => p.get('roomName') ?? ''),
      filter(Boolean)
    );
    const token$ = this.route.queryParamMap.pipe(map((q) => q.get('token') ?? ''));

    const { roomName, token: queryTokenRaw } = await firstValueFrom(
      combineLatest([roomName$, token$]).pipe(
        take(1),
        map(([roomName, token]) => ({ roomName, token }))
      )
    );

    this.roomName = roomName;
    this.callRoomLabel = decodeURIComponent(roomName);

    /**
     * Prefer the in-memory access token from login (same JWT REST uses). A stale `?token=` in the
     * URL often overrides it and causes `INVALID_TOKEN` on `/webrtc` if that JWT was from another
     * environment or expired.
     */
    const queryToken = decodeQueryTokenParam(queryTokenRaw);
    const sessionToken = this.auth.getAccessToken()?.trim() ?? '';
    const accessToken = sessionToken || queryToken || undefined;

    this.signaling.connect(accessToken);

    this.subs.add(
      this.signaling.error$.subscribe((err) => {
        void this.handleSignalingError(err);
      })
    );

    // Start local media first.
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    this.attachLocal(this.localStream);

    // Wire signaling listeners (dedupe identical `room-joined` bursts from the server).
    this.subs.add(
      this.signaling.roomJoined$.pipe(
        distinctUntilChanged(
          (a, b) =>
            a.peerId === b.peerId &&
            JSON.stringify(a.peers ?? []) === JSON.stringify(b.peers ?? [])
        )
      ).subscribe((p) => {
        this.peerId = p.peerId;
        const hadBeenAloneAfterRemoteLeft = this.remoteDisconnected;
        const hasOtherInRoster = (p.peers ?? []).some((peer) => peer.peerId !== p.peerId);
        const hasPendingJoin = this.pendingPeerJoinIds.length > 0;
        if (hasOtherInRoster || hasPendingJoin) {
          this.clearRemoteAloneUiState();
        }
        this.flushPendingPeerJoins();
        for (const peer of p.peers || []) {
          if (peer.peerId === p.peerId) continue;
          void this.ensurePeerConnection(peer.peerId, this.shouldInitiateOffer(peer.peerId));
        }
        const othersInRoom = (p.peers ?? []).filter((peer) => peer.peerId !== p.peerId);
        if (othersInRoom.length > 0) {
          if (hadBeenAloneAfterRemoteLeft) {
            this.showTransient('A participant rejoined the call.');
          } else {
            this.showTransient('Another participant is already in this call.');
          }
        } else {
          this.showTransient('You joined the call. Waiting for others…');
        }
        this.cdr.markForCheck();
      })
    );
    this.subs.add(
      this.signaling.peerJoined$.subscribe((p) => {
        if (this.peerId && p.peerId === this.peerId) return;
        if (!this.peerId) {
          if (!this.pendingPeerJoinIds.includes(p.peerId)) {
            this.pendingPeerJoinIds.push(p.peerId);
          }
          return;
        }
        this.clearRemoteAloneUiState();
        this.showTransient('Another participant joined the call.');
        void this.ensurePeerConnection(p.peerId, this.shouldInitiateOffer(p.peerId));
      })
    );
    this.subs.add(
      this.signaling.peerLeft$.subscribe((p) => {
        this.clearTransientBanner();
        this.closePeer(p.peerId);
        if (!this.userEndedCall) {
          this.statusText = REMOTE_LEFT_STATUS;
        }
        if (this.pcs.size === 0) {
          this.clearRemoteStreamTracks();
          this.remoteHasVideo = false;
          if (!this.userEndedCall) {
            this.remoteDisconnected = true;
          }
        }
        this.syncRemotePreview();
        this.cdr.markForCheck();
      })
    );
    this.subs.add(
      this.signaling.offer$.subscribe((p) => {
        void this.onOffer(p.fromPeerId, p.sdp);
      })
    );
    this.subs.add(
      this.signaling.answer$.subscribe((p) => {
        void this.onAnswer(p.fromPeerId, p.sdp);
      })
    );
    this.subs.add(
      this.signaling.iceCandidate$.subscribe((p) => {
        void this.onIceCandidate(p.fromPeerId, p.candidate);
      })
    );

    // Join room via signaling server.
    this.signaling.joinRoom(this.roomName);

    this.attachRemote(this.remoteStream);
  }

  ngOnDestroy(): void {
    this.clearTransientBanner();
    this.subs.unsubscribe();
    this.teardownMediaAndConnections();
  }

  /**
   * Only the user who taps End call is sent to appointments. The other peer stays here and sees
   * `peer-left` / statusText (handled in `peerLeft$`).
   */
  endCall(): void {
    this.clearTransientBanner();
    this.userEndedCall = true;
    this.teardownMediaAndConnections();
    void this.router.navigate(['/appointments']);
  }

  /** Optional: leave to appointments after the other party ended (you stayed on the call). */
  goToAppointments(): void {
    this.clearTransientBanner();
    this.teardownMediaAndConnections();
    void this.router.navigate(['/appointments']);
  }

  private showTransient(message: string, durationMs = 5000): void {
    this.clearTransientBanner();
    this.transientBanner = message;
    this.transientBannerTimer = setTimeout(() => {
      this.transientBannerTimer = null;
      this.transientBanner = null;
      this.cdr.markForCheck();
    }, durationMs);
    this.cdr.markForCheck();
  }

  private clearTransientBanner(): void {
    if (this.transientBannerTimer != null) {
      clearTimeout(this.transientBannerTimer);
      this.transientBannerTimer = null;
    }
    this.transientBanner = null;
  }

  private async handleSignalingError(err: unknown): Promise<void> {
    const code =
      typeof err === 'object' && err != null && 'code' in err
        ? String((err as { code?: string }).code)
        : '';
    const message =
      typeof err === 'object' && err != null && 'message' in err
        ? String((err as { message?: string }).message)
        : '';
    const isInvalidToken =
      code === 'INVALID_TOKEN' || message.toLowerCase().includes('invalid token');
    if (!isInvalidToken || this.retriedAfterInvalidToken) return;
    this.retriedAfterInvalidToken = true;

    const fresh = await firstValueFrom(this.auth.refreshAccessToken());
    if (!fresh?.trim()) return;

    for (const id of Array.from(this.pcs.keys())) {
      this.closePeer(id);
    }
    this.clearRemoteStreamTracks();
    this.signaling.disconnect();
    this.signaling.connect(fresh.trim());
    this.signaling.joinRoom(this.roomName);
    this.attachRemote(this.remoteStream);
  }

  private teardownMediaAndConnections(): void {
    for (const peerId of Array.from(this.pcs.keys())) {
      this.closePeer(peerId);
    }
    this.clearRemoteStreamTracks();
    this.remoteHasVideo = false;

    if (this.localStream) {
      for (const t of this.localStream.getTracks()) {
        try {
          t.stop();
        } catch {
          // ignore
        }
      }
      this.localStream = null;
    }

    const lv = this.localVideoRef?.nativeElement;
    if (lv) lv.srcObject = null;
    const rv = this.remoteVideoRef?.nativeElement;
    if (rv) rv.srcObject = null;

    if (this.roomName) {
      try {
        this.signaling.leaveRoom(this.roomName);
      } catch {
        // ignore
      }
    }
    this.signaling.disconnect();
    this.cdr.markForCheck();
  }

  private clearRemoteStreamTracks(): void {
    for (const t of [...this.remoteStream.getTracks()]) {
      try {
        this.remoteStream.removeTrack(t);
      } catch {
        // ignore
      }
    }
  }

  /** After remote left, restores "End call" when someone is in the room again. */
  private clearRemoteAloneUiState(): void {
    if (!this.remoteDisconnected) return;
    this.remoteDisconnected = false;
    if (this.statusText === REMOTE_LEFT_STATUS) {
      this.statusText = null;
    }
    this.cdr.markForCheck();
  }

  private flushPendingPeerJoins(): void {
    if (!this.peerId) return;
    while (this.pendingPeerJoinIds.length) {
      const id = this.pendingPeerJoinIds.shift();
      if (!id || id === this.peerId) continue;
      void this.ensurePeerConnection(id, this.shouldInitiateOffer(id));
    }
  }

  /**
   * Exactly one side creates the offer so both do not send simultaneous offers (SDP glare).
   * Tie-break: lower `peerId` string is the "caller".
   */
  private shouldInitiateOffer(remotePeerId: string): boolean {
    const mine = this.peerId;
    if (!mine || !remotePeerId || mine === remotePeerId) return false;
    return mine < remotePeerId;
  }

  private syncRemotePreview(): void {
    this.remoteHasVideo = this.remoteStream.getVideoTracks().some((t) => t.readyState === 'live');
    const el = this.remoteVideoRef?.nativeElement;
    if (el) {
      el.srcObject = this.remoteStream;
      void el.play().catch(() => undefined);
    }
    this.cdr.markForCheck();
  }

  private attachLocal(stream: MediaStream): void {
    const el = this.localVideoRef.nativeElement;
    el.srcObject = stream;
    el.muted = true;
    void el.play().catch(() => undefined);
  }

  private attachRemote(stream: MediaStream): void {
    const el = this.remoteVideoRef.nativeElement;
    el.srcObject = stream;
    el.muted = false;
    void el.play().catch(() => undefined);
    this.syncRemotePreview();
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    // NOTE: For production reliability you should add TURN.
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (ev) => {
      if (!ev.candidate) return;
      this.signaling.sendIceCandidate(this.roomName, peerId, ev.candidate.toJSON());
    };

    pc.ontrack = (ev) => {
      const track = ev.track;
      const exists = this.remoteStream.getTracks().some((t) => t.id === track.id);
      if (!exists) this.remoteStream.addTrack(track);
      track.addEventListener('ended', () => this.syncRemotePreview());
      track.addEventListener('unmute', () => this.syncRemotePreview());
      this.syncRemotePreview();
    };

    // Add local tracks.
    if (this.localStream) {
      for (const t of this.localStream.getTracks()) {
        pc.addTrack(t, this.localStream);
      }
    }

    return pc;
  }

  private async ensurePeerConnection(peerId: string, makeOffer: boolean): Promise<void> {
    if (!peerId) return;
    if (this.pcs.has(peerId)) return;

    const pc = this.createPeerConnection(peerId);
    this.pcs.set(peerId, pc);

    if (makeOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (pc.localDescription) {
        this.signaling.sendOffer(this.roomName, peerId, pc.localDescription);
      }
    }
  }

  private async onOffer(fromPeerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    let pc = this.pcs.get(fromPeerId);
    if (!pc) {
      pc = this.createPeerConnection(fromPeerId);
      this.pcs.set(fromPeerId, pc);
    }

    try {
      if (pc.signalingState === 'have-local-offer') {
        try {
          await pc.setLocalDescription({ type: 'rollback' });
        } catch {
          this.closePeer(fromPeerId);
          pc = this.createPeerConnection(fromPeerId);
          this.pcs.set(fromPeerId, pc);
        }
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (pc.localDescription) {
        this.signaling.sendAnswer(this.roomName, fromPeerId, pc.localDescription);
      }
    } catch {
      // glare or out-of-order SDP; peer may retry
    }
    this.cdr.markForCheck();
  }

  private async onAnswer(fromPeerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.pcs.get(fromPeerId);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch {
      // ignore
    }
    this.cdr.markForCheck();
  }

  private async onIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.pcs.get(fromPeerId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {
      // ignore
    }
  }

  private closePeer(peerId: string): void {
    const pc = this.pcs.get(peerId);
    if (!pc) return;
    for (const r of pc.getReceivers()) {
      const t = r.track;
      if (t) {
        try {
          this.remoteStream.removeTrack(t);
        } catch {
          // ignore
        }
      }
    }
    try {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.close();
    } catch {
      // ignore
    }
    this.pcs.delete(peerId);
    this.syncRemotePreview();
  }
}

function decodeQueryTokenParam(raw: string): string {
  const t = raw?.trim();
  if (!t) return '';
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

