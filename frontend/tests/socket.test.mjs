import assert from 'node:assert/strict';
import { test } from 'node:test';

test('chat messages are sent over WebSocket and resolve on the server acknowledgement', async () => {
  const originalWindow = globalThis.window;
  const originalLocation = globalThis.location;
  const originalWebSocket = globalThis.WebSocket;
  const originalCustomEvent = globalThis.CustomEvent;
  const events = [];
  let socket;

  class TestCustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  }
  class TestWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 3;
    static instances = [];

    constructor(url) {
      this.url = url;
      this.readyState = TestWebSocket.CONNECTING;
      this.listeners = new Map();
      this.sent = [];
      TestWebSocket.instances.push(this);
    }

    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }

    dispatch(type, event = {}) {
      for (const listener of this.listeners.get(type) || []) listener(event);
    }

    send(data) {
      this.sent.push(data);
    }

    close() {
      this.readyState = TestWebSocket.CLOSED;
    }
  }

  globalThis.CustomEvent = TestCustomEvent;
  globalThis.WebSocket = TestWebSocket;
  globalThis.location = { hostname: 'localhost', protocol: 'http:' };
  globalThis.window = {
    location: globalThis.location,
    dispatchEvent: (event) => events.push(event),
    setTimeout,
    clearTimeout,
  };

  try {
    ({ socket } = await import(`../src/services/socket.js?test=${crypto.randomUUID()}`));
    socket.connectWebSocket();
    const connection = TestWebSocket.instances[0];
    assert.equal(connection.url, 'ws://localhost:5001/api/ws');
    connection.readyState = TestWebSocket.OPEN;
    connection.dispatch('open');

    const clientMessageId = crypto.randomUUID();
    const pending = socket.sendChatMessage({
      conversationId: 42,
      content: 'Found your notebook.',
      clientMessageId,
    });

    assert.deepEqual(JSON.parse(connection.sent[0]), {
      type: 'CHAT_MESSAGE',
      conversationId: 42,
      content: 'Found your notebook.',
      clientMessageId,
    });

    const message = {
      id: 8,
      conversationId: 42,
      senderId: '5',
      body: 'Found your notebook.',
      createdAt: '2026-11-13T10:00:00Z',
    };
    connection.dispatch('message', {
      data: JSON.stringify({ type: 'MESSAGE_SENT', clientMessageId, message }),
    });

    assert.deepEqual(await pending, message);
    assert.ok(events.some((event) => event.type === 'dlf:message'
      && event.detail.id === message.id));
  } finally {
    socket?.disconnectWebSocket();
    globalThis.window = originalWindow;
    globalThis.location = originalLocation;
    globalThis.WebSocket = originalWebSocket;
    globalThis.CustomEvent = originalCustomEvent;
  }
});
