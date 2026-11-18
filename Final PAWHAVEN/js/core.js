/* Shared helpers. All persistent keys belong to this demo; other storage is untouched. */
(() => {
  'use strict';
  const P = window.Paw = {};
  P.$ = (selector, scope = document) => scope.querySelector(selector);
  P.$$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  P.node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  P.storageWarning = () => {
    if (P.$('#storage-warning')) return;
    const note = P.node('p', 'storage-warning', 'Browser storage is unavailable or damaged. Allow site storage to save accounts and changes.');
    note.id = 'storage-warning';
    note.setAttribute('role', 'alert');
    document.body.prepend(note);
  };
  P.read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch { P.storageWarning(); return fallback; }
  };
  P.write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { P.storageWarning(); return false; }
  };
  P.remove = key => {
    try { localStorage.removeItem(key); return true; }
    catch { P.storageWarning(); return false; }
  };
  P.accounts = () => {
    const users = P.read('pawhavenUsers', []);
    return Array.isArray(users) ? users.filter(user => user && typeof user.email === 'string') : [];
  };
  P.currentUser = () => {
    const email = P.read('pawhavenSession', null);
    return P.accounts().find(user => user.email === email) || null;
  };
  P.userKey = (kind, user = P.currentUser()) => user ? `pawhaven:${kind}:${user.email}` : null;
  P.userItems = kind => {
    const key = P.userKey(kind);
    const value = key ? P.read(key, []) : [];
    return Array.isArray(value) ? value : [];
  };
  P.returnPage = () => {
    const next = new URLSearchParams(location.search).get('next');
    // Fixed allowlist prevents external or javascript: redirects.
    return ['profile.html', 'cart.html', 'contact.html', 'pets.html'].includes(next) ? next : 'profile.html';
  };
  P.money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  P.feedback = (id, message, error = false) => {
    const element = P.$(id);
    if (element) { element.textContent = message; element.classList.toggle('is-error', error); }
  };
  P.toast = message => {
    const element = P.$('#jquery-toast');
    if (window.jQuery) window.jQuery(element).stop(true, true).text(message).fadeIn(120).delay(2200).fadeOut(250);
    else { element.textContent = message; element.style.display = 'block'; clearTimeout(P.toastTimer); P.toastTimer = setTimeout(() => { element.style.display = 'none'; }, 2500); }
  };
  P.busy = (form, busy, label = 'Please wait…') => {
    const button = P.$('button[type="submit"]', form);
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? label : button.dataset.label;
    form.setAttribute('aria-busy', String(busy));
  };
  P.validators = {
    name: value => value.trim().length >= 2 && value.trim().length <= 80 ? '' : 'Enter a name with 2–80 characters.',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) && value.trim().length <= 254 ? '' : 'Enter a valid email, for example alex@example.com.',
    phone: value => /^\+?[\d\s()-]+$/.test(value.trim()) && /^\+[1-9]\d{9,14}$/.test(value.replace(/[\s()-]/g, '')) ? '' : 'Use + and 10–15 digits, for example +7 700 123 45 67.',
    password: value => value.length >= 8 && value.length <= 64 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value) && !/\s/.test(value) ? '' : 'Use 8–64 characters: uppercase, lowercase, number and symbol; no spaces.',
    message: value => value.trim().length >= 10 && value.trim().length <= 2000 ? '' : 'Write a message with 10–2000 characters.'
  };
  P.validate = (form, rules) => {
    let firstInvalid;
    for (const [id, rule] of Object.entries(rules)) {
      const input = P.$(`#${id}`, form);
      const error = rule(input.value);
      input.setAttribute('aria-invalid', String(Boolean(error)));
      P.$(`#${id}-error`, form).textContent = error;
      if (error && !firstInvalid) firstInvalid = input;
    }
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  };
  P.wireValidation = (form, rules) => {
    for (const [id, rule] of Object.entries(rules)) {
      const input = P.$(`#${id}`, form);
      const check = () => {
        const error = rule(input.value);
        input.setAttribute('aria-invalid', String(Boolean(error)));
        P.$(`#${id}-error`, form).textContent = error;
      };
      input.addEventListener('blur', check);
      input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') check(); });
    }
  };
})();
