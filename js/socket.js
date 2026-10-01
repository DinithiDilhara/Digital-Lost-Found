/* Future WebSocket adapter. These hooks do not open a network connection.
   Later: authenticate the connection, parse messages, then emit these events.
   UI listeners can refresh data through api.js when an event arrives. */
DLF.socket = {
  connectWebSocket() { return { connected: false, mode: 'mock' }; },
  disconnectWebSocket() {},
  handleNotification(notification) { window.dispatchEvent(new CustomEvent('dlf:notification', { detail: notification })); },
  handlePossibleMatch(match) { window.dispatchEvent(new CustomEvent('dlf:match', { detail: match })); }
};
