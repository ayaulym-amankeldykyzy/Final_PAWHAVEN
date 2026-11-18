(() => {
  'use strict';
  const P = window.Paw;
  const form = P.$('#contact-form'); if (!form) return;
  const user = P.currentUser();
  if (user) { P.$('#name').value = user.name; P.$('#email').value = user.email; P.$('#phone').value = user.phone; }
  const params = new URLSearchParams(location.search);
  if (params.get('topic') === 'adoption') P.$('#topic').value = 'adoption';
  const pet = { milo: 'Milo', aila: 'Aila', buddy: 'Buddy' }[params.get('pet')];
  if (pet) { P.$('#topic').value = 'adoption'; P.$('#message').value = `I would like to meet ${pet}. About my home: `; }
  const rules = { name: P.validators.name, email: P.validators.email, phone: P.validators.phone, topic: value => ['adoption', 'products', 'general'].includes(value) ? '' : 'Please choose a topic.', message: P.validators.message };
  P.wireValidation(form, rules);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (form.getAttribute('aria-busy') === 'true') return;
    if (!P.validate(form, rules)) { P.feedback('#contact-feedback', 'Please correct the highlighted fields.', true); return; }
    const current = P.currentUser();
    const key = current ? P.userKey('requests', current) : 'pawhavenGuestRequests';
    const existing = P.read(key, []);
    const record = { id: crypto.randomUUID(), name: P.$('#name').value.trim(), email: P.$('#email').value.trim().toLowerCase(), phone: P.$('#phone').value.replace(/[\s()-]/g, ''), topic: P.$('#topic').value, message: P.$('#message').value.trim(), createdAt: new Date().toISOString() };
    P.busy(form, true, 'Saving…');
    // A short delay makes feedback perceptible; it does not represent a network request.
    setTimeout(() => {
      if (P.write(key, [...(Array.isArray(existing) ? existing : []), record])) {
        P.feedback('#contact-feedback', current ? 'Enquiry saved in My profile. This demo did not send a message.' : 'Enquiry saved on this device as a guest. Log in before your next enquiry to see it in My profile.');
        P.$('#message').value = ''; P.$('#topic').value = '';
        P.toast('Demo enquiry saved.'); P.playSound();
      } else P.feedback('#contact-feedback', 'Could not save your enquiry. Allow browser storage and try again.', true);
      P.busy(form, false);
    }, 350);
  });
})();
