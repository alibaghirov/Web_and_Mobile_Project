(function () {
  'use strict';
   const STORAGE_KEY = 'venue-ticketing-cart-v1';
  const SEAT = VENUE.seat.size;
  const PITCH = SEAT + VENUE.seat.gap;
  const WORLD_W = VENUE.world.width;
  const WORLD_H = VENUE.world.height;
  const PAN_STEP = 90;          
  const ZOOM_STEP = 1.25;       
  const PAN_MARGIN = 60;        
 
  const $ = (sel) => document.querySelector(sel);
  const money = (n) => '$' + n.toLocaleString('en-US');
 
  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((key) => {
        if (key === 'class') node.className = props[key];
        else if (key === 'text') node.textContent = props[key];
        else if (key === 'dataset') Object.assign(node.dataset, props[key]);
        else if (key === 'style') Object.assign(node.style, props[key]);
        else node.setAttribute(key, props[key]);
      });
    }
    (children || []).forEach((c) => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return node;
  }
 
  function seededRandom(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }

  function buildModel(venue) {
    const seats = [];
    const byId = new Map();
    const sections = [];
    const forced = new Set(venue.unavailable.forced || []);
 
    venue.sections.forEach((sec) => {
      const category = venue.categories[sec.category];
      const aisles = sec.aisleAfter || [];
      const curve = sec.curve || 0;
      const sectionSeats = [];
 
      for (let r = 0; r < sec.rows; r++) {
        const rowLetter = String.fromCharCode(65 + sec.rowStart + r);
        for (let c = 0; c < sec.cols; c++) {
          const number = c + 1;
          const gaps = aisles.filter((a) => a <= c).length;
          const d = c - (sec.cols - 1) / 2;
          const id = sec.id + '-' + rowLetter + number;
 
          const seat = {
            id: id,
            sectionId: sec.id,
            sectionName: sec.name,
            categoryKey: sec.category,
            categoryLabel: category.label,
            price: category.price,
            color: category.color,
            row: rowLetter,
            number: number,
            x: Math.round(sec.x + c * PITCH + gaps * VENUE.seat.aisleWidth),
            y: Math.round(sec.y + r * PITCH - curve * d * d),
            unavailable:
              forced.has(id) ||
              seededRandom(venue.unavailable.seed + id) < venue.unavailable.ratio
          };
          seats.push(seat);
          byId.set(id, seat);
          sectionSeats.push(seat);
        }
      }
 
      sections.push({
        def: sec,
        category: category,
        seats: sectionSeats,
        width: sec.cols * PITCH - VENUE.seat.gap + aisles.length * VENUE.seat.aisleWidth
      });
    });
 
    return { seats: seats, byId: byId, sections: sections };
}
 
  const model = buildModel(VENUE);
 
  const state = {
    inspectedId: null,
    cart: [],                         
    view: { scale: 1, x: 0, y: 0, min: 0.2, max: 3, fit: 1, isDefault: true }
  };
  const seatEls = new Map();
 
  const viewport = $('#viewport');
  const world = $('#world');
  const detailsBody = $('#details-body');
  const cartList = $('#cart-list');
  const statusLive = $('#status');

  function renderVenue() {
    world.style.width = WORLD_W + 'px';
    world.style.height = WORLD_H + 'px';
    document.documentElement.style.setProperty('--seat', SEAT + 'px');
 
    const frag = document.createDocumentFragment();
 
    const st = VENUE.stage;
    frag.appendChild(el('div', {
      class: 'stage', text: st.label,
      style: { left: st.x + 'px', top: st.y + 'px', width: st.width + 'px', height: st.height + 'px' }
    }));
 
    VENUE.landmarks.forEach((lm) => {
      frag.appendChild(el('div', {
        class: 'landmark', text: lm.label,
        style: { left: lm.x + 'px', top: lm.y + 'px', width: lm.width + 'px', height: lm.height + 'px' }
      }));
    });
 
    model.sections.forEach((section) => {
      const minY = Math.min.apply(null, section.seats.map((s) => s.y));
      frag.appendChild(el('div', {
        class: 'section-label',
        style: { left: (section.def.x + section.width / 2) + 'px', top: (minY - 36) + 'px' }
      }, [
        section.def.name,
        el('small', { text: section.category.label + ' · ' + money(section.category.price) })
      ]));
 
      for (let r = 0; r < section.def.rows; r++) {
        const rowFirst = section.seats[r * section.def.cols];
        frag.appendChild(el('div', {
          class: 'row-label', text: rowFirst.row,
          style: { left: (rowFirst.x - 20) + 'px', top: rowFirst.y + 'px' }
        }));
      }
 
      section.seats.forEach((seat) => {
        const btn = el('button', {
          type: 'button',
          class: 'seat',
          dataset: { id: seat.id },
          style: { left: seat.x + 'px', top: seat.y + 'px' }
        });
        btn.style.setProperty('--cat-color', seat.color);
        seatEls.set(seat.id, btn);
        frag.appendChild(btn);
        updateSeat(seat.id);
      });
    });
 
    world.appendChild(frag);
  }
 
  function seatLabel(seat) {
    return seat.sectionName + ', row ' + seat.row + ', seat ' + seat.number;
  }
 
  function seatStatus(seat) {
    if (seat.unavailable) return 'unavailable';
    if (state.cart.indexOf(seat.id) !== -1) return 'incart';
    return 'available';
  }
 
  const STATUS_TEXT = { available: 'Available', incart: 'In your cart', unavailable: 'Unavailable' };
 
  function updateSeat(id) {
    if (!id) return;
    const seat = model.byId.get(id);
    const btn = seatEls.get(id);
    if (!seat || !btn) return;
    const status = seatStatus(seat);
    const inspected = state.inspectedId === id;
    btn.dataset.state = status;
    btn.classList.toggle('is-inspected', inspected);
    btn.setAttribute('aria-pressed', inspected ? 'true' : 'false');
    const label = seatLabel(seat) + ', ' + money(seat.price) + ', ' + STATUS_TEXT[status].toLowerCase();
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }
 
  function renderLegend() {
    const ul = $('#legend-categories');
    Object.keys(VENUE.categories).forEach((key) => {
      const cat = VENUE.categories[key];
      const sw = el('span', { class: 'swatch' });
      sw.style.setProperty('--cat-color', cat.color);
      ul.appendChild(el('li', null, [sw, cat.label + ' – ' + money(cat.price)]));
    });
  }
 /* ------------------------------------------------------
     4. Seat inspection (click = inspect only)
     ------------------------------------------------------ */
  function inspect(id) {
    const previous = state.inspectedId;
    state.inspectedId = id;
    updateSeat(previous);
    updateSeat(id);
    renderDetails();
    if (id) {
      const seat = model.byId.get(id);
      announce(seatLabel(seat) + ', ' + money(seat.price) + ', ' + STATUS_TEXT[seatStatus(seat)].toLowerCase());
    }
  }
 
  function renderDetails(message) {
    detailsBody.replaceChildren();
    const seat = state.inspectedId ? model.byId.get(state.inspectedId) : null;
 
    if (!seat) {
      detailsBody.appendChild(el('p', { class: 'empty', text: 'Click any seat on the map to see its details and price. Nothing is added until you press ADD TO CART.' }));
      return;
    }
 
    const status = seatStatus(seat);
    const catDot = el('span', { class: 'cat-dot' });
    catDot.style.setProperty('--cat-color', seat.color);
 
    const dl = el('dl', { class: 'detail-list' }, [
      el('dt', { text: 'Section' }), el('dd', { text: seat.sectionName }),
      el('dt', { text: 'Row' }), el('dd', { text: seat.row }),
      el('dt', { text: 'Seat' }), el('dd', { text: String(seat.number) }),
      el('dt', { text: 'Category' }), el('dd', null, [catDot, seat.categoryLabel]),
      el('dt', { text: 'Price' }), el('dd', { class: 'price-big', text: money(seat.price) }),
      el('dt', { text: 'Status' }), el('dd', null, [
        el('span', { class: 'badge', dataset: { state: status }, text: STATUS_TEXT[status] })
      ])
    ]);
    detailsBody.appendChild(dl);
 
    const actions = el('div', { class: 'detail-actions' });
    const addBtn = el('button', { type: 'button', class: 'btn btn-primary', id: 'add-to-cart', text: 'ADD TO CART' });
    if (status === 'unavailable') {
      addBtn.disabled = true;
      addBtn.textContent = 'UNAVAILABLE';
    } else if (status === 'incart') {
      addBtn.disabled = true;
      addBtn.textContent = 'ALREADY IN CART';
    }
    addBtn.addEventListener('click', () => addToCart(seat.id));
    actions.appendChild(addBtn);
 
    if (status === 'incart') {
      const rm = el('button', { type: 'button', class: 'btn btn-danger', text: 'Remove from cart' });
      rm.addEventListener('click', () => removeFromCart(seat.id));
      actions.appendChild(rm);
    }
    detailsBody.appendChild(actions);
 
    if (message) {
      detailsBody.appendChild(el('p', { class: 'message ' + (message.kind || ''), text: message.text }));
    }
  }
 
  function announce(text) {
    statusLive.textContent = '';
    statusLive.textContent = text;
  }
 
  /* ------------------------------------------------------
     5. Cart (add / remove / render / persist)
     ------------------------------------------------------ */
  function addToCart(id) {
    const seat = model.byId.get(id);
    if (!seat) return;
 
    if (seat.unavailable) {
      renderDetails({ kind: 'error', text: 'This seat is unavailable and cannot be added.' });
      return;
    }
    if (state.cart.indexOf(id) !== -1) {            // duplicate prevention
      renderDetails({ kind: 'error', text: 'This seat is already in your cart.' });
      return;
    }
 
    state.cart.push(id);
    saveCart();
    updateSeat(id);
    renderCart();
    renderDetails({ kind: 'ok', text: seatLabel(seat) + ' added to cart.' });
    announce(seatLabel(seat) + ' added to cart. Total ' + money(cartTotal()));
  }
 
  function removeFromCart(id) {
    const index = state.cart.indexOf(id);
    if (index === -1) return;
    state.cart.splice(index, 1);
    saveCart();
    updateSeat(id);                                 // map updates immediately
    renderCart();
    if (state.inspectedId === id) {
      renderDetails({ kind: '', text: 'Ticket removed from cart.' });
    }
    announce('Ticket removed. Total ' + money(cartTotal()));
  }
 
  function clearCart() {
    const ids = state.cart.slice();
    state.cart = [];
    saveCart();
    ids.forEach(updateSeat);
    renderCart();
    if (state.inspectedId) renderDetails();
    announce('Cart cleared.');
  }
 
  function cartTotal() {
    return state.cart.reduce((sum, id) => sum + model.byId.get(id).price, 0);
  }
 
  function renderCart() {
    cartList.replaceChildren();
 
    if (state.cart.length === 0) {
      cartList.appendChild(el('li', { class: 'empty', text: 'Your cart is empty.' }));
    }
 
    state.cart.forEach((id) => {
      const seat = model.byId.get(id);
      const item = el('li', { class: 'cart-item' }, [
        el('span', { class: 'name', text: seat.sectionName + ' · Row ' + seat.row + ' · Seat ' + seat.number }),
        el('span', { class: 'price', text: money(seat.price) }),
        el('span', { class: 'meta', text: seat.categoryLabel })
      ]);
      item.style.setProperty('--cat-color', seat.color);
      const rm = el('button', {
        type: 'button', class: 'btn btn-small btn-danger', text: 'Remove',
        'aria-label': 'Remove ' + seatLabel(seat) + ' from cart'
      });
      rm.addEventListener('click', () => removeFromCart(id));
      item.appendChild(rm);
      cartList.appendChild(item);
    });
 
    const total = cartTotal();
    $('#cart-count').textContent = String(state.cart.length);
    $('#cart-total').textContent = money(total);
    $('#header-count').textContent = String(state.cart.length);
    $('#header-total').textContent = money(total);
    $('#clear-cart').disabled = state.cart.length === 0;
  }
 
  /* ---------- localStorage ---------- */
  function showStorageNote(text) {
    const note = $('#storage-note');
    note.textContent = text;
    note.hidden = !text;
  }
 
  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: state.cart }));
      showStorageNote('');
    } catch (err) {
      showStorageNote('Your browser blocked storage, so the cart will not survive a refresh.');
    }
  }
 
  function loadCart() {
    let list = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      list = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      return [];                                     // corrupt data => start empty
    }
    const seen = new Set();
    const valid = [];
    list.forEach((id) => {
      const seat = typeof id === 'string' ? model.byId.get(id) : null;
      if (seat && !seat.unavailable && !seen.has(id)) {   // ignore unknown, unavailable, duplicates
        seen.add(id);
        valid.push(id);
      }
    });
    return valid;
  }
 
  /* ------------------------------------------------------
     6. Map navigation: zoom / pan / reset
     ------------------------------------------------------ */
  const view = state.view;
 
  function clampAxis(pos, viewportSize, contentSize) {
    let lo, hi;
    if (contentSize + 2 * PAN_MARGIN > viewportSize) {
      lo = viewportSize - contentSize - PAN_MARGIN;
      hi = PAN_MARGIN;
    } else {
      lo = PAN_MARGIN;
      hi = viewportSize - contentSize - PAN_MARGIN;
    }
    return Math.min(hi, Math.max(lo, pos));
  }
 
  function clampView() {
    view.scale = Math.min(view.max, Math.max(view.min, view.scale));
    view.x = clampAxis(view.x, viewport.clientWidth, WORLD_W * view.scale);
    view.y = clampAxis(view.y, viewport.clientHeight, WORLD_H * view.scale);
  }
 
  function applyView() {
    clampView();
    world.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.scale + ')';
    $('#zoom-readout').textContent = Math.round((view.scale / view.fit) * 100) + '%';
    document.querySelector('[data-action="zoom-in"]').disabled = view.scale >= view.max - 1e-6;
    document.querySelector('[data-action="zoom-out"]').disabled = view.scale <= view.min + 1e-6;
  }
 
  function computeLimits() {
    const w = viewport.clientWidth || 800;
    const h = viewport.clientHeight || 600;
    view.fit = Math.min(w / WORLD_W, h / WORLD_H) * 0.98;
    view.min = view.fit * 0.6;
    view.max = Math.max(3, view.fit * 4);
  }
 
  function resetView() {
    computeLimits();
    view.scale = view.fit;
    view.x = (viewport.clientWidth - WORLD_W * view.scale) / 2;
    view.y = (viewport.clientHeight - WORLD_H * view.scale) / 2;
    view.isDefault = true;
    applyView();
  }
 
  // Zoom keeping the screen point (cx, cy) fixed
  function zoomAt(factor, cx, cy) {
    const newScale = Math.min(view.max, Math.max(view.min, view.scale * factor));
    const ratio = newScale / view.scale;
    view.x = cx - (cx - view.x) * ratio;
    view.y = cy - (cy - view.y) * ratio;
    view.scale = newScale;
    view.isDefault = false;
    applyView();
  }
 
  function zoomCenter(factor) {
    zoomAt(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  }
 
  // "Move Up" moves the camera up, so the map slides down (and so on)
  function panBy(dx, dy) {
    view.x += dx;
    view.y += dy;
    view.isDefault = false;
    applyView();
  }
 
  const ACTIONS = {
    'zoom-in': () => zoomCenter(ZOOM_STEP),
    'zoom-out': () => zoomCenter(1 / ZOOM_STEP),
    'move-up': () => panBy(0, PAN_STEP),
    'move-down': () => panBy(0, -PAN_STEP),
    'move-left': () => panBy(PAN_STEP, 0),
    'move-right': () => panBy(-PAN_STEP, 0),
    'reset': resetView
  };
 
  /* ---------- Bonus: mouse wheel zoom + drag panning ---------- */
  const DRAG_THRESHOLD = 5;
  let drag = null;
  let suppressClick = false;
 
  

  
})();
 