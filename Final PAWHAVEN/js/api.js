/* Public Dog CEO API: loading, timeout, validation, retry and safe image rendering. */
(() => {
  'use strict';
  const P = window.Paw;
  const select = P.$('#breed-select'); if (!select) return;
  const refresh = P.$('#refresh-dog');
  const retry = P.$('#retry-api');
  const image = P.$('#breed-image');
  const caption = P.$('#breed-caption');
  let loadedBreeds = false;
  let busy = false;
  async function getJSON(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('API response failed.');
      const data = await response.json();
      if (data.status !== 'success') throw new Error('Invalid API response.');
      return data.message;
    } finally { clearTimeout(timeout); }
  }
  function setBusy(value, message = '') {
    busy = value; select.disabled = value || !loadedBreeds; refresh.disabled = value || !loadedBreeds;
    retry.hidden = true; P.$('#breed-explorer').setAttribute('aria-busy', String(value));
    if (message) P.feedback('#api-status', message);
  }
  function showError() {
    image.hidden = true; caption.textContent = 'Photo unavailable right now.';
    P.feedback('#api-status', 'Could not load dog photos. Check your internet connection, then retry.', true);
    setBusy(false); retry.hidden = false;
  }
  async function loadPhoto() {
    if (busy || !loadedBreeds) return;
    setBusy(true, 'Loading a new dog photo…'); image.hidden = true;
    try {
      const url = await getJSON(`https://dog.ceo/api/breed/${encodeURIComponent(select.value)}/images/random`);
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'images.dog.ceo') throw new Error('Unexpected image source.');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { image.onload = null; image.onerror = null; reject(new Error('Image timeout.')); }, 10000);
        image.onload = () => { clearTimeout(timeout); image.onload = null; image.onerror = null; resolve(); };
        image.onerror = () => { clearTimeout(timeout); image.onload = null; image.onerror = null; reject(new Error('Image failed.')); };
        image.src = parsed.href;
      });
      const breed = select.options[select.selectedIndex].text;
      image.alt = `${breed} dog from Dog CEO community photos`; image.hidden = false;
      caption.textContent = `${breed} · Dog CEO community photo`;
      P.write('pawhavenBreed', select.value);
      P.feedback('#api-status', 'Photo loaded. Choose another breed or try another photo.'); setBusy(false);
    } catch { showError(); }
  }
  async function loadBreeds() {
    if (busy) return;
    setBusy(true, 'Loading dog breeds…');
    try {
      const data = await getJSON('https://dog.ceo/api/breeds/list/all');
      if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('Invalid breed list.');
      const breeds = Object.keys(data).filter(breed => /^[a-z]+$/.test(breed)).sort();
      if (!breeds.length) throw new Error('Empty breed list.');
      select.replaceChildren();
      breeds.forEach(breed => { const option = P.node('option', '', breed[0].toUpperCase() + breed.slice(1)); option.value = breed; select.append(option); });
      const saved = P.read('pawhavenBreed', 'labrador');
      if (breeds.includes(saved)) select.value = saved;
      loadedBreeds = true; setBusy(false); await loadPhoto();
    } catch { showError(); }
  }
  refresh.addEventListener('click', loadPhoto);
  select.addEventListener('change', loadPhoto);
  retry.addEventListener('click', () => loadedBreeds ? loadPhoto() : loadBreeds());
  loadBreeds();
})();
