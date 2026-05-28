'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getOrdersSocket(branchId: string): Socket | null {
  if (typeof window === 'undefined') return null;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  if (!socket) {
    socket = io(`${base}/orders`, { transports: ['websocket', 'polling'], query: { branchId } });
  }
  return socket;
}
