/* Frontend authentication simulation. Browser storage is not a security boundary. */
(() => {
  'use strict';
  const P = window.Paw;
  const V = P.validators;
  // PBKDF2 avoids saving a plain-text password. A real service needs server authentication.
  async function passwordHash(password, salt) {
    if (!window.crypto?.subtle) throw new Error('Open the site on HTTPS or localhost to create or access a demo account.');
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
    return [...new Uint8Array(bits)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  const signup = P.$('#signup-form');
  const login = P.$('#login-form');
  const form = signup || login;
  if (form) {
    P.$('#show-password').addEventListener('change', event => {
      P.$$('input[autocomplete="new-password"], input[autocomplete="current-password"]', form).forEach(input => { input.type = event.target.checked ? 'text' : 'password'; });
    });
    const next = P.returnPage();
    P.$('.auth-switch a').href += `?next=${encodeURIComponent(next)}`;
    let submitting = false;
    const rules = signup ? {
      'signup-name': V.name, 'signup-phone': V.phone, 'signup-email': V.email,
      'signup-password': V.password,
      'signup-confirm': value => value && value === P.$('#signup-password').value ? '' : 'Passwords must match.'
    } : { 'login-email': V.email, 'login-password': V.password };
    P.wireValidation(form, rules);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting) return;
      const prefix = signup ? 'signup' : 'login';
      const feedback = `#${prefix}-feedback`;
      P.feedback(feedback, '');
      if (!P.validate(form, rules)) { P.feedback(feedback, 'Please correct the highlighted fields.', true); return; }
      const email = P.$(`#${prefix}-email`).value.trim().toLowerCase();
      const password = P.$(`#${prefix}-password`).value;
      const existing = P.accounts().find(user => user.email === email);
      if (signup && existing) { P.feedback(feedback, 'This email already has an account. Please log in.', true); return; }
      submitting = true; P.busy(form, true);
      try {
        if (signup) {
          const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(byte => byte.toString(16).padStart(2, '0')).join('');
          const hash = await passwordHash(password, salt);
          // Re-read after async work to avoid overwriting an account added in another tab.
          const users = P.accounts();
          if (users.some(user => user.email === email)) throw new Error('This email is already registered. Please log in.');
          const user = { name: P.$('#signup-name').value.trim(), email, phone: P.$('#signup-phone').value.replace(/[\s()-]/g, ''), salt, passwordHash: hash, createdAt: new Date().toISOString() };
          if (!P.write('pawhavenUsers', [...users, user])) throw new Error('The account could not be saved. Enable browser storage and try again.');
          location.href = `login.html?registered=1&next=${encodeURIComponent(next)}`;
        } else {
          if (!existing || await passwordHash(password, existing.salt) !== existing.passwordHash) throw new Error('Email or password is incorrect. Please try again.');
          if (!P.write('pawhavenSession', email)) throw new Error('Your session could not be saved. Enable browser storage.');
          location.href = next;
        }
      } catch (error) { P.feedback(feedback, error.message, true); }
      finally { submitting = false; P.busy(form, false); }
    });
    if (login && new URLSearchParams(location.search).get('registered') === '1') P.feedback('#login-feedback', 'Account created! Log in with your new details.');
  }
  if (P.$('#profile-content')) {
    const user = P.currentUser();
    if (!user) { location.replace('login.html?next=profile.html'); return; }
    P.$('#profile-loading').hidden = true; P.$('#profile-content').hidden = false;
    P.$('#profile-name').textContent = user.name;
    P.$('#profile-email').textContent = user.email;
    P.$('#profile-phone').textContent = user.phone;
    P.$('#profile-created').textContent = `Joined ${new Date(user.createdAt).toLocaleDateString('en-GB')}`;
    P.$('#logout').addEventListener('click', () => { if (P.remove('pawhavenSession')) location.replace('login.html'); });
    const enquiries = P.userItems('requests');
    const requestList = P.$('#profile-requests');
    if (!enquiries.length) requestList.append(P.node('p', 'empty-state', 'No enquiries yet. Your saved enquiries will appear here.'));
    [...enquiries].reverse().forEach(item => {
      const card = P.node('article', 'record-card');
      card.append(P.node('h3', '', { adoption: 'Pet adoption', products: 'Pet products', general: 'General question' }[item.topic] || 'Enquiry'), P.node('p', 'small muted', `${new Date(item.createdAt).toLocaleString('en-GB')} · Saved locally`), P.node('p', 'message-text', item.message));
      requestList.append(card);
    });
    const orders = P.userItems('orders');
    const orderList = P.$('#profile-orders');
    if (!orders.length) orderList.append(P.node('p', 'empty-state', 'No demo orders yet. Explore the shop to get started.'));
    [...orders].reverse().forEach(order => {
      const card = P.node('article', 'record-card');
      card.append(P.node('h3', '', `Demo order · ${P.money(order.total)}`), P.node('p', 'small muted', new Date(order.createdAt).toLocaleString('en-GB')));
      const list = P.node('ul');
      order.items.forEach(item => list.append(P.node('li', '', `${item.name} × ${item.quantity} — ${P.money(item.price * item.quantity)}`)));
      card.append(list, P.node('p', 'small muted', 'Saved for demonstration. No payment taken.'));
      orderList.append(card);
    });
  }
  // Revalidate on back/forward cache restoration and cross-tab login/logout.
  addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  addEventListener('storage', event => { if (['pawhavenSession', 'pawhavenUsers'].includes(event.key)) location.reload(); });
})();
