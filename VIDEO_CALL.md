# Video calling (Option B: direct WebRTC)

This Angular app includes a **direct WebRTC** (`RTCPeerConnection`) + **Socket.IO signaling** flow (no mediasoup required).

## Environment config

Update these in:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

- **`environment.apiUrl`**: REST API root (same host/port as the Node server). WebRTC Socket.IO connects to **`${apiUrl}/webrtc`**; optional chat uses **`${apiUrl}/video-chat`** (if implemented on the API).
- (Optional/legacy) `environment.newRtcUrl` exists from the previous mediasoup attempt; **Option B does not require it**.

## Route

Navigate to:

- `/video/<roomName>?token=<jwt>` (optional). If you are already logged in, the app uses the **session access token first** and only falls back to `?token=` so an old bookmarked JWT does not override a valid login.

Example:

- `/video/demo-room?token=<jwt>`

## Frontend entry points

- **`WebRtcSignalingService`**: `src/app/core/services/webrtc-signaling.service.ts`
- **`VideoCallComponent`**: `src/app/features/video-call/pages/video-call/video-call.component.ts`
- **Optional chat**: `VideoChatSocketService` at `src/app/core/services/video-chat-socket.service.ts`

## Backend socket contract (must match)

### WebRTC signaling namespace

The frontend expects a Socket.IO namespace at:

- `${environment.apiUrl}/webrtc` (same pattern as LocateHome API README: `io(\`${API_BASE_URL}/webrtc\`, { transports: ['websocket'], auth: { token } })`)

- **Emits**
  - `join-room` (payload: `{ roomName }`)
  - `leave-room` (payload: `{ roomName }`)
  - `offer` (payload: `{ roomName, toPeerId, sdp }`)
  - `answer` (payload: `{ roomName, toPeerId, sdp }`)
  - `ice-candidate` (payload: `{ roomName, toPeerId, candidate }`)

- **Listens**
  - `room-joined` (payload: `{ roomName, peerId, peers: [{ peerId }] }`)
  - `peer-joined` (payload: `{ peerId }`)
  - `peer-left` (payload: `{ peerId }`)
  - `offer` (payload: `{ fromPeerId, sdp }`)
  - `answer` (payload: `{ fromPeerId, sdp }`)
  - `ice-candidate` (payload: `{ fromPeerId, candidate }`)
  - `error`
  - `session-expired`

### Video chat namespace `/video-chat` (optional)

- **Emits**
  - `join-video-chat-room`
  - `send-video-chat-message`
  - `timer-sync` (payload includes `{ roomName, action, ... }`, action in `request-sync | sync-response | start | reset | no-timer`)

- **Listens**
  - `video-chat-message`
  - `video-chat-history`
  - `video-chat-error`
  - `timer-sync`
  - `payment-capture-failed`

