
import { data } from './data.js';

// API requests go through the Vite proxy to Java on port 5000.
const API_BASE_URL = '/api';

// Convert Java/MySQL data into the React frontend format.
function mapDatabaseItem(item, type) {
  return {
    id: `${type}-${item.itemId}`,
    name: item.title,
    type,
    category: item.category,
    color: '',
    location: item.location,
    date: type === 'lost' ? item.dateLost : item.dateFound,
    description: item.description,
    status: item.status,
    ownerId: String(item.userId),
    image: 'assets/images/other.svg'
  };
}

// Retrieve the real lost and found records from MySQL.
async function fetchDatabaseItems() {
  const [lostResponse, foundResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/lost-items`),
    fetch(`${API_BASE_URL}/found-items`)
  ]);

  if (!lostResponse.ok || !foundResponse.ok) {
    throw new Error('Unable to retrieve items from MySQL');
  }

  const lostItems = await lostResponse.json();
  const foundItems = await foundResponse.json();

  if (!Array.isArray(lostItems) || !Array.isArray(foundItems)) {
    throw new Error('Invalid response from Java backend');
  }

  return [
    ...lostItems.map(item => mapDatabaseItem(item, 'lost')),
    ...foundItems.map(item => mapDatabaseItem(item, 'found'))
  ];
}

// Main frontend API service.
export const api = (() => {
  const prefix = 'dlf-v1-';
  const memory = {};

  const copy = value => JSON.parse(JSON.stringify(value));

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(prefix + key);
      return value ? JSON.parse(value) : copy(fallback);
    } catch {
      return key in memory ? copy(memory[key]) : copy(fallback);
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    } catch {
      throw new Error('Your browser could not save this change.');
    }

    memory[key] = copy(value);
    return copy(value);
  }

  function getSession() {
    try {
      return JSON.parse(
        sessionStorage.getItem(prefix + 'session') ||
        localStorage.getItem(prefix + 'session') ||
        'null'
      );
    } catch {
      return null;
    }
  }

  function requireUser() {
    const session = getSession();

    if (!session) {
      throw new Error('Please log in to continue.');
    }

    return session;
  }

  // Demo data is retained for features without Java endpoints.
  const allItems = () => read('items', data.items);

  const currentUser = () => {
    const session = requireUser();

    return read('profiles', {})[session.id] || {
      ...data.user,
      id: session.id,
      email: session.email
    };
  };

  const scopedKey = name => `${name}-${requireUser().id}`;

  function ownItem(id) {
    const item = allItems().find(
      item => String(item.id) === String(id)
    );

    if (!item || item.ownerId !== requireUser().id) {
      throw new Error('This report is not available to edit.');
    }

    return item;
  }

  function filterItems(items, filters = {}) {
    const words = (filters.query || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return items.filter(item => {
      const text = [
        item.name,
        item.category,
        item.color,
        item.location,
        item.type,
        item.status
      ].join(' ').toLowerCase();

      return words.every(word => text.includes(word)) &&
        (!filters.type || item.type === filters.type) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.location || item.location === filters.location) &&
        (!filters.date || item.date === filters.date) &&
        (!filters.status || item.status === filters.status);
    });
  }

  // Demo authentication.
  async function loginUser({ email, password, remember }) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      throw new Error('Enter a valid email and password.');
    }

    const accounts = read('accounts', []);

    const account = accounts.find(
      account => account.email.toLowerCase() === email.toLowerCase()
    );

    const session = {
      id: account ? account.id : data.user.id,
      email
    };

    try {
      localStorage.removeItem(prefix + 'session');
      sessionStorage.removeItem(prefix + 'session');

      (remember ? localStorage : sessionStorage).setItem(
        prefix + 'session',
        JSON.stringify(session)
      );
    } catch {
      throw new Error('Enable browser storage to use the demo login.');
    }

    return currentUser();
  }

  async function registerUser({ name, registration, email, password }) {
    if (
      !name.trim() ||
      !registration.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8
    ) {
      throw new Error('Please check your registration details.');
    }

    const accounts = read('accounts', []);

    if (accounts.some(
      account => account.email.toLowerCase() === email.toLowerCase()
    )) {
      throw new Error('This email is already registered in this browser.');
    }

    const user = {
      id: `student-${Date.now()}`,
      name,
      registration,
      email
    };

    write('profiles', {
      ...read('profiles', {}),
      [user.id]: user
    });

    write('accounts', [...accounts, user]);

    return user;
  }

  // Demo report writes: these are NOT saved in MySQL yet.
  async function saveReport(values, type, id) {
    const user = requireUser();

    if (
      !values.name.trim() ||
      !values.category ||
      !values.date ||
      !values.location ||
      !values.description.trim()
    ) {
      throw new Error('Complete all required fields.');
    }

    const previous = id != null ? ownItem(id) : null;

    const item = {
      ...values,
      id: previous ? previous.id : Date.now(),
      type: previous ? previous.type : type,
      ownerId: user.id,
      status: previous ? previous.status : 'Open',
      image: values.image || 'assets/images/other.svg'
    };

    write(
      'items',
      previous
        ? allItems().map(row => row.id === item.id ? item : row)
        : [item, ...allItems()]
    );

    return item;
  }

  async function getNotifications() {
    return read(
      scopedKey('notifications'),
      requireUser().id === data.user.id ? data.notifications : []
    );
  }

  async function addNotification(notification) {
    return write(scopedKey('notifications'), [
      {
        ...notification,
        id: Date.now(),
        date: new Date().toISOString(),
        read: false
      },
      ...await getNotifications()
    ]);
  }

  return {
    API_BASE_URL,
    getSession,
    loginUser,
    registerUser,
    filterItems,

    logout: async () => {
      localStorage.removeItem(prefix + 'session');
      sessionStorage.removeItem(prefix + 'session');
    },

    getUser: async () => copy(currentUser()),

    // REAL MYSQL DATABASE READ OPERATIONS

    getItems: async (filters = {}) => {
      const items = await fetchDatabaseItems();
      return filterItems(items, filters);
    },

    getLostItems: async (filters = {}) => {
      const items = await fetchDatabaseItems();
      return filterItems(items, { ...filters, type: 'lost' });
    },

    getFoundItems: async (filters = {}) => {
      const items = await fetchDatabaseItems();
      return filterItems(items, { ...filters, type: 'found' });
    },

    getItem: async id => {
      const items = await fetchDatabaseItems();
      const databaseItem = items.find(
        item => String(item.id) === String(id)
      );

      if (databaseItem) return databaseItem;

      // Preserve access to existing demo report details.
      return allItems().find(
        item => String(item.id) === String(id)
      );
    },

    searchItems: async query => {
      const items = await fetchDatabaseItems();
      return filterItems(items, { query });
    },

    // REMAINING DEMO OPERATIONS

    getMyReports: async () =>
      allItems().filter(
        item => item.ownerId === requireUser().id
      ),

    reportLostItem: async values =>
      saveReport(values, 'lost'),

    reportFoundItem: async values =>
      saveReport(values, 'found'),

    updateReport: async (id, values) =>
      saveReport(values, null, id),

    deleteReport: async id => {
      ownItem(id);
      write(
        'items',
        allItems().filter(
          item => String(item.id) !== String(id)
        )
      );
    },

    resolveReport: async id => {
      const item = ownItem(id);

      write(
        'items',
        allItems().map(row =>
          row.id === item.id
            ? {
                ...row,
                status: row.type === 'found' ? 'Returned' : 'Resolved'
              }
            : row
        )
      );
    },

    getNotifications,
    addNotification,

    markNotificationsRead: async id =>
      write(
        scopedKey('notifications'),
        (await getNotifications()).map(note =>
          !id || note.id === Number(id)
            ? { ...note, read: true }
            : note
        )
      ),

    getMatches: async () => {
      const dismissed = read(scopedKey('dismissed'), []);
      const items = allItems();

      return data.matches
        .filter(match => !dismissed.includes(match.id))
        .map(match => ({
          ...match,
          lost: items.find(item => item.id === match.lostId),
          found: items.find(item => item.id === match.foundId)
        }))
        .filter(match =>
          match.lost &&
          match.found &&
          match.lost.ownerId === requireUser().id &&
          match.lost.status === 'Open' &&
          match.found.status === 'Open'
        );
    },

    dismissMatch: async id =>
      write(
        scopedKey('dismissed'),
        [...read(scopedKey('dismissed'), []), Number(id)]
      ),

    claimItem: async (id, proof) => {
      const user = requireUser();

      const item = allItems().find(
        item => String(item.id) === String(id)
      );

      if (
        !item ||
        item.type !== 'found' ||
        item.status !== 'Open' ||
        item.ownerId === user.id
      ) {
        throw new Error('This item is not available to claim.');
      }

      if (proof.trim().length < 15) {
        throw new Error(
          'Add at least 15 characters describing the item.'
        );
      }

      const claims = read(scopedKey('claims'), []);

      if (claims.some(claim => claim.itemId === item.id)) {
        throw new Error(
          'You already submitted a demo claim for this item.'
        );
      }

      write(scopedKey('claims'), [
        ...claims,
        {
          itemId: item.id,
          proof,
          status: 'Pending',
          date: new Date().toISOString()
        }
      ]);

      await addNotification({
        title: 'Claim submitted',
        message: `Your demo claim for ${item.name} is pending review.`,
        icon: 'check',
        itemId: item.id
      });
    },

    contactReporter: async (id, message) => {
      requireUser();

      if (message.trim().length < 10) {
        throw new Error(
          'Please write a message of at least 10 characters.'
        );
      }

      write(scopedKey('messages'), [
        ...read(scopedKey('messages'), []),
        {
          itemId: String(id),
          message,
          date: new Date().toISOString()
        }
      ]);
    },

    updateProfile: async values => {
      const user = {
        ...currentUser(),
        ...values,
        id: requireUser().id
      };

      const accounts = read('accounts', []);

      if (accounts.some(
        account =>
          account.id !== user.id &&
          account.email.toLowerCase() === user.email.toLowerCase()
      )) {
        throw new Error('That email belongs to another demo account.');
      }

      write('profiles', {
        ...read('profiles', {}),
        [user.id]: user
      });

      write(
        'accounts',
        accounts.map(account =>
          account.id === user.id ? user : account
        )
      );

      return user;
    },

    changePassword: async password => {
      requireUser();

      if (password.length < 8) {
        throw new Error('Use at least 8 characters.');
      }

      return { demo: true };
    }
  };
})();
