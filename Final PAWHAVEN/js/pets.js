(() => {
  'use strict';
  const P = window.Paw;
  const pets = [
    { id: 'milo', name: 'Milo', species: 'dog', age: '2 years', description: 'Playful · friendly', image: 'card3.jpg', tags: ['Vaccinated', 'Trained'] },
    { id: 'aila', name: 'Aila', species: 'cat', age: '1 year', description: 'Calm · affectionate', image: 'cat.jpg', tags: ['Healthy', 'Indoor'] },
    { id: 'buddy', name: 'Buddy', species: 'dog', age: '3 years', description: 'Energetic · loyal', image: 'dog2.jpg', tags: ['Active', 'Friendly'] }
  ];
  let species = P.read('pawhavenPetFilter', 'all');
  if (!['dog', 'cat'].includes(species)) species = 'all';
  function card(pet) {
    const article = P.node('article', 'col-12 col-md-6 col-lg-4');
    const panel = P.node('div', 'card h-100');
    const image = P.node('img'); image.src = `images/${pet.image}`; image.alt = `${pet.name} the ${pet.species}`; image.loading = 'lazy'; image.onerror = () => { image.onerror = null; image.src = pet.species === 'cat' ? 'images/cat.jpg' : 'images/dog2.jpg'; };
    const body = P.node('div', 'card-body');
    body.append(P.node('h3', '', `${pet.name} · ${pet.species === 'dog' ? 'Dog' : 'Cat'}`), P.node('p', 'muted', `${pet.age} · ${pet.description}`));
    const tags = P.node('div', 'pill-list'); pet.tags.forEach(tag => tags.append(P.node('span', 'pill', tag)));
    const link = P.node('a', 'btn btn-primary', 'Meet this pet'); link.href = `adoption.html?pet=${pet.id}`;
    const saved = P.userItems('favorites').includes(pet.id);
    const button = P.node('button', 'btn btn-outline-primary save-pet', saved ? '♥ Saved' : '♡ Save pet');
    button.type = 'button'; button.dataset.pet = pet.id; button.setAttribute('aria-pressed', String(saved)); button.setAttribute('aria-label', `${saved ? 'Unsave' : 'Save'} ${pet.name}`);
    body.append(tags, link, button); panel.append(image, body); article.append(panel); return article;
  }
  function renderPets() {
    const grid = P.$('#pet-grid');
    if (grid) {
      const visible = pets.filter(pet => species === 'all' || pet.species === species);
      grid.replaceChildren(...visible.map(card));
      P.$('#pet-status').textContent = `${visible.length} pet${visible.length === 1 ? '' : 's'} to meet. Demo profiles.`;
      P.$$('.pet-filter').forEach(button => { const active = button.dataset.species === species; button.setAttribute('aria-pressed', String(active)); button.classList.toggle('btn-primary', active); button.classList.toggle('btn-outline-primary', !active); });
    }
    const savedGrid = P.$('#saved-pets');
    if (savedGrid) {
      const saved = pets.filter(pet => P.userItems('favorites').includes(pet.id));
      savedGrid.replaceChildren(...saved.map(card));
      if (!saved.length) savedGrid.append(P.node('p', 'empty-state', 'No saved pets yet. Tap Save pet on a profile you like.'));
    }
  }
  P.$$('.pet-filter').forEach(button => button.addEventListener('click', () => { species = button.dataset.species; P.write('pawhavenPetFilter', species); renderPets(); }));
  document.addEventListener('click', event => {
    const button = event.target.closest('.save-pet'); if (!button) return;
    if (!P.currentUser()) { location.href = 'login.html?next=pets.html'; return; }
    const favorites = P.userItems('favorites');
    const next = favorites.includes(button.dataset.pet) ? favorites.filter(id => id !== button.dataset.pet) : [...favorites, button.dataset.pet];
    if (P.write(P.userKey('favorites'), next)) { renderPets(); P.$(`[data-pet="${button.dataset.pet}"]`)?.focus(); P.toast('Saved pets updated.'); }
  });
  renderPets();
  const selected = pets.find(pet => pet.id === new URLSearchParams(location.search).get('pet'));
  if (selected && P.$('#adoption-selection')) {
    P.$('#adoption-selection').textContent = `Ready to meet ${selected.name}?`;
    P.$('#adoption-request-link').href = `contact.html?topic=adoption&pet=${selected.id}`;
  }
})();
