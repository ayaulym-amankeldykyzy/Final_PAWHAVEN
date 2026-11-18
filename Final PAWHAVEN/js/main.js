/* Shared navigation, theme and the retained Assignment 6 UI interactions. */
(() => {
  'use strict';
  const P = window.Paw;
  const themeButton = P.$('#theme-toggle');
  function applyTheme(night) {
    document.documentElement.dataset.theme = night ? 'night' : 'day';
    document.documentElement.setAttribute('data-bs-theme', night ? 'dark' : 'light');
    document.body.classList.toggle('theme-night', night);
    themeButton.textContent = night ? 'Light mode' : 'Dark mode';
    themeButton.setAttribute('aria-pressed', String(night));
  }
  applyTheme(document.documentElement.dataset.theme === 'night');
  themeButton.addEventListener('click', () => {
    const night = !document.body.classList.contains('theme-night');
    applyTheme(night);
    try { localStorage.setItem('pawhavenTheme', night ? 'night' : 'day'); } catch { P.storageWarning(); }
  });
  const user = P.currentUser();
  P.$$('.account-link').forEach(link => { link.href = user ? 'profile.html' : 'login.html'; link.textContent = user ? 'My profile' : 'Log in'; });

  let sound = P.read('pawhavenSoundEnabled', false);
  let audio;
  const soundButton = P.$('#sound-toggle');
  const renderSound = () => { soundButton.textContent = `Sound: ${sound ? 'On' : 'Off'}`; soundButton.setAttribute('aria-pressed', String(sound)); };
  P.playSound = () => {
    if (!sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audio = audio || new Audio();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.04, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + 0.13);
    } catch { /* Audio is optional; the visual feedback is always available. */ }
  };
  renderSound();
  soundButton.addEventListener('click', () => { sound = !sound; P.write('pawhavenSoundEnabled', sound); renderSound(); P.playSound(); });
  const updateClock = () => { P.$('#live-clock').textContent = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); };
  updateClock(); setInterval(updateClock, 30000);

  function scrollProgress() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    P.$('#scroll-progress span').style.width = `${distance > 0 ? scrollY / distance * 100 : 0}%`;
  }
  addEventListener('scroll', scrollProgress, { passive: true });
  addEventListener('resize', scrollProgress); scrollProgress();
  const faq = P.$('#faq-container');
  if (faq) {
    faq.innerHTML = '<div class="section-head"><div><span class="eyebrow">Good to know</span><h2 id="faq-heading">Frequently asked questions</h2></div></div>';
    const questions = [
      ['How can I start an adoption enquiry?', 'Choose a pet on Our Pets, open the adoption guide and select Start a request. Log in to save the demo enquiry to your profile.'],
      ['Can I buy products here?', 'This is a student demo. You can add products to a basket and save a demo order, but there is no payment or delivery.'],
      ['Where is my information saved?', 'Your demo account, saved pets and enquiries stay in this browser on this device. Clearing site data removes them.']
    ];
    questions.forEach(([question, answer]) => {
      const details = P.node('details', 'faq-item');
      details.append(P.node('summary', 'faq-question', question), P.node('p', 'faq-detail', answer));
      faq.append(details);
    });
  }
  const readMore = P.$('#read-more-team');
  if (readMore) readMore.addEventListener('click', () => {
    const extra = P.$('#team-story-extra'); extra.hidden = !extra.hidden;
    readMore.textContent = extra.hidden ? 'Read more' : 'Read less'; readMore.setAttribute('aria-expanded', String(!extra.hidden));
  });
  P.$$('.copy-button').forEach(button => button.addEventListener('click', async () => {
    const text = P.$(button.dataset.copyTarget).textContent.trim();
    try { await navigator.clipboard.writeText(text); P.toast('Care tip copied.'); }
    catch { P.toast('Copy is unavailable. Select the tip text and copy it manually.'); }
  }));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.jQuery && !reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const counter = entry.target;
      window.jQuery({ value: 0 }).animate({ value: Number(counter.dataset.count) }, {
        duration: 900, step() { counter.textContent = Math.round(this.value); },
        complete() { counter.textContent = counter.dataset.count; }
      });
      observer.unobserve(counter);
    }));
    P.$$('.counter').forEach(counter => observer.observe(counter));
  }
})();
