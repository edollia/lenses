// ─── SHARED ICON SYSTEM ───────────────────────────────────
const SITE_ICONS = {
  glasses: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12.5h3m13 0h3M8.8 9.7l3.2 2.8 3.2-2.8"/><circle cx="6.5" cy="13.5" r="4"/><circle cx="17.5" cy="13.5" r="4"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8.5 12h7M8.5 16h5"/></svg>',
  message: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v8Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>',
  package: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3.5 7 8.5 4.5L20.5 7M12 21V11.5"/><path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z"/></svg>',
  target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 4.5C12 4.5 6 8.5 6 14c0 2.8 2 5 4.8 5 5.5 0 8.7-6.7 8.7-14.5Z"/><path d="M4 21c2.5-5.5 6-8.5 11-11"/></svg>',
  card: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L8 8m4-4 4 4"/><path d="M5 14v5h14v-5"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>'
};

function siteIcon(name, className = 'site-icon') {
  return `<span class="${className}">${SITE_ICONS[name] || SITE_ICONS.glasses}</span>`;
}

function initInlineIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = SITE_ICONS[el.dataset.icon] || SITE_ICONS.glasses;
    el.classList.add('site-icon');
  });
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// ─── SHARED CART SYSTEM ───────────────────────────────────
const Cart = {
  items: [],

  load() {
    try {
      const raw = sessionStorage.getItem('lensify_cart');
      this.items = raw ? JSON.parse(raw) : [];
    } catch { this.items = []; }
    this.updateBadge();
  },

  save() {
    sessionStorage.setItem('lensify_cart', JSON.stringify(this.items));
    this.updateBadge();
  },

  add(item) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    this.items.push({ ...item, id });
    this.save();
  },

  remove(id) {
    const removed = this.items.find(i => String(i.id) === String(id));
    this.items = this.items.filter(i => String(i.id) !== String(id));
    this.save();
    if (removed) {
      window.dispatchEvent(new CustomEvent('cart:item-remove', { detail: { item: removed } }));
    }
  },

  total() {
    return roundMoney(this.items.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 0)), 0));
  },

  count() {
    return this.items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0);
  },

  updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const c = this.count();
    badges.forEach(b => {
      b.textContent = c;
      b.style.display = c > 0 ? 'flex' : 'none';
    });
    const cartBtn = document.querySelectorAll('.nav-cart-count');
    cartBtn.forEach(el => el.textContent = c > 0 ? `(${c})` : '');
  }
};

// Mobile nav toggle
function initMobileNav() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  // Close on outside click
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

// Cart sidebar open/close
function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (sidebar) {
    renderCartSidebar();
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (sidebar) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function startCheckout() {
  if (typeof openCheckoutModal === 'function') {
    openCheckoutModal();
    return;
  }
  window.location.href = '/product/#checkout';
}

function ensureCheckoutAction(footer) {
  let action = footer.querySelector('[data-cart-checkout-action], button[onclick*="openCheckoutModal"]');
  if (!action) {
    action = document.createElement('button');
    action.className = 'btn-primary';
    action.style.marginBottom = '0.75rem';
    const note = footer.querySelector('.cart-checkout-note');
    footer.insertBefore(action, note || null);
  }
  action.type = 'button';
  action.dataset.cartCheckoutAction = 'true';
  action.innerHTML = `Proceed to Checkout ${siteIcon('arrow', 'button-icon')}`;
  action.onclick = startCheckout;
}

function cartPrescriptionFiles(item) {
  const data = item?.orderData || {};
  const details = Array.isArray(data.uploaded_file_details) ? data.uploaded_file_details : [];
  if (details.length) return details.map(file => file?.name).filter(Boolean);
  if (Array.isArray(data.files) && data.files.length) return data.files.filter(Boolean);
  if (Array.isArray(data.uploaded_files) && data.uploaded_files.length) {
    return data.uploaded_files.map(path => String(path).split('_').slice(2).join('_') || 'Prescription file');
  }
  return [];
}

function renderCartSidebar() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;
  body.textContent = '';

  if (Cart.items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cart-empty';
    const icon = document.createElement('div');
    icon.className = 'cart-empty-icon';
    icon.innerHTML = SITE_ICONS.glasses;
    const text = document.createElement('p');
    text.textContent = 'Your cart is empty';
    const link = document.createElement('a');
    link.href = '/shop/';
    link.style.cssText = 'color:var(--rose-deep);font-size:0.8rem;';
    link.textContent = 'Browse our lenses →';
    empty.append(icon, text, link);
    body.appendChild(empty);
    if (footer) footer.style.display = 'none';
    return;
  }

  Cart.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.id = item.id;

    const icon = document.createElement('div');
    icon.className = 'cart-item-img';
    icon.innerHTML = SITE_ICONS.glasses;

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const name = document.createElement('div');
    name.className = 'cart-item-name';
    name.textContent = item.name || 'Custom lenses';

    const meta = document.createElement('div');
    meta.className = 'cart-item-meta';
    meta.textContent = [item.model, item.lensType, item.vision].filter(Boolean).join(' · ');

    const files = cartPrescriptionFiles(item);
    const fileMeta = document.createElement('div');
    fileMeta.className = 'cart-item-files';
    fileMeta.textContent = item.vision === 'Non-Prescription'
      ? 'No prescription needed'
      : files.length
        ? `Prescription attached: ${files.join(', ')}`
        : 'No prescription file attached';

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = '$' + (((Number(item.price) || 0) * (Number(item.qty) || 0)).toFixed(2));

    info.append(name, meta, fileMeta, price);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cart-item-remove';
    remove.setAttribute('aria-label', `Remove ${item.name || 'item'} from cart`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      Cart.remove(item.id);
      renderCartSidebar();
    });

    row.append(icon, info, remove);
    body.appendChild(row);
  });

  if (footer) {
    footer.style.display = 'block';
    ensureCheckoutAction(footer);
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '$' + Cart.total().toFixed(2);
  }
}

function initButtonDefaults() {
  document.querySelectorAll('button:not([type])').forEach(btn => {
    if (!btn.closest('form')) btn.type = 'button';
  });
  document.querySelectorAll('.cart-close').forEach(btn => {
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Close cart');
  });
  document.querySelectorAll('.info-modal-close').forEach(btn => {
    if (!btn.getAttribute('aria-label')) btn.setAttribute('aria-label', 'Close dialog');
  });
}

function initKeyboardActivators() {
  document.querySelectorAll('.gallery-thumb, .model-option, .lens-card, .color-swatch').forEach(el => {
    if (el.tagName === 'BUTTON' || el.tagName === 'A') return;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
}

function closeOpenModals() {
  document.querySelectorAll('.info-modal.open').forEach(modal => modal.classList.remove('open'));
}

let toastTimer = null;

// Toast notification
function showToast(msg, sub, options = {}) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    toast.innerHTML = `${siteIcon('check', 'toast-icon')}<div class="toast-text"><strong id="toastMsg"></strong><span id="toastSub"></span></div>`;
    document.body.appendChild(toast);
  }
  document.getElementById('toastMsg').textContent = msg;
  document.getElementById('toastSub').textContent = sub || '';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  const duration = Number(options.duration) || 3000;
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', () => {
  initInlineIcons();
  Cart.load();
  initMobileNav();
  initButtonDefaults();
  initKeyboardActivators();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCart();
      closeOpenModals();
    }
  });
});
