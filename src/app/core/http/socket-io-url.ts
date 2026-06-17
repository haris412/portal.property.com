import type { ManagerOptions, SocketOptions } from 'socket.io-client';

const DEFAULT_WS_BASE = 'http://localhost:3000';

type SocketIoOptions = Partial<ManagerOptions & SocketOptions>;

function normalizedWsUrl(baseUrl?: string): string {
  return (baseUrl?.trim() || DEFAULT_WS_BASE).replace(/\/+$/, '');
}

/** Scheme + host for Socket.IO (pathname is passed via `path`). */
export function socketIoOrigin(wsUrl?: string): string {
  return new URL(normalizedWsUrl(wsUrl)).origin;
}

/**
 * Socket.IO HTTP path (e.g. `/property.api/socket.io` behind IIS, `/socket.io` locally).
 */
export function socketIoPath(wsUrl?: string): string {
  const pathname = new URL(normalizedWsUrl(wsUrl)).pathname.replace(/\/+$/, '');
  return pathname ? `${pathname}/socket.io` : '/socket.io';
}

export function socketIoBaseOptions(
  wsUrl?: string,
  extra?: SocketIoOptions
): { url: string; options: SocketIoOptions } {
  return {
    url: socketIoOrigin(wsUrl),
    options: {
      path: socketIoPath(wsUrl),
      transports: ['websocket'],
      ...extra,
    },
  };
}

/** Namespaced Socket.IO connection (e.g. `/webrtc`, `/video-chat`). */
export function socketIoNamespaceOptions(
  namespace: string,
  wsUrl?: string,
  extra?: SocketIoOptions
): { url: string; options: SocketIoOptions } {
  const ns = namespace.startsWith('/') ? namespace : `/${namespace}`;
  const { url, options } = socketIoBaseOptions(wsUrl, extra);
  return { url: `${url}${ns}`, options };
}
