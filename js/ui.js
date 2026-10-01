DLF.ui = (() => {
  const paths = {
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.3"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    lost: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5M8 11h6"/>',
    found: '<path d="m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11m-5-17 9 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    match: '<path d="m9 3-1 5-5 1 5 2 1 5 2-5 5-2-5-1-2-5Zm9 11-1 3-3 1 3 1 1 3 1-3 3-1-3-1-1-3Z"/>',
    reports: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9zM9 12h6m-6 4h6"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM9 21h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    logout: '<path d="M9 4H4v16h5m5-13 5 5-5 5m-6-5h13"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    campus: '<path d="m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18"/>',
    heart: '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 8 15 8 15S25 10 20 5Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v5m10-5v5M3 11h18"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-4-4L5 15l-1 5Z"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    filter: '<path d="M4 6h16M7 12h10m-7 6h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
  };
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.found}</svg>`;
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const date = value => new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const initials = name => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const brand = (small = false) => `<a class="brand ${small ? 'brand-small' : ''}" href="index.html" aria-label="DigitalLostFound home"><span class="brand-mark">${icon('pin')}</span><span>Digital<span class="brand-light">LostFound</span>${small ? '<small>CAMPUS COMMUNITY</small>' : ''}</span></a>`;
  const badge = item => `<span class="badge ${item.type}"><span></span>${escape(item.type)}</span>${item.status !== 'Open' ? `<span class="badge resolved">${escape(item.status)}</span>` : ''}`;
  const safeImage = source => /^(assets\/images\/[a-z-]+\.svg|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(source || '') ? source : 'assets/images/other.svg';
  function card(item, options = {}) {
    return `<article class="item-card"><a class="item-picture ${escape(item.category.toLowerCase().replace(/ /g, '-'))}" href="item-details.html?id=${item.id}" tabindex="-1" aria-hidden="true"><img src="${safeImage(item.image)}" alt="" loading="lazy"><div class="card-badges">${badge(item)}</div></a><div class="item-body"><span class="sr-only">${escape(item.type)} item. Status: ${escape(item.status)}.</span><div class="item-category">${escape(item.category)}${options.full ? ` <span>· ${escape(item.color || 'Not specified')}</span>` : ''}</div><h3><a href="item-details.html?id=${item.id}">${escape(item.name)}</a></h3><p class="item-meta">${icon('pin')}${escape(item.location)}</p><p class="item-meta">${icon('calendar')}${date(item.date)}</p>${options.full ? `<p class="item-description">${escape(item.description)}</p>` : ''}<a class="card-link" href="item-details.html?id=${item.id}">View Details ${icon('arrow')}</a></div></article>`;
  }
  const empty = (title, message, link = '') => `<div class="empty-state"><span class="empty-icon">${icon('search')}</span><h3>${escape(title)}</h3><p>${escape(message)}</p>${link}</div>`;
  function toast(message, type = 'success') {
    let region = document.querySelector('#toasts');
    if (!region) { region = document.createElement('div'); region.id = 'toasts'; region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite'); document.body.append(region); }
    const node = document.createElement('div'); node.className = `toast ${type}`;
    node.innerHTML = `${icon(type === 'success' ? 'check' : 'info')}<span>${escape(message)}</span><button class="icon-button" aria-label="Dismiss notification">${icon('close')}</button>`;
    node.querySelector('button').onclick = () => node.remove(); region.append(node); setTimeout(() => node.remove(), 6500);
  }
  function flash(message) { try { sessionStorage.setItem('dlf-flash', message); } catch { /* Optional cross-page toast. */ } }
  function showFlash() { try { const message = sessionStorage.getItem('dlf-flash'); if (message) { sessionStorage.removeItem('dlf-flash'); toast(message); } } catch { /* Storage may be unavailable. */ } }
  function modal({ title, content, confirmText = 'Confirm', danger = false, onConfirm }) {
    const previous = document.activeElement;
    const dialog = document.createElement('dialog'); dialog.className = 'modal';
    dialog.innerHTML = `<div class="modal-heading"><h2 id="modal-title">${escape(title)}</h2><button type="button" class="icon-button" data-close aria-label="Close dialog">${icon('close')}</button></div><form novalidate><div class="modal-content">${content}</div><p class="form-error" role="alert" data-modal-error></p><div class="modal-actions"><button class="btn btn-plain" type="button" data-close>Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="submit">${escape(confirmText)}</button></div></form>`;
    dialog.setAttribute('aria-labelledby', 'modal-title'); document.body.append(dialog);
    dialog.querySelectorAll('[data-close]').forEach(button => button.onclick = () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => { dialog.remove(); previous?.focus(); });
    dialog.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const button = event.submitter; button.disabled = true;
      try { if (await onConfirm(dialog) !== false) dialog.close(); }
      catch (error) { dialog.querySelector('[data-modal-error]').textContent = error.message; }
      finally { button.disabled = false; }
    };
    dialog.showModal(); return dialog;
  }
  function validate(form, rules) {
    let valid = true;
    Object.entries(rules).forEach(([name, check]) => {
      const field = form.elements.namedItem(name); if (!field) return;
      const message = check(field.value); const error = form.querySelector(`[data-error="${name}"]`);
      field.setAttribute('aria-invalid', String(!!message));
      if (error) { error.textContent = message || ''; field.setAttribute('aria-describedby', error.id); }
      if (message) valid = false;
    });
    if (!valid) form.querySelector('[aria-invalid="true"]')?.focus();
    return valid;
  }
  const required = label => value => value.trim() ? '' : `${label} is required.`;
  const emailRule = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid university email address.';
  const error = name => `<span class="field-error" id="error-${name}" data-error="${name}"></span>`;
  function passwordField(label, name, autocomplete = 'current-password') {
    return `<div class="field"><label for="${name}">${label}</label><div class="password-wrap"><input type="password" id="${name}" name="${name}" autocomplete="${autocomplete}" required><button type="button" class="icon-button" data-password="${name}" aria-label="Show ${label.toLowerCase()}" aria-pressed="false">${icon('eye')}</button></div>${error(name)}</div>`;
  }
  function bindPasswords(root = document) {
    root.querySelectorAll('[data-password]').forEach(button => button.onclick = () => {
      const input = root.querySelector(`#${button.dataset.password}`); const show = input.type === 'password'; input.type = show ? 'text' : 'password'; button.setAttribute('aria-pressed', String(show)); button.setAttribute('aria-label', `${show ? 'Hide' : 'Show'} password`);
    });
  }
  const nav = [['dashboard', 'Dashboard', 'dashboard'], ['lost-items', 'Lost Items', 'lost'], ['found-items', 'Found Items', 'found'], ['report-item', 'Report Item', 'plus'], ['possible-matches', 'Possible Matches', 'match'], ['my-reports', 'My Reports', 'reports'], ['notifications', 'Notifications', 'bell'], ['profile', 'Profile', 'user']];
  async function updateUnread() {
    if (!DLF.api.getSession()) return;
    const count = (await DLF.api.getNotifications()).filter(note => !note.read).length;
    document.querySelectorAll('[data-unread]').forEach(element => { element.textContent = count; element.hidden = !count; });
    document.querySelector('.notification-button')?.setAttribute('aria-label', `Notifications, ${count} unread`);
  }
  async function shell(page, title) {
    const user = await DLF.api.getUser();
    document.body.classList.add('app-body');
    document.querySelector('#app').innerHTML = `<button class="sidebar-scrim" aria-label="Close navigation" hidden></button><aside class="sidebar" id="sidebar">${brand(true)}<div class="workspace-label">YOUR WORKSPACE</div><nav aria-label="Main application">${nav.map(([path, label, glyph]) => `<a href="${path}.html" class="nav-link ${page === path ? 'active' : ''}" ${page === path ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${path === 'notifications' ? '<span class="nav-count" data-unread hidden></span>' : ''}</a>`).join('')}</nav><div class="sidebar-bottom"><div class="community-note">${icon('heart')}<strong>A little help. A big difference.</strong><p>Thank you for looking out for your campus community.</p></div><button class="nav-link logout" data-logout>${icon('logout')}Log out</button></div></aside><div class="app-frame"><header class="app-header"><button class="icon-button mobile-menu" aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button><h1>${escape(title)}</h1><form class="global-search" action="search.html" role="search"><label class="sr-only" for="global-query">Search lost and found items</label>${icon('search')}<input id="global-query" name="q" placeholder="Search lost and found items..."><button class="sr-only" type="submit">Search</button></form><a class="mobile-search icon-button" href="search.html" aria-label="Search all campus items">${icon('search')}</a><a class="notification-button icon-button" href="notifications.html" aria-label="Notifications">${icon('bell')}<span data-unread hidden></span></a><div class="user-menu"><button class="user-toggle" aria-expanded="false" aria-controls="user-dropdown"><span class="avatar" data-avatar>${escape(initials(user.name))}</span><span class="user-name" data-user-name>${escape(user.name)}</span>${icon('chevron')}</button><div class="user-dropdown" id="user-dropdown" hidden><a href="profile.html">${icon('user')}My profile</a><button data-logout>${icon('logout')}Log out</button></div></div></header><main class="app-main" id="main" tabindex="-1"></main><footer class="app-footer"><span>© 2026 DigitalLostFound</span><span><span class="status-dot"></span>Frontend preview · Mock data</span></footer></div>`;
    const menu = document.querySelector('.mobile-menu'); const scrim = document.querySelector('.sidebar-scrim');
    const sidebar = document.querySelector('#sidebar');
    const mobile = window.matchMedia('(max-width: 780px)');
    const syncSidebar = () => { sidebar.inert = mobile.matches && !document.body.classList.contains('sidebar-open'); };
    const closeMenu = () => { const wasOpen = document.body.classList.contains('sidebar-open'); document.body.classList.remove('sidebar-open'); menu.setAttribute('aria-expanded', 'false'); scrim.hidden = true; syncSidebar(); if (wasOpen) menu.focus(); };
    mobile.addEventListener('change', closeMenu); syncSidebar();
    menu.onclick = () => { const open = !document.body.classList.contains('sidebar-open'); document.body.classList.toggle('sidebar-open', open); menu.setAttribute('aria-expanded', String(open)); scrim.hidden = !open; syncSidebar(); if (open) sidebar.querySelector('a').focus(); };
    sidebar.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || !mobile.matches) return;
      const links = sidebar.querySelectorAll('a,button');
      if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); links[links.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === links[links.length - 1]) { event.preventDefault(); links[0].focus(); }
    });
    scrim.onclick = closeMenu;
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); document.querySelector('#user-dropdown').hidden = true; document.querySelector('.user-toggle').setAttribute('aria-expanded', 'false'); } });
    const toggle = document.querySelector('.user-toggle'); const dropdown = document.querySelector('#user-dropdown');
    toggle.onclick = () => { dropdown.hidden = !dropdown.hidden; toggle.setAttribute('aria-expanded', String(!dropdown.hidden)); };
    document.addEventListener('click', event => { if (!event.target.closest('.user-menu')) { dropdown.hidden = true; toggle.setAttribute('aria-expanded', 'false'); } });
    document.querySelectorAll('[data-logout]').forEach(button => button.onclick = async () => { await DLF.api.logout(); location.href = 'index.html'; });
    await updateUnread();
  }
  function publicHeader() {
    return `<header class="landing-header"><div class="container nav-container">${brand()}<button class="icon-button public-menu" aria-label="Toggle navigation" aria-expanded="false" aria-controls="public-nav">${icon('menu')}</button><nav id="public-nav" aria-label="Main navigation"><a href="index.html#home">Home</a><a href="index.html#how-it-works">How It Works</a><a href="index.html#recent-items">Recent Items</a><a href="index.html#about">About</a><a class="login-link" href="login.html">Login</a><a class="btn btn-primary btn-small" href="register.html">Get Started ${icon('arrow')}</a></nav></div></header>`;
  }
  function bindPublicHeader() {
    const button = document.querySelector('.public-menu'); const nav = document.querySelector('#public-nav');
    button.onclick = () => { const open = nav.classList.toggle('is-open'); button.setAttribute('aria-expanded', String(open)); };
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { nav.classList.remove('is-open'); button.setAttribute('aria-expanded', 'false'); }));
  }
  async function contact(id) {
    if (!DLF.api.getSession()) { location.href = 'login.html'; return; }
    modal({ title: 'Contact the reporter', content: `<p>Introduce yourself and describe the item. Your message will be saved only in this browser for the prototype.</p><div class="field"><label for="message">Your message</label><textarea id="message" name="message" rows="4" maxlength="1500" placeholder="Hi, I think this might be my item..."></textarea></div><div class="notice">${icon('shield')}Personal contact details stay private.</div>`, confirmText: 'Save demo message', onConfirm: async dialog => { await DLF.api.contactReporter(id, dialog.querySelector('textarea').value); toast('Demo message saved locally. No message was sent.'); } });
  }
  return { icon, escape, date, initials, brand, badge, safeImage, card, empty, toast, flash, showFlash, modal, validate, required, emailRule, error, passwordField, bindPasswords, shell, updateUnread, publicHeader, bindPublicHeader, contact };
})();
