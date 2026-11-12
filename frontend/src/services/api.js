import { previewApi } from './preview.js';

const API_BASE_URL = '/api';
let session = null;
let backendError = '';
const emit = (name, detail) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
};
function backendStatus(message) {
  backendError = message;
  emit('dlf:backend-status', { error: message });
}
async function request(path, { method = 'GET', body, key, anonymous = false } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(method !== 'GET' ? { 'X-DLF-Request': '1' } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    const message = 'Cannot connect to the Java backend. Check that it is running, then retry.';
    backendStatus(message);
    throw new Error(message);
  }
  if (response.status >= 500) {
    const message = 'The Java backend or MySQL is unavailable. Check both services and the database configuration.';
    backendStatus(message);
    throw new Error(message);
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => {
    const message = 'Invalid API response. Check the Vite proxy and Java server.';
    backendStatus(message);
    throw new Error(message);
  });
  if (!response.ok) {
    if (response.status === 401 && !anonymous) {
      session = null;
      emit('dlf:session-expired');
    }
    const error = new Error(payload?.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  backendStatus('');
  return payload;
}
export function mapDatabaseItem(item, type) {
  const rawStatus = (item.status || '').toUpperCase();
  const status = rawStatus === 'OPEN' || rawStatus === (type === 'lost' ? 'LOST' : 'FOUND')
    ? 'Open' : rawStatus === 'RETURNED' ? 'Returned' : rawStatus === 'RESOLVED' || (type === 'lost' && rawStatus === 'FOUND')
      ? 'Resolved' : item.status || 'Unknown';
  return {
    id: `${type}-${item.itemId}`, name: item.title, type,
    category: item.category || 'Other', color: item.color || '',
    location: item.location || '', date: type === 'lost' ? item.dateLost : item.dateFound,
    description: item.description || '', status, ownerId: String(item.userId),
    image: item.image || 'assets/images/other.svg', contact: item.contact || '', createdAt: item.createdAt || '',
  };
}
const combine = (lost, found) => [
  ...lost.map(item => mapDatabaseItem(item, 'lost')),
  ...found.map(item => mapDatabaseItem(item, 'found')),
].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.date.localeCompare(a.date));
function reportPath(id) {
  const match = /^(lost|found)-([1-9][0-9]*)$/.exec(String(id));
  if (!match) throw new Error('Invalid report link. Open a report from the campus listings.');
  return { type: match[1], path: `/${match[1]}-items/${match[2]}` };
}
function filterItems(items, filters = {}) {
  const words = (filters.query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const text = [item.name, item.description, item.category, item.color, item.location, item.type, item.status].join(' ').toLowerCase();
    return words.every(word => text.includes(word)) &&
      ['type', 'category', 'location', 'date', 'status'].every(field => !filters[field] || item[field] === filters[field]);
  });
}
async function getItems(filters = {}) {
  const [lost, found] = await Promise.all([request('/lost-items'), request('/found-items')]);
  if (!Array.isArray(lost) || !Array.isArray(found)) throw new Error('Invalid items response from Java.');
  return filterItems(combine(lost, found), filters);
}
async function getItem(id) {
  const { type, path } = reportPath(id);
  try { return mapDatabaseItem(await request(path), type); }
  catch (error) { if (error.status === 404) return null; throw error; }
}
async function saveReport(values, type, id, key) {
  const path = id ? reportPath(id).path : `/${type}-items`;
  const body = {
    title: values.name, description: values.description, category: values.category,
    location: values.location, [type === 'lost' ? 'dateLost' : 'dateFound']: values.date,
    color: values.color || '', contact: values.contact || '', image: values.image || '',
  };
  return mapDatabaseItem(await request(path, { method: id ? 'PUT' : 'POST', body, key: id ? undefined : key || crypto.randomUUID() }), type);
}
function conversationPath(id, suffix) {
  const value = String(id);
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error('Invalid conversation link.');
  return `/conversations/${value}/${suffix}`;
}
export const api = {
  API_BASE_URL,
  getBackendError: () => backendError,
  getSession: () => session,
  getUser: async () => {
    session = await request('/auth/me');
    return session;
  },
  loginUser: async values => {
    session = await request('/auth/login', { method: 'POST', body: values, anonymous: true });
    return session;
  },
  registerUser: values => request('/auth/register', { method: 'POST', body: values, anonymous: true }),
  logout: async () => {
    await request('/auth/logout', { method: 'POST' });
    session = null;
  },
  updateProfile: async values => {
    session = await request('/auth/me', { method: 'PUT', body: values });
    return session;
  },
  changePassword: (newPassword, currentPassword) => request('/auth/password', { method: 'PUT', body: { newPassword, currentPassword } }),
  filterItems,
  getItems,
  getLostItems: filters => getItems({ ...filters, type: 'lost' }),
  getFoundItems: filters => getItems({ ...filters, type: 'found' }),
  searchItems: query => getItems({ query }),
  getItem,
  getMyReports: async () => {
    const result = await request('/me/reports');
    return combine(result.lost, result.found);
  },
  reportLostItem: (values, key) => saveReport(values, 'lost', null, key),
  reportFoundItem: (values, key) => saveReport(values, 'found', null, key),
  updateReport: (id, values) => saveReport(values, reportPath(id).type, id),
  deleteReport: id => request(reportPath(id).path, { method: 'DELETE' }),
  resolveReport: id => {
    const { type, path } = reportPath(id);
    return request(path, { method: 'PATCH', body: { status: type === 'lost' ? 'RESOLVED' : 'RETURNED' } });
  },
  getNotifications: () => request('/notifications'),
  markNotificationRead: id => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read', { method: 'PATCH' }),
  getUnreadNotificationCount: async () => (await request('/notifications/unread-count')).count,
  contactReporter: async (itemId, message, key = crypto.randomUUID()) => {
    const { type, path } = reportPath(itemId);
    const reportId = Number(path.slice(path.lastIndexOf('/') + 1));
    return request('/conversations', {
      method: 'POST',
      body: { itemType: type, itemId: reportId, message },
      key,
    });
  },
  getConversations: () => request('/conversations'),
  submitFoundClaim: (itemId, { foundLocation, message }) => {
    const { type, path } = reportPath(itemId);
    if (type !== 'lost') throw new Error('Found-item claims can only be submitted for lost reports.');
    return request(`${path}/claims`, { method: 'POST', body: { foundLocation, message } });
  },
  getConversationMessages: id => request(conversationPath(id, 'messages')),
  replyToConversation: (id, message, key = crypto.randomUUID()) =>
    request(conversationPath(id, 'messages'), { method: 'POST', body: { message }, key }),
  markConversationRead: id =>
    request(conversationPath(id, 'read'), { method: 'POST', body: {} }),
  getUnreadMessageCount: async () => {
    const result = await request('/conversations/unread-count');
    return result.count;
  },
  ...previewApi(() => session, getItem),
};
