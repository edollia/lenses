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
    return this.items.reduce((sum, i) => sum + ((Number(i.price) || 0) * (Number(i.qty) || 0)), 0);
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
  action.textContent = 'Proceed to Checkout ✦';
  action.onclick = startCheckout;
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
    icon.style.cssText = 'font-size:2.5rem;margin-bottom:1rem;';
    icon.textContent = '🌸';
    const text = document.createElement('p');
    text.textContent = 'Your cart is empty';
    const link = document.createElement('a');
    link.href = '/product/';
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
    icon.textContent = '🕶️';

    const info = document.createElement('div');
    info.className = 'cart-item-info';

    const name = document.createElement('div');
    name.className = 'cart-item-name';
    name.textContent = item.name || 'Custom lenses';

    const meta = document.createElement('div');
    meta.className = 'cart-item-meta';
    meta.textContent = [item.model, item.lensType, item.vision].filter(Boolean).join(' · ');

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = '$' + (((Number(item.price) || 0) * (Number(item.qty) || 0)).toFixed(2));

    info.append(name, meta, price);

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
    toast.innerHTML = `<span class="toast-icon">🌸</span><div class="toast-text"><strong id="toastMsg"></strong><span id="toastSub"></span></div>`;
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
