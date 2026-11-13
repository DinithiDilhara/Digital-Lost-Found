const socketState = {
  socket: null,
  reconnectTimer: null,
  stopped: false,
  pendingMessages: new Map(),
};

function failPendingMessages(error) {
  for (const [clientMessageId, pending] of socketState.pendingMessages) {
    clearTimeout(pending.timer);
    pending.reject(error);
    socketState.pendingMessages.delete(clientMessageId);
  }
}

function resolveSocketUrl() {
  const port = import.meta?.env?.VITE_WS_PORT || '5001';
  if (typeof window === 'undefined' || typeof location === 'undefined') {
    return `ws://127.0.0.1:${port}/api/ws`;
  }
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const configuredTarget = import.meta?.env?.VITE_WS_TARGET;
  const target = configuredTarget && /^https?:\/\//i.test(configuredTarget)
    ? new URL(configuredTarget)
    : configuredTarget && /^wss?:\/\//i.test(configuredTarget)
      ? new URL(configuredTarget)
      : new URL(`${scheme}://${configuredTarget || window.location.hostname || '127.0.0.1'}`);
  target.protocol = scheme === 'wss' ? 'wss:' : 'ws:';
  if (!target.port) target.port = port;
  target.pathname = '/api/ws';
  target.search = '';
  target.hash = '';
  return target.toString();
}

function emit(name, detail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

function handleIncoming(data) {
  if (!data || typeof data !== 'string') return;
  let payload;
  try {
    payload = JSON.parse(data);
  } catch {
    return;
  }
  if (!payload || typeof payload !== 'object') return;
  if (payload.type === 'NEW_MESSAGE') {
    emit('dlf:message', payload.message || payload);
    return;
  }
  if (payload.type === 'MESSAGE_SENT') {
    const message = payload.message;
    const pending = socketState.pendingMessages.get(payload.clientMessageId);
    if (pending) {
      clearTimeout(pending.timer);
      socketState.pendingMessages.delete(payload.clientMessageId);
      if (message && typeof message === 'object') {
        pending.resolve(message);
      } else {
        pending.reject(new Error('The server returned an invalid message acknowledgement.'));
      }
    }
    if (message && typeof message === 'object') emit('dlf:message', message);
    return;
  }
  if (payload.type === 'NEW_NOTIFICATION') {
    socket.handleNotification(payload.notification || payload);
    return;
  }
  if (payload.type === 'PONG') {
    return;
  }
  if (payload.type === 'ERROR' && payload.error) {
    console.warn('WebSocket server rejected a message:', payload.error);
    const pending = socketState.pendingMessages.get(payload.clientMessageId);
    if (pending) {
      clearTimeout(pending.timer);
      socketState.pendingMessages.delete(payload.clientMessageId);
      pending.reject(new Error(payload.error));
    }
  }
}

export const socket = {
  connectWebSocket() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      return { connected: false, mode: 'mock' };
    }
    if (socketState.socket && (socketState.socket.readyState === WebSocket.OPEN || socketState.socket.readyState === WebSocket.CONNECTING)) {
      return { connected: socketState.socket.readyState === WebSocket.OPEN, mode: 'live', url: socketState.socket.url };
    }
    socketState.stopped = false;
    const clientSocket = new WebSocket(resolveSocketUrl());
    socketState.socket = clientSocket;
    clientSocket.addEventListener('open', () => {
      emit('dlf:ws-status', { connected: true, url: clientSocket.url });
    });
    clientSocket.addEventListener('message', (event) => handleIncoming(event.data));
    clientSocket.addEventListener('close', () => {
      if (socketState.socket === clientSocket) socketState.socket = null;
      failPendingMessages(new Error('WebSocket closed before the message was confirmed. Retry to send it.'));
      if (!socketState.stopped) {
        socketState.reconnectTimer = window.setTimeout(() => {
          socketState.reconnectTimer = null;
          socket.connectWebSocket();
        }, 2000);
      }
      emit('dlf:ws-status', { connected: false });
    });
    clientSocket.addEventListener('error', () => {
      emit('dlf:ws-status', { connected: false, error: 'WebSocket unavailable.' });
    });
    return { connected: false, mode: 'live', url: clientSocket.url };
  },
  sendChatMessage({ conversationId, content, clientMessageId }) {
    const clientSocket = socketState.socket;
    if (!clientSocket || clientSocket.readyState !== WebSocket.OPEN) {
      return Promise.resolve(null);
    }
    if (socketState.pendingMessages.has(clientMessageId)) {
      return Promise.reject(new Error('This message is already being sent.'));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socketState.pendingMessages.delete(clientMessageId);
        reject(new Error('The server did not confirm the message. Retry to check its status.'));
      }, 20000);
      socketState.pendingMessages.set(clientMessageId, { resolve, reject, timer });
      try {
        clientSocket.send(JSON.stringify({
          type: 'CHAT_MESSAGE',
          conversationId,
          content,
          clientMessageId,
        }));
      } catch (error) {
        clearTimeout(timer);
        socketState.pendingMessages.delete(clientMessageId);
        reject(error);
      }
    });
  },
  disconnectWebSocket() {
    socketState.stopped = true;
    failPendingMessages(new Error('WebSocket disconnected before the message was confirmed. Retry to send it.'));
    if (socketState.reconnectTimer) {
      window.clearTimeout(socketState.reconnectTimer);
      socketState.reconnectTimer = null;
    }
    if (socketState.socket) {
      socketState.socket.close();
      socketState.socket = null;
    }
  },
  handleNotification(notification) {
    if (!notification) return;
    emit('dlf:notification', notification);
  },
  handlePossibleMatch(match) {
    if (!match) return;
    emit('dlf:match', match);
  },
};
