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
    this.items.push({ ...item, id: Date.now() });
    this.save();
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  },

  total() {
    return this.items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
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
    }
  });
}

// Cart sidebar open/close
function openCart() {
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) {
    renderCartSidebar();
    sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeCart() {
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) {
    sidebar.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function renderCartSidebar() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;

  if (Cart.items.length === 0) {
    body.innerHTML = `<div class="cart-empty">
      <div style="font-size:2.5rem;margin-bottom:1rem;">🌸</div>
      <p>Your cart is empty</p>
      <a href="/product/" style="color:var(--rose-deep);font-size:0.8rem;">Browse our lenses →</a>
    </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  body.innerHTML = Cart.items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">🕶️</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">${item.model} · ${item.lensType} · ${item.vision}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <button class="cart-item-remove" onclick="Cart.remove(${item.id}); renderCartSidebar();">×</button>
    </div>
  `).join('');

  if (footer) {
    footer.style.display = 'block';
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '$' + Cart.total().toFixed(2);
  }
}

// Toast notification
function showToast(msg, sub) {
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
  setTimeout(() => toast.classList.remove('show'), 4500);
}

document.addEventListener('DOMContentLoaded', () => {
  Cart.load();
  initMobileNav();
});
