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
})();
 