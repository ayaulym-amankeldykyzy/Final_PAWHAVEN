/* Product search filters the complete dataset BEFORE pagination. Prices use integer cents. */
(() => {
  'use strict';
  const P = window.Paw;
  const products = [
    { id: 'food', name: 'Healthy Food', category: 'food', price: 1890, image: 'food.jpg', description: 'Everyday food for your pet’s regular routine.' },
    { id: 'toy', name: 'Play Toys', category: 'toys', price: 950, image: 'toy.jpg', description: 'A colourful toy for supervised playtime.' },
    { id: 'walk', name: 'Walk Set', category: 'accessories', price: 2400, image: 'collar.jpg', description: 'A collar and lead for your daily adventures.' },
    { id: 'treat-box', name: 'Crunchy Treats', category: 'food', price: 890, image: 'https://cdn.shopify.com/s/files/1/0279/3016/5319/files/aaeb69763379464cdb47a79397c89cad.jpg?v=1727675287', description: 'A tasty reward for training and everyday moments.' },
    { id: 'grooming-kit', name: 'Grooming Essentials', category: 'accessories', price: 1590, image: 'https://d2zkwdgks3jmb3.cloudfront.net/fileadmin/shared/stores/pet_centar/Store_Pet_Centar_gross.jpg', description: 'Everyday essentials to keep your pet comfortable.' },
    { id: 'toy-bundle', name: 'Playtime Bundle', category: 'toys', price: 1790, image: 'https://uploads-ssl.webflow.com/613b798fc014efd9cb8fce0a/6398627de742b82909177074_pet-supplies-products.jpg', description: 'A fun mix of toys for active play.' },
    { id: 'care-set', name: 'Daily Care Set', category: 'accessories', price: 2190, image: 'https://www.maxrex.pet/cdn/shop/articles/pet-essentials.png?v=1761521680&width=1100', description: 'Useful supplies for your pet’s daily routine.'}
  ];
  const productById = id => products.find(product => product.id === id);
  const cart = () => {
    const saved = P.read('pawhavenCart', []);
    return Array.isArray(saved) ? saved.filter(item => item && productById(item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99) : [];
  };
  const total = items => items.reduce((sum, item) => sum + productById(item.id).price * item.quantity, 0);
  function updateCount() { P.$$('[data-cart-count]').forEach(node => { node.textContent = cart().reduce((sum, item) => sum + item.quantity, 0); }); }
  function saveCart(items) { const saved = P.write('pawhavenCart', items); if (saved) updateCount(); return saved; }
  updateCount();
  const grid = P.$('#product-grid');
  if (grid) {
    const stored = P.read('pawhavenShopFilters', {});
    let category = ['food', 'toys', 'accessories'].includes(stored?.category) ? stored.category : 'all';
    let limit = 3;
    const search = P.$('#jquery-search');
    search.value = typeof stored?.query === 'string' ? stored.query : '';
    const suggestions = P.$('#search-suggestions');
    const more = P.$('#load-more-products');
    const matches = () => products.filter(product => (category === 'all' || product.category === category) && `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search.value.trim().toLowerCase()));
    function highlighted(text) {
      const fragment = document.createDocumentFragment();
      const query = search.value.trim().toLowerCase();
      let cursor = 0;
      let index = query ? text.toLowerCase().indexOf(query) : -1;
      while (index >= 0) {
        fragment.append(document.createTextNode(text.slice(cursor, index)), P.node('mark', 'search-highlight', text.slice(index, index + query.length)));
        cursor = index + query.length;
        index = text.toLowerCase().indexOf(query, cursor);
      }
      fragment.append(document.createTextNode(text.slice(cursor)));
      return fragment;
    }
    function productCard(product) {
      const article = P.node('article', 'col-12 col-md-6 col-lg-4 product-item card-filter-in');
      const card = P.node('div', 'card h-100');
      const image = P.node('img', 'shop-card-image'); image.src = /^https?:\/\//i.test(product.image) ? product.image : `images/${product.image}`; image.alt = product.name; image.loading = 'lazy'; image.onerror = () => { image.onerror = null; image.src = 'images/hero.jpg'; };
      const body = P.node('div', 'card-body');
      const title = P.node('h3'); title.append(highlighted(product.name));
      const description = P.node('p', 'muted'); description.append(highlighted(product.description));
      const add = P.node('button', 'btn btn-primary', 'Add to basket'); add.type = 'button'; add.dataset.add = product.id; add.setAttribute('aria-label', `Add ${product.name} to basket`);
      body.append(P.node('span', 'eyebrow', product.category), title, description, P.node('p', 'price', P.money(product.price)), add);
      const rating = P.node('div', 'product-rating');
      const ratings = P.read('pawhavenRatings', {});
      const selected = Number(ratings?.[product.id]) || 0;
      rating.append(P.node('span', 'rating-label', selected ? `Your rating: ${selected}/5` : 'Rate it:'));
      for (let value = 1; value <= 5; value++) {
        const star = P.node('button', `rating-star${value <= selected ? ' is-selected' : ''}`, '★');
        star.type = 'button'; star.dataset.product = product.id; star.dataset.rating = value;
        star.setAttribute('aria-label', `Rate ${product.name} ${value} out of 5`); star.setAttribute('aria-pressed', String(value === selected));
        rating.append(star);
      }
      body.append(rating); card.append(image, body); article.append(card); return article;
    }
    function render() {
      const results = matches();
      grid.replaceChildren(...results.slice(0, limit).map(productCard));
      P.$('#shop-status').textContent = `Showing ${Math.min(limit, results.length)} of ${results.length} matching products.`;
      P.$('#shop-empty').hidden = results.length > 0;
      more.hidden = limit >= results.length;
      P.$$('.shop-filter').forEach(button => {
        const active = button.dataset.filter === category;
        button.setAttribute('aria-pressed', String(active)); button.classList.toggle('is-active', active);
        button.classList.toggle('btn-primary', active); button.classList.toggle('btn-outline-primary', !active);
      });
    }
    function saveFilters() { P.write('pawhavenShopFilters', { query: search.value, category }); }
    function suggest() {
      suggestions.replaceChildren();
      if (!search.value.trim()) return;
      matches().slice(0, 5).forEach(product => {
        const button = P.node('button', 'suggestion-item', product.name); button.type = 'button';
        button.addEventListener('click', () => { search.value = product.name; limit = 3; saveFilters(); render(); suggestions.replaceChildren(); search.focus(); });
        suggestions.append(button);
      });
    }
    search.addEventListener('input', () => { limit = 3; saveFilters(); render(); suggest(); });
    search.addEventListener('keydown', event => { if (event.key === 'Escape') suggestions.replaceChildren(); });
    document.addEventListener('click', event => { if (!event.target.closest('.jquery-search-box')) suggestions.replaceChildren(); });
    document.addEventListener('focusin', event => { if (!event.target.closest('.jquery-search-box')) suggestions.replaceChildren(); });
    P.$$('.shop-filter').forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; limit = 3; saveFilters(); render(); suggestions.replaceChildren(); }));
    P.$('#reset-search').addEventListener('click', () => { search.value = ''; category = 'all'; limit = 3; saveFilters(); render(); suggestions.replaceChildren(); });
    more.addEventListener('click', () => { limit += 3; render(); });
    // Event delegation keeps buttons working when search replaces the cards.
    grid.addEventListener('click', event => {
      const add = event.target.closest('[data-add]');
      if (add) {
        const items = cart(); const item = items.find(item => item.id === add.dataset.add);
        if (item && item.quantity >= 99) { P.toast('You can add up to 99 of each item.'); return; }
        if (item) item.quantity++; else items.push({ id: add.dataset.add, quantity: 1 });
        if (saveCart(items)) { P.toast(`${productById(add.dataset.add).name} added to basket.`); P.playSound(); }
      }
      const star = event.target.closest('[data-rating]');
      if (star) {
        const ratings = P.read('pawhavenRatings', {});
        const next = { ...(ratings && typeof ratings === 'object' ? ratings : {}), [star.dataset.product]: Number(star.dataset.rating) };
        if (P.write('pawhavenRatings', next)) { render(); P.$(`[data-product="${star.dataset.product}"][data-rating="${star.dataset.rating}"]`).focus(); P.toast('Your rating was saved.'); }
      }
    });
    render();
  }
  const cartList = P.$('#cart-items');
  function renderCart() {
    if (!cartList) return;
    const items = cart(); cartList.replaceChildren();
    if (!items.length) cartList.append(P.node('p', 'empty-state', 'Your basket is empty. Find something lovely in the shop.'));
    items.forEach(item => {
      const product = productById(item.id);
      const row = P.node('article', 'cart-row');
      const image = P.node('img'); image.src = /^https?:\/\//i.test(product.image) ? product.image : `images/${product.image}`; image.alt = product.name; image.onerror = () => { image.onerror = null; image.src = 'images/hero.jpg'; };
      const info = P.node('div', 'cart-product'); info.append(P.node('h3', '', product.name), P.node('p', 'muted', `${P.money(product.price)} each`));
      const controls = P.node('div', 'quantity-controls');
      for (const [action, text, label] of [['decrease', '−', 'Decrease quantity of'], ['increase', '+', 'Increase quantity of'], ['remove', 'Remove', 'Remove']]) {
        const button = P.node('button', 'btn btn-outline-primary btn-sm', text);
        button.type = 'button'; button.dataset.action = action; button.dataset.id = item.id; button.setAttribute('aria-label', `${label} ${product.name}`);
        if (action === 'increase' && item.quantity >= 99) button.disabled = true;
        controls.append(button);
        if (action === 'decrease') controls.append(P.node('span', 'quantity-value', String(item.quantity)));
      }
      row.append(image, info, controls, P.node('strong', '', P.money(product.price * item.quantity))); cartList.append(row);
    });
    P.$('#cart-total').textContent = `Total: ${P.money(total(items))}`;
    P.$('#checkout').disabled = !items.length; P.$('#clear-cart').disabled = !items.length;
  }
  if (cartList) {
    renderCart();
    cartList.addEventListener('click', event => {
      const button = event.target.closest('[data-action]'); if (!button) return;
      let items = cart(); const item = items.find(item => item.id === button.dataset.id); if (!item) return;
      if (button.dataset.action === 'increase') item.quantity = Math.min(99, item.quantity + 1);
      if (button.dataset.action === 'decrease') item.quantity--;
      if (button.dataset.action === 'remove') item.quantity = 0;
      items = items.filter(item => item.quantity > 0);
      if (saveCart(items)) {
        renderCart(); P.feedback('#cart-feedback', 'Basket updated.');
        const target = P.$(`[data-id="${button.dataset.id}"][data-action="${button.dataset.action}"]`) || P.$('#cart-items [data-action]') || P.$('a[href="shop.html"]', P.$('.cart-summary'));
        target.focus();
      }
    });
    P.$('#clear-cart').addEventListener('click', () => { if (saveCart([])) { renderCart(); P.feedback('#cart-feedback', 'Basket cleared.'); } });
    P.$('#checkout').addEventListener('click', () => {
      if (!P.currentUser()) { location.href = 'login.html?next=cart.html'; return; }
      const items = cart(); if (!items.length) return;
      const order = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), total: total(items), items: items.map(item => ({ ...productById(item.id), quantity: item.quantity })) };
      if (P.write(P.userKey('orders'), [...P.userItems('orders'), order])) {
        if (saveCart([])) {
          renderCart(); P.feedback('#cart-feedback', 'Demo order saved! You can view it in My profile. No payment was taken.');
          P.playSound();
        } else {
          P.$('#checkout').disabled = true;
          P.feedback('#cart-feedback', 'Order saved in your profile, but the basket could not be cleared. Do not submit it again.', true);
        }
      } else P.feedback('#cart-feedback', 'Could not save the order. Check browser storage and try again.', true);
    });
  }
  addEventListener('storage', event => { if (event.key === 'pawhavenCart') { updateCount(); renderCart(); } });
})();
