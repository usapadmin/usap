/**
 * US Apparel LLC — Modals, Invoice Generator, Reports, Animations, Theme Toggle, Fullscreen
 * Loaded by index.html after window.APP_DATA is defined.
 * Provides: openNewOrderModal, generateInvoice, openProductDetail,
 *           openNewCustomerApplication, openReports, animation system,
 *           dark/light mode toggle, fullscreen mode
 */
(function () {
  'use strict';

  /* ────────────────────────────────────────────
     DATA REFERENCES
  ──────────────────────────────────────────── */
  const data = () => window.APP_DATA || { PRODUCTS: [], CUSTOMERS: [], ORDERS: [] };
  const PRODUCTS = () => data().PRODUCTS || [];
  const CUSTOMERS = () => data().CUSTOMERS || [];
  const ORDERS = () => data().ORDERS || [];

  const TIER_DISCOUNTS = { platinum: 0.20, gold: 0.15, silver: 0.10, standard: 0 };
  const TIER_TERMS = {
    platinum: { terms: 'Net 60', freeShip: 500 },
    gold:     { terms: 'Net 45', freeShip: 750 },
    silver:   { terms: 'Net 30', freeShip: 1000 },
    standard: { terms: 'Prepaid', freeShip: 2000 }
  };

  const SHIP_METHODS = ['UPS Ground', 'FedEx Express', 'FedEx Ground', 'UPS Freight'];

  /* ────────────────────────────────────────────
     HELPERS
  ──────────────────────────────────────────── */
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtWhole(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function fmtNum(n) {
    return Number(n).toLocaleString('en-US');
  }

  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function tierPrice(price, tier) {
    return price * (1 - (TIER_DISCOUNTS[tier] || 0));
  }

  function tierBadgeHTML(tier) {
    const colors = {
      platinum: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7' },
      gold:     { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
      silver:   { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
      standard: { bg: 'rgba(100,116,139,0.15)', text: '#64748b' }
    };
    const c = colors[tier] || colors.standard;
    return `<span style="display:inline-block;padding:2px 8px;border-radius:10px;background:${c.bg};color:${c.text};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${tier}</span>`;
  }

  function categoryLabel(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('swim')) return 'Swimwear';
    if (c.includes('resort')) return 'Resort';
    if (c.includes('imprint')) return 'Imprintables';
    if (c.includes('last')) return 'Last Call';
    return cat || 'Other';
  }

  function nextOrderId() {
    const orders = ORDERS();
    if (!orders.length) return 'USA-26-5001';
    const nums = orders.map(o => parseInt(o.id.split('-').pop())).sort((a, b) => b - a);
    return 'USA-26-' + (nums[0] + 1);
  }

  /* ────────────────────────────────────────────
     TOAST (global, improved)
  ──────────────────────────────────────────── */
  function toast(msg, type) {
    type = type || 'info';
    const colors = {
      info:    'rgba(11,133,243,0.95)',
      success: 'rgba(16,185,129,0.95)',
      error:   'rgba(239,68,68,0.95)',
      warning: 'rgba(245,158,11,0.95)'
    };
    const icons = {
      info:    'fa-circle-info',
      success: 'fa-circle-check',
      error:   'fa-circle-xmark',
      warning: 'fa-triangle-exclamation'
    };
    const el = document.createElement('div');
    el.className = 'usa-toast';
    el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:999999;padding:14px 22px 14px 18px;border-radius:12px;background:${colors[type]};color:#fff;font-size:13px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,0.4);backdrop-filter:blur(12px);max-width:420px;display:flex;align-items:center;gap:10px;transform:translateX(120%);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s;`;
    el.innerHTML = `<i class="fas ${icons[type]}" style="font-size:16px;flex-shrink:0;"></i><span>${esc(msg)}</span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translateX(0)'; });
    setTimeout(() => { el.style.transform = 'translateX(120%)'; el.style.opacity = '0'; }, 3500);
    setTimeout(() => el.remove(), 4000);
  }
  window._usaToast = toast;

  /* ────────────────────────────────────────────
     MODAL BASE
  ──────────────────────────────────────────── */
  function createModal(id, content, opts) {
    opts = opts || {};
    const fullscreen = opts.fullscreen !== false;
    removeModal(id);
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = `position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity 0.3s;`;
    const panel = document.createElement('div');
    panel.className = 'usa-modal-panel';
    const w = fullscreen ? 'calc(100vw - 80px)' : (opts.width || '640px');
    const h = fullscreen ? 'calc(100vh - 60px)' : (opts.height || 'auto');
    panel.style.cssText = `width:${w};max-width:100%;height:${h};max-height:calc(100vh - 40px);background:var(--bg-body,#070d1a);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transform:scale(0.92);opacity:0;transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s;box-shadow:0 32px 80px rgba(0,0,0,0.5);`;
    panel.innerHTML = content;
    overlay.appendChild(panel);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal(id);
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      panel.style.transform = 'scale(1)';
      panel.style.opacity = '1';
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        closeModal(id);
        document.removeEventListener('keydown', handler);
      }
    });
    return overlay;
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const panel = el.querySelector('.usa-modal-panel');
    if (panel) {
      panel.style.transform = 'scale(0.92)';
      panel.style.opacity = '0';
    }
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
  }

  function removeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  /* Shared modal CSS (injected once) */
  function injectModalStyles() {
    if (document.getElementById('usa-modal-styles')) return;
    const s = document.createElement('style');
    s.id = 'usa-modal-styles';
    s.textContent = `
      .usa-modal-header { display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0; }
      .usa-modal-header h2 { font-size:18px;font-weight:700;color:var(--text-primary,#f1f5f9);display:flex;align-items:center;gap:10px; }
      .usa-modal-body { flex:1;overflow-y:auto;padding:24px; }
      .usa-modal-footer { display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0; }
      .usa-modal-close { width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s; }
      .usa-modal-close:hover { background:rgba(239,68,68,0.2);color:#ef4444; }
      .usa-btn { display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;font-family:inherit; }
      .usa-btn-primary { background:linear-gradient(135deg,#0b85f3,#36a5ff);color:#fff;box-shadow:0 4px 16px rgba(11,133,243,0.3); }
      .usa-btn-primary:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(11,133,243,0.4); }
      .usa-btn-ghost { background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.08); }
      .usa-btn-ghost:hover { background:rgba(255,255,255,0.08);color:#fff; }
      .usa-btn-success { background:linear-gradient(135deg,#10b981,#34d399);color:#fff;box-shadow:0 4px 16px rgba(16,185,129,0.3); }
      .usa-btn-danger { background:linear-gradient(135deg,#ef4444,#f87171);color:#fff;box-shadow:0 4px 16px rgba(239,68,68,0.3); }
      .usa-btn-sm { padding:6px 14px;font-size:12px;border-radius:8px; }
      .usa-input { width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:0 14px;color:var(--text-primary,#f1f5f9);font-size:13px;font-family:inherit;outline:none;transition:all 0.2s; }
      .usa-input:focus { border-color:rgba(11,133,243,0.5);box-shadow:0 0 0 3px rgba(11,133,243,0.1); }
      .usa-input::placeholder { color:rgba(255,255,255,0.25); }
      .usa-select { width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:0 14px;color:var(--text-primary,#f1f5f9);font-size:13px;font-family:inherit;outline:none;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center; }
      .usa-select option { background:#1e293b;color:#f1f5f9; }
      .usa-textarea { width:100%;min-height:80px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 14px;color:var(--text-primary,#f1f5f9);font-size:13px;font-family:inherit;outline:none;resize:vertical;transition:all 0.2s; }
      .usa-textarea:focus { border-color:rgba(11,133,243,0.5);box-shadow:0 0 0 3px rgba(11,133,243,0.1); }
      .usa-label { display:block;font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px; }
      .usa-field { margin-bottom:16px; }
      .usa-steps { display:flex;align-items:center;gap:0;margin-bottom:0; }
      .usa-step { flex:1;text-align:center;padding:12px 0;font-size:12px;font-weight:600;color:rgba(255,255,255,0.25);position:relative;cursor:default;transition:all 0.3s; }
      .usa-step.active { color:#0b85f3; }
      .usa-step.done { color:#10b981; }
      .usa-step::after { content:'';position:absolute;bottom:0;left:20%;right:20%;height:3px;border-radius:2px;background:rgba(255,255,255,0.06);transition:all 0.3s; }
      .usa-step.active::after { background:#0b85f3; }
      .usa-step.done::after { background:#10b981; }
      .usa-step-num { display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.06);margin-right:6px;font-size:11px;font-weight:700;transition:all 0.3s; }
      .usa-step.active .usa-step-num { background:rgba(11,133,243,0.2);color:#0b85f3; }
      .usa-step.done .usa-step-num { background:rgba(16,185,129,0.2);color:#10b981; }
      .usa-data-table { width:100%;border-collapse:collapse; }
      .usa-data-table th { text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;color:rgba(255,255,255,0.35);padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.06); }
      .usa-data-table td { padding:10px;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.03);color:rgba(255,255,255,0.7); }
      .usa-data-table tbody tr:hover { background:rgba(255,255,255,0.02); }
      .usa-card-inner { background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px; }
      .usa-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
      .usa-grid-3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px; }
      @media(max-width:900px) { .usa-grid-2,.usa-grid-3 { grid-template-columns:1fr; } }
      .usa-color-swatch { width:28px;height:28px;border-radius:50%;border:2px solid rgba(255,255,255,0.1);cursor:pointer;transition:all 0.2s; }
      .usa-color-swatch:hover,.usa-color-swatch.selected { border-color:#0b85f3;transform:scale(1.15); }
      .usa-tab-row { display:flex;gap:4px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:0; }
      .usa-tab { padding:10px 18px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.35);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;margin-bottom:-1px; }
      .usa-tab:hover { color:rgba(255,255,255,0.6); }
      .usa-tab.active { color:#0b85f3;border-bottom-color:#0b85f3; }

      /* Shimmer loading */
      @keyframes usaShimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
      .usa-shimmer { background:linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 100%);background-size:400px 100%;animation:usaShimmer 1.5s infinite linear;border-radius:8px; }

      /* Light mode overrides */
      body.light-mode { --bg-body:#f8fafc;--bg-sidebar:#ffffff;--bg-topbar:rgba(255,255,255,0.9);--bg-card:rgba(0,0,0,0.02);--border-card:rgba(0,0,0,0.08);--border-card-hover:rgba(0,0,0,0.15);--text-primary:#0f172a;--text-secondary:#475569;--text-muted:#94a3b8; }
      body.light-mode { background-image:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(11,133,243,0.04) 0%,transparent 60%),radial-gradient(ellipse 60% 40% at 80% 100%,rgba(245,158,11,0.02) 0%,transparent 50%); color:#0f172a; }
      body.light-mode .sidebar { background:#fff;border-color:rgba(0,0,0,0.06); }
      body.light-mode .nav-item { color:#94a3b8; }
      body.light-mode .nav-item:hover { color:#475569;background:rgba(0,0,0,0.04); }
      body.light-mode .nav-item.active { color:#0b85f3;background:rgba(11,133,243,0.08); }
      body.light-mode .topbar { background:rgba(255,255,255,0.9);border-color:rgba(0,0,0,0.06); }
      body.light-mode .topbar-search input { background:rgba(0,0,0,0.04);border-color:rgba(0,0,0,0.08);color:#0f172a; }
      body.light-mode .topbar-search input::placeholder { color:#94a3b8; }
      body.light-mode .glass-card,.light-mode .kpi-card { background:rgba(255,255,255,0.8);border-color:rgba(0,0,0,0.06);backdrop-filter:blur(20px); }
      body.light-mode .glass-card:hover,.light-mode .kpi-card:hover { border-color:rgba(0,0,0,0.12);box-shadow:0 8px 32px rgba(0,0,0,0.08); }
      body.light-mode .usa-modal-panel { background:#ffffff; }
      body.light-mode .usa-input,.light-mode .usa-select,.light-mode .usa-textarea { background:rgba(0,0,0,0.03);border-color:rgba(0,0,0,0.1);color:#0f172a; }
      body.light-mode .usa-card-inner { background:rgba(0,0,0,0.02);border-color:rgba(0,0,0,0.06); }
      body.light-mode .usa-data-table th { color:rgba(0,0,0,0.4); }
      body.light-mode .usa-data-table td { color:#334155;border-color:rgba(0,0,0,0.04); }
      body.light-mode .search-results-overlay { background:#fff;border-color:rgba(0,0,0,0.1);box-shadow:0 20px 60px rgba(0,0,0,0.15); }
      body.light-mode .search-result-item:hover { background:rgba(0,0,0,0.04); }
      body.light-mode .orders-table td { border-color:rgba(0,0,0,0.04); }
      body.light-mode ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12); }
      body.light-mode ::-webkit-scrollbar-thumb:hover { background:rgba(0,0,0,0.2); }

      /* Smooth body transition */
      body { transition: background 0.4s ease, color 0.4s ease, background-image 0.4s ease; }
      body * { transition-property: background, background-color, border-color, color, box-shadow, opacity, transform;
               transition-duration: 0s; }
      body.theme-transitioning, body.theme-transitioning * {
        transition-duration: 0.4s !important;
        transition-timing-function: ease !important;
      }
    `;
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════
     1. NEW ORDER MODAL
  ═══════════════════════════════════════════════ */
  let newOrderState = { step: 1, customer: null, items: [], shipMethod: '', shipAddress: '', notes: '' };

  window.openNewOrderModal = function () {
    newOrderState = { step: 1, customer: null, items: [], shipMethod: '', shipAddress: '', notes: '' };
    renderNewOrderModal();
  };

  function renderNewOrderModal() {
    const s = newOrderState;
    const stepNames = ['Select Customer', 'Add Products', 'Shipping', 'Review & Submit'];

    let stepsHTML = '<div class="usa-steps">';
    stepNames.forEach((name, i) => {
      const num = i + 1;
      let cls = '';
      if (num < s.step) cls = 'done';
      else if (num === s.step) cls = 'active';
      stepsHTML += `<div class="usa-step ${cls}"><span class="usa-step-num">${num < s.step ? '<i class="fas fa-check" style="font-size:10px;"></i>' : num}</span>${name}</div>`;
    });
    stepsHTML += '</div>';

    let bodyHTML = '';
    if (s.step === 1) bodyHTML = renderOrderStep1();
    else if (s.step === 2) bodyHTML = renderOrderStep2();
    else if (s.step === 3) bodyHTML = renderOrderStep3();
    else if (s.step === 4) bodyHTML = renderOrderStep4();

    const canBack = s.step > 1;
    const canNext = (s.step === 1 && s.customer) ||
                    (s.step === 2 && s.items.length > 0) ||
                    (s.step === 3 && s.shipMethod);
    const isSubmit = s.step === 4;

    const content = `
      <div class="usa-modal-header">
        <h2><i class="fas fa-plus-circle" style="color:#0b85f3;"></i> New Order</h2>
        <button class="usa-modal-close" onclick="document.getElementById('modal-new-order') && document.getElementById('modal-new-order').querySelector('.usa-modal-panel').style.transform='scale(0.92)';setTimeout(()=>document.getElementById('modal-new-order')&&document.getElementById('modal-new-order').remove(),300);"><i class="fas fa-times"></i></button>
      </div>
      ${stepsHTML}
      <div class="usa-modal-body">${bodyHTML}</div>
      <div class="usa-modal-footer">
        ${canBack ? '<button class="usa-btn usa-btn-ghost" onclick="window._orderStepBack()"><i class="fas fa-arrow-left"></i> Back</button>' : '<div></div>'}
        ${isSubmit
          ? '<button class="usa-btn usa-btn-success" onclick="window._orderSubmit()"><i class="fas fa-paper-plane"></i> Submit Order</button>'
          : `<button class="usa-btn usa-btn-primary" ${!canNext ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''} onclick="window._orderStepNext()">Next <i class="fas fa-arrow-right"></i></button>`
        }
      </div>`;

    createModal('modal-new-order', content);
  }

  function renderOrderStep1() {
    const custs = CUSTOMERS();
    const s = newOrderState;
    let html = '<div class="usa-field"><label class="usa-label">Search Customer</label><input class="usa-input" id="order-cust-search" placeholder="Type to search..." oninput="window._orderFilterCustomers(this.value)" autofocus></div>';
    html += '<div id="order-cust-list" style="max-height:400px;overflow-y:auto;">';
    custs.forEach(c => {
      const selected = s.customer && s.customer.id === c.id;
      html += `<div onclick="window._orderSelectCustomer(${c.id})" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:10px;cursor:pointer;margin-bottom:4px;border:1px solid ${selected ? 'rgba(11,133,243,0.4)' : 'rgba(255,255,255,0.04)'};background:${selected ? 'rgba(11,133,243,0.08)' : 'rgba(255,255,255,0.02)'};transition:all 0.15s;" class="order-cust-row" data-name="${esc(c.name.toLowerCase())}" data-contact="${esc(c.contact.toLowerCase())}">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#1e293b,#334155);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:rgba(255,255,255,0.6);">${esc(c.name.charAt(0))}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary,#f1f5f9);">${esc(c.name)}</div>
            <div style="font-size:11px;color:var(--text-muted,#64748b);">${esc(c.contact)} &middot; ${esc(c.location)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${tierBadgeHTML(c.tier)}
          ${selected ? '<i class="fas fa-check-circle" style="color:#0b85f3;font-size:16px;"></i>' : ''}
        </div>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  window._orderFilterCustomers = function (q) {
    q = q.toLowerCase();
    document.querySelectorAll('.order-cust-row').forEach(row => {
      const name = row.getAttribute('data-name') || '';
      const contact = row.getAttribute('data-contact') || '';
      row.style.display = (name.includes(q) || contact.includes(q)) ? '' : 'none';
    });
  };

  window._orderSelectCustomer = function (id) {
    const c = CUSTOMERS().find(x => x.id === id);
    if (c) {
      newOrderState.customer = c;
      newOrderState.shipAddress = c.location || '';
      renderNewOrderModal();
    }
  };

  function renderOrderStep2() {
    const s = newOrderState;
    const tier = s.customer ? (s.customer.tier || 'standard') : 'standard';
    let html = '<div class="usa-field"><label class="usa-label">Search Product (SKU or Name)</label><input class="usa-input" id="order-prod-search" placeholder="e.g. MPS-315 or Floral Vines" oninput="window._orderShowProductResults(this.value)" autocomplete="off"></div>';
    html += '<div id="order-prod-results" style="max-height:200px;overflow-y:auto;margin-bottom:20px;"></div>';

    if (s.items.length > 0) {
      let subtotal = 0;
      html += '<div style="margin-top:8px;"><table class="usa-data-table"><thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th><th></th></tr></thead><tbody>';
      s.items.forEach((item, idx) => {
        const tp = tierPrice(item.price, tier);
        const lineTotal = tp * item.qty;
        subtotal += lineTotal;
        html += `<tr>
          <td style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.5);">${esc(item.sku)}</td>
          <td style="font-weight:600;">${esc(item.name)}</td>
          <td><input type="number" min="1" value="${item.qty}" style="width:70px;height:30px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:0 8px;color:var(--text-primary,#f1f5f9);font-size:12px;font-family:inherit;outline:none;text-align:center;" onchange="window._orderUpdateQty(${idx},this.value)"></td>
          <td>${fmt(tp)}</td>
          <td style="font-weight:700;color:#0b85f3;">${fmt(lineTotal)}</td>
          <td><button onclick="window._orderRemoveItem(${idx})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;"><i class="fas fa-trash-alt"></i></button></td>
        </tr>`;
      });
      html += '</tbody></table>';
      html += `<div style="display:flex;justify-content:flex-end;padding:12px 10px 0;"><span style="font-size:14px;font-weight:700;">Subtotal: <span style="color:#0b85f3;">${fmt(subtotal)}</span></span></div></div>`;
    } else {
      html += '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.25);font-size:13px;"><i class="fas fa-box-open" style="font-size:24px;display:block;margin-bottom:8px;"></i>No products added yet. Search above to add.</div>';
    }
    return html;
  }

  window._orderShowProductResults = function (q) {
    const container = document.getElementById('order-prod-results');
    if (!container) return;
    q = q.trim().toLowerCase();
    if (q.length < 2) { container.innerHTML = ''; return; }
    const prods = PRODUCTS().filter(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).slice(0, 10);
    const tier = newOrderState.customer ? (newOrderState.customer.tier || 'standard') : 'standard';
    if (prods.length === 0) { container.innerHTML = '<div style="padding:8px;color:rgba(255,255,255,0.3);font-size:12px;">No products found.</div>'; return; }
    container.innerHTML = prods.map(p => {
      const tp = tierPrice(p.price, tier);
      return `<div onclick="window._orderAddProduct('${p.sku}')" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-radius:8px;cursor:pointer;transition:background 0.15s;" onmouseenter="this.style.background='rgba(255,255,255,0.04)'" onmouseleave="this.style.background='transparent'">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-family:monospace;font-size:11px;color:rgba(255,255,255,0.4);width:70px;">${p.sku}</span>
          <span style="font-size:13px;font-weight:500;">${esc(p.name)}</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.3);">${categoryLabel(p.category)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;color:rgba(255,255,255,0.35);text-decoration:line-through;">${fmt(p.price)}</span>
          <span style="font-size:13px;font-weight:700;color:#0b85f3;">${fmt(tp)}</span>
          <span style="font-size:11px;color:${p.stock < 50 ? '#ef4444' : 'rgba(255,255,255,0.3)'};">${fmtNum(p.stock)} in stock</span>
          <i class="fas fa-plus-circle" style="color:#0b85f3;"></i>
        </div>
      </div>`;
    }).join('');
  };

  window._orderAddProduct = function (sku) {
    const p = PRODUCTS().find(x => x.sku === sku);
    if (!p) return;
    const existing = newOrderState.items.find(x => x.sku === sku);
    if (existing) { existing.qty += 100; }
    else { newOrderState.items.push({ sku: p.sku, name: p.name, price: p.price, qty: 100 }); }
    renderNewOrderModal();
  };

  window._orderUpdateQty = function (idx, val) {
    const qty = parseInt(val);
    if (isNaN(qty) || qty < 1) return;
    newOrderState.items[idx].qty = qty;
  };

  window._orderRemoveItem = function (idx) {
    newOrderState.items.splice(idx, 1);
    renderNewOrderModal();
  };

  function renderOrderStep3() {
    const s = newOrderState;
    let html = '<div class="usa-grid-2">';
    html += '<div class="usa-field"><label class="usa-label">Shipping Method</label><select class="usa-select" id="order-ship-method" onchange="window._orderSetShip(\'method\',this.value)">';
    html += '<option value="">-- Select Method --</option>';
    SHIP_METHODS.forEach(m => {
      html += `<option value="${m}" ${s.shipMethod === m ? 'selected' : ''}>${m}</option>`;
    });
    html += '</select></div>';
    html += `<div class="usa-field"><label class="usa-label">Shipping Address</label><input class="usa-input" value="${esc(s.shipAddress)}" placeholder="Enter shipping address" onchange="window._orderSetShip('address',this.value)"></div>`;
    html += '</div>';
    if (s.customer) {
      html += `<div class="usa-card-inner" style="margin-top:12px;">
        <div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.45);margin-bottom:8px;">CUSTOMER DETAILS</div>
        <div style="display:flex;gap:24px;flex-wrap:wrap;">
          <div><span style="font-size:11px;color:rgba(255,255,255,0.35);">Company</span><div style="font-size:14px;font-weight:600;">${esc(s.customer.name)}</div></div>
          <div><span style="font-size:11px;color:rgba(255,255,255,0.35);">Contact</span><div style="font-size:14px;font-weight:500;">${esc(s.customer.contact)}</div></div>
          <div><span style="font-size:11px;color:rgba(255,255,255,0.35);">Tier</span><div style="margin-top:2px;">${tierBadgeHTML(s.customer.tier)}</div></div>
          <div><span style="font-size:11px;color:rgba(255,255,255,0.35);">Terms</span><div style="font-size:14px;font-weight:500;">${TIER_TERMS[s.customer.tier]?.terms || 'Prepaid'}</div></div>
        </div>
      </div>`;
    }
    return html;
  }

  window._orderSetShip = function (field, val) {
    if (field === 'method') newOrderState.shipMethod = val;
    else newOrderState.shipAddress = val;
  };

  function renderOrderStep4() {
    const s = newOrderState;
    const tier = s.customer ? (s.customer.tier || 'standard') : 'standard';
    const discount = TIER_DISCOUNTS[tier] || 0;
    let subtotal = 0;
    s.items.forEach(item => { subtotal += tierPrice(item.price, tier) * item.qty; });

    let html = '<div class="usa-grid-2" style="margin-bottom:20px;">';
    html += `<div class="usa-card-inner">
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Customer</div>
      <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${esc(s.customer?.name || '—')}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);">${esc(s.customer?.contact || '')} &middot; ${esc(s.customer?.email || '')}</div>
      <div style="margin-top:6px;">${tierBadgeHTML(tier)} <span style="font-size:11px;color:rgba(255,255,255,0.3);margin-left:6px;">${Math.round(discount * 100)}% discount</span></div>
    </div>`;
    html += `<div class="usa-card-inner">
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Shipping</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${esc(s.shipMethod || 'Not selected')}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);">${esc(s.shipAddress || 'No address')}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.35);margin-top:4px;">Terms: ${TIER_TERMS[tier]?.terms || 'Prepaid'}</div>
    </div>`;
    html += '</div>';

    html += '<table class="usa-data-table"><thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead><tbody>';
    s.items.forEach(item => {
      const tp = tierPrice(item.price, tier);
      html += `<tr><td style="font-family:monospace;font-size:12px;">${esc(item.sku)}</td><td style="font-weight:600;">${esc(item.name)}</td><td>${fmtNum(item.qty)}</td><td>${fmt(tp)}</td><td style="font-weight:700;color:#0b85f3;">${fmt(tp * item.qty)}</td></tr>`;
    });
    html += '</tbody></table>';

    html += `<div style="display:flex;justify-content:flex-end;margin-top:16px;">
      <div style="min-width:220px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:rgba(255,255,255,0.5);">Subtotal</span><span style="font-weight:600;">${fmt(subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:rgba(255,255,255,0.5);">Discount (${Math.round(discount * 100)}%)</span><span style="font-weight:600;color:#10b981;">Included</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:rgba(255,255,255,0.5);">Tax</span><span style="font-weight:600;">$0.00</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;"><span style="color:rgba(255,255,255,0.5);">Shipping</span><span style="font-weight:600;">TBD</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:16px;font-weight:800;border-top:1px solid rgba(255,255,255,0.08);margin-top:6px;"><span>Total</span><span style="color:#0b85f3;">${fmt(subtotal)}</span></div>
      </div>
    </div>`;

    html += '<div class="usa-field" style="margin-top:20px;"><label class="usa-label">Order Notes (optional)</label><textarea class="usa-textarea" placeholder="Special instructions, PO number, etc." onchange="window._orderSetNotes(this.value)">' + esc(s.notes) + '</textarea></div>';
    return html;
  }

  window._orderSetNotes = function (val) { newOrderState.notes = val; };

  window._orderStepNext = function () {
    if (newOrderState.step < 4) { newOrderState.step++; renderNewOrderModal(); }
  };

  window._orderStepBack = function () {
    if (newOrderState.step > 1) { newOrderState.step--; renderNewOrderModal(); }
  };

  window._orderSubmit = function () {
    const s = newOrderState;
    if (!s.customer || s.items.length === 0) { toast('Please complete all fields.', 'error'); return; }
    const tier = s.customer.tier || 'standard';
    let total = 0;
    const orderItems = s.items.map(item => {
      const tp = tierPrice(item.price, tier);
      total += tp * item.qty;
      return { sku: item.sku, name: item.name, qty: item.qty, price: tp };
    });
    const newOrder = {
      id: nextOrderId(),
      customerId: s.customer.id,
      items: orderItems,
      total: Math.round(total * 100) / 100,
      status: 'pending',
      date: todayStr(),
      shipMethod: s.shipMethod,
      tracking: '',
      notes: s.notes
    };
    ORDERS().unshift(newOrder);
    closeModal('modal-new-order');
    toast('Order ' + newOrder.id + ' created for ' + s.customer.name + '!', 'success');
    if (typeof window.showView === 'function') {
      const ordersView = document.getElementById('view-orders');
      if (ordersView && ordersView.classList.contains('active')) {
        const ev = new Event('usa-refresh-orders');
        document.dispatchEvent(ev);
      }
    }
  };

  /* ═══════════════════════════════════════════════
     2. INVOICE GENERATOR
  ═══════════════════════════════════════════════ */
  window.generateInvoice = function (orderId) {
    const order = ORDERS().find(o => o.id === orderId);
    if (!order) { toast('Order not found: ' + orderId, 'error'); return; }
    const customer = CUSTOMERS().find(c => c.id === order.customerId);
    const custName = customer ? customer.name : 'Unknown Customer';
    const custContact = customer ? customer.contact : '';
    const custEmail = customer ? customer.email : '';
    const custPhone = customer ? customer.phone : '';
    const custLocation = customer ? customer.location : '';
    const tier = customer ? (customer.tier || 'standard') : 'standard';
    const terms = TIER_TERMS[tier] || TIER_TERMS.standard;
    const discount = TIER_DISCOUNTS[tier] || 0;

    const invoiceDate = order.date || todayStr();
    const dueDays = tier === 'platinum' ? 60 : tier === 'gold' ? 45 : tier === 'silver' ? 30 : 0;
    const dueDate = dueDays > 0 ? addDays(invoiceDate, dueDays) : invoiceDate;

    let subtotalBase = 0;
    order.items.forEach(item => { subtotalBase += item.qty * item.price; });
    const invoiceNum = 'INV-' + orderId.replace('USA-', '').replace(/-/g, '');

    let itemsHTML = '';
    order.items.forEach(item => {
      const lineTotal = item.qty * item.price;
      itemsHTML += `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#6b7280;">${item.sku}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:500;">${item.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty.toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${item.price.toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">$${lineTotal.toFixed(2)}</td>
      </tr>`;
    });

    const invoiceHTML = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNum} — U.S. Apparel LLC</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Inter',sans-serif;color:#1e293b;background:#fff;padding:40px;max-width:800px;margin:0 auto; }
  @media print { body { padding:20px; } .no-print { display:none !important; } }
  .header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:20px;border-bottom:3px solid #0b85f3; }
  .company h1 { font-size:24px;font-weight:800;color:#0b85f3;letter-spacing:-0.5px; }
  .company p { font-size:12px;color:#64748b;margin-top:4px;line-height:1.6; }
  .invoice-title { text-align:right; }
  .invoice-title h2 { font-size:28px;font-weight:800;color:#1e293b;letter-spacing:2px; }
  .invoice-title p { font-size:12px;color:#64748b;margin-top:4px; }
  .addresses { display:flex;justify-content:space-between;margin-bottom:30px; }
  .address-block { flex:1; }
  .address-block h4 { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px; }
  .address-block p { font-size:13px;color:#334155;line-height:1.6; }
  table { width:100%;border-collapse:collapse;margin-bottom:24px; }
  table th { text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;padding:10px 12px;border-bottom:2px solid #e5e7eb;background:#f8fafc; }
  table th:nth-child(3),table th:nth-child(4),table th:nth-child(5) { text-align:right; }
  table th:nth-child(3) { text-align:center; }
  .totals { display:flex;justify-content:flex-end; }
  .totals-table { min-width:260px; }
  .totals-row { display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#475569; }
  .totals-row.total { padding:12px 0 0;margin-top:8px;border-top:2px solid #1e293b;font-size:18px;font-weight:800;color:#0b85f3; }
  .footer { margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center; }
  .footer p { font-size:12px;color:#94a3b8; }
  .footer .thanks { font-size:16px;font-weight:700;color:#0b85f3;margin-bottom:8px; }
  .print-btn { display:inline-block;padding:10px 24px;background:#0b85f3;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:30px;font-family:inherit; }
  .print-btn:hover { background:#0969c4; }
</style>
</head><body>
<div class="no-print" style="text-align:center;margin-bottom:20px;">
  <button class="print-btn" onclick="window.print()"><span style="margin-right:6px;">&#128424;</span> Print Invoice</button>
</div>
<div class="header">
  <div class="company">
    <h1>U.S. Apparel LLC</h1>
    <p>Premium Wholesale Resort & Swimwear<br>Miami, FL 33101<br>(305) 555-0100 &middot; orders@usapparel.com</p>
  </div>
  <div class="invoice-title">
    <h2>INVOICE</h2>
    <p><strong>Invoice #:</strong> ${invoiceNum}<br><strong>Date:</strong> ${fmtDate(invoiceDate)}<br><strong>Due Date:</strong> ${fmtDate(dueDate)}</p>
  </div>
</div>
<div class="addresses">
  <div class="address-block">
    <h4>Bill To</h4>
    <p><strong>${esc(custName)}</strong><br>${esc(custContact)}<br>${esc(custEmail)}<br>${esc(custPhone)}<br>${esc(custLocation)}</p>
  </div>
  <div class="address-block" style="text-align:right;">
    <h4>Ship To</h4>
    <p><strong>${esc(custName)}</strong><br>${esc(custLocation)}</p>
  </div>
</div>
<table>
  <thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Total</th></tr></thead>
  <tbody>${itemsHTML}</tbody>
</table>
<div class="totals">
  <div class="totals-table">
    <div class="totals-row"><span>Subtotal</span><span>$${subtotalBase.toFixed(2)}</span></div>
    <div class="totals-row"><span>Tier Discount (${Math.round(discount * 100)}%)</span><span>Included in pricing</span></div>
    <div class="totals-row"><span>Tax (Wholesale Exempt)</span><span>$0.00</span></div>
    <div class="totals-row"><span>Shipping</span><span>TBD</span></div>
    <div class="totals-row total"><span>Total Due</span><span>$${subtotalBase.toFixed(2)}</span></div>
  </div>
</div>
<div style="margin-top:24px;padding:14px 18px;background:#f0f9ff;border-radius:8px;border-left:4px solid #0b85f3;">
  <p style="font-size:12px;color:#0369a1;font-weight:500;"><strong>Payment Terms:</strong> ${terms.terms} &middot; Account Tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)} &middot; Free shipping on orders over $${terms.freeShip.toLocaleString()}</p>
</div>
<div class="footer">
  <p class="thanks">Thank you for your business!</p>
  <p>U.S. Apparel LLC &middot; Miami, FL &middot; (305) 555-0100 &middot; usapparel.com</p>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(invoiceHTML);
      win.document.close();
    } else {
      toast('Popup blocked. Please allow popups for invoices.', 'warning');
    }
  };

  /* ═══════════════════════════════════════════════
     3. PRODUCT DETAIL MODAL
  ═══════════════════════════════════════════════ */
  window.openProductDetail = function (sku) {
    const product = PRODUCTS().find(p => p.sku === sku);
    if (!product) { toast('Product not found: ' + sku, 'error'); return; }

    const dummyColors = ['#1e3a5f', '#2d6a4f', '#7f1d1d', '#78350f', '#312e81', '#1e1e1e', '#f5f5dc', '#e11d48'];
    const colorCount = product.colors || 4;
    const colors = dummyColors.slice(0, colorCount);

    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const sizeData = sizes.map(s => ({
      size: s,
      chest: s === 'S' ? '34-36' : s === 'M' ? '38-40' : s === 'L' ? '42-44' : s === 'XL' ? '46-48' : '50-52',
      waist: s === 'S' ? '28-30' : s === 'M' ? '32-34' : s === 'L' ? '36-38' : s === 'XL' ? '40-42' : '44-46',
      length: s === 'S' ? '27' : s === 'M' ? '28' : s === 'L' ? '29' : s === 'XL' ? '30' : '31'
    }));

    const stockPct = Math.min(100, Math.round((product.stock / 1500) * 100));
    const stockClr = product.stock < 50 ? '#ef4444' : product.stock < 100 ? '#f59e0b' : '#22c55e';

    // Top customers for this product
    const custOrders = {};
    ORDERS().forEach(o => {
      o.items.forEach(item => {
        if (item.sku === sku) {
          if (!custOrders[o.customerId]) custOrders[o.customerId] = { qty: 0, revenue: 0 };
          custOrders[o.customerId].qty += item.qty;
          custOrders[o.customerId].revenue += item.qty * item.price;
        }
      });
    });
    const topCusts = Object.entries(custOrders).map(([id, d]) => {
      const c = CUSTOMERS().find(x => x.id === parseInt(id));
      return { name: c ? c.name : 'Unknown', qty: d.qty, revenue: d.revenue };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Recent orders with this product
    const recentOrders = ORDERS().filter(o => o.items.some(i => i.sku === sku)).slice(0, 5);

    const tiers = ['platinum', 'gold', 'silver', 'standard'];
    let tierPricesHTML = tiers.map(t => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-size:12px;">${tierBadgeHTML(t)}</span><span style="font-size:13px;font-weight:600;">${fmt(tierPrice(product.price, t))}</span></div>`).join('');

    const catInfo = categoryLabel(product.category);
    const gradients = {
      'Swimwear': 'linear-gradient(135deg,#0c4a6e,#0284c7,#38bdf8)',
      'Resort': 'linear-gradient(135deg,#78350f,#d97706,#fbbf24)',
      'Imprintables': 'linear-gradient(135deg,#1e293b,#475569,#94a3b8)',
      'Last Call': 'linear-gradient(135deg,#7f1d1d,#dc2626,#f87171)'
    };

    const content = `
      <div class="usa-modal-header">
        <h2><i class="fas fa-tag" style="color:#0b85f3;"></i> ${esc(product.name)}</h2>
        <button class="usa-modal-close" onclick="closeModal('modal-product-detail')"><i class="fas fa-times"></i></button>
      </div>
      <div class="usa-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <!-- Left column -->
          <div>
            <div style="height:240px;border-radius:14px;background:${gradients[catInfo] || gradients['Imprintables']};display:flex;align-items:center;justify-content:center;margin-bottom:20px;position:relative;overflow:hidden;">
              <div style="text-align:center;z-index:1;">
                <i class="fas fa-tshirt" style="font-size:64px;color:rgba(255,255,255,0.25);"></i>
                <div style="font-size:18px;font-weight:800;color:#fff;margin-top:8px;">${esc(product.name)}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.6);font-family:monospace;">${esc(product.sku)}</div>
              </div>
            </div>
            <div style="margin-bottom:16px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Category</div>
              <div style="font-size:14px;font-weight:600;">${catInfo} &middot; ${esc(product.sub || '')}</div>
            </div>
            <div style="margin-bottom:16px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Colors (${colorCount})</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">${colors.map((c, i) => `<div class="usa-color-swatch${i === 0 ? ' selected' : ''}" style="background:${c};"></div>`).join('')}</div>
            </div>
            <div style="margin-bottom:16px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Stock Level</div>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="flex:1;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;"><div style="width:${stockPct}%;height:100%;background:${stockClr};border-radius:4px;"></div></div>
                <span style="font-size:14px;font-weight:700;color:${stockClr};">${fmtNum(product.stock)}</span>
              </div>
            </div>
            <div style="margin-bottom:16px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Size Chart</div>
              <table class="usa-data-table" style="font-size:12px;">
                <thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Length</th></tr></thead>
                <tbody>${sizeData.map(s => `<tr><td style="font-weight:700;">${s.size}</td><td>${s.chest}"</td><td>${s.waist}"</td><td>${s.length}"</td></tr>`).join('')}</tbody>
              </table>
            </div>
          </div>
          <!-- Right column -->
          <div>
            <div class="usa-card-inner" style="margin-bottom:16px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Pricing</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px;">Base: <span style="font-size:16px;font-weight:700;color:var(--text-primary,#f1f5f9);">${fmt(product.price)}</span></div>
              ${tierPricesHTML}
            </div>
            <div class="usa-card-inner" style="margin-bottom:16px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Top Customers</div>
              ${topCusts.length > 0 ? topCusts.map((c, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.3);width:16px;">${i+1}</span><span style="font-size:12px;font-weight:500;">${esc(c.name)}</span></div><div style="text-align:right;"><div style="font-size:12px;font-weight:700;">${fmtWhole(c.revenue)}</div><div style="font-size:10px;color:rgba(255,255,255,0.3);">${fmtNum(c.qty)} units</div></div></div>`).join('') : '<div style="font-size:12px;color:rgba(255,255,255,0.25);padding:8px 0;">No order history yet.</div>'}
            </div>
            <div class="usa-card-inner" style="margin-bottom:16px;">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Recent Orders</div>
              ${recentOrders.length > 0 ? recentOrders.map(o => {
                const c = CUSTOMERS().find(x => x.id === o.customerId);
                const lineItem = o.items.find(i => i.sku === sku);
                return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);"><div><span style="font-size:12px;font-weight:600;color:#0b85f3;">${o.id}</span><span style="font-size:11px;color:rgba(255,255,255,0.3);margin-left:8px;">${c ? c.name : 'Unknown'}</span></div><div style="text-align:right;"><span style="font-size:12px;font-weight:600;">${lineItem ? fmtNum(lineItem.qty) + ' units' : '—'}</span><span style="font-size:11px;color:rgba(255,255,255,0.3);margin-left:8px;">${fmtDate(o.date)}</span></div></div>`;
              }).join('') : '<div style="font-size:12px;color:rgba(255,255,255,0.25);padding:8px 0;">No orders yet.</div>'}
            </div>
            <div class="usa-card-inner">
              <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Quick Actions</div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <input type="number" min="1" value="100" id="pd-qty-input" style="width:80px;height:36px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:0 10px;color:var(--text-primary,#f1f5f9);font-size:13px;text-align:center;font-family:inherit;outline:none;">
                <span style="font-size:12px;color:rgba(255,255,255,0.35);">units</span>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="usa-btn usa-btn-primary usa-btn-sm" onclick="window.openNewOrderModal();closeModal('modal-product-detail');"><i class="fas fa-shopping-cart"></i> Quick Order</button>
                <button class="usa-btn usa-btn-ghost usa-btn-sm" onclick="toast('${esc(product.name)} added to cart!','success');closeModal('modal-product-detail');"><i class="fas fa-plus"></i> Add to Cart</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    createModal('modal-product-detail', content);
  };

  /* ═══════════════════════════════════════════════
     4. CUSTOMER APPLICATION MODAL
  ═══════════════════════════════════════════════ */
  window.openNewCustomerApplication = function () {
    const content = `
      <div class="usa-modal-header">
        <h2><i class="fas fa-user-plus" style="color:#10b981;"></i> New B2B Customer Application</h2>
        <button class="usa-modal-close" onclick="closeModal('modal-cust-app')"><i class="fas fa-times"></i></button>
      </div>
      <div class="usa-modal-body">
        <div class="usa-grid-2">
          <div class="usa-field">
            <label class="usa-label">Company Name *</label>
            <input class="usa-input" id="app-company" placeholder="Acme Beach Resort">
          </div>
          <div class="usa-field">
            <label class="usa-label">DBA (Doing Business As)</label>
            <input class="usa-input" id="app-dba" placeholder="Optional">
          </div>
        </div>
        <div class="usa-grid-3">
          <div class="usa-field">
            <label class="usa-label">Contact Name *</label>
            <input class="usa-input" id="app-contact" placeholder="Jane Doe">
          </div>
          <div class="usa-field">
            <label class="usa-label">Email *</label>
            <input class="usa-input" id="app-email" type="email" placeholder="jane@acmeresort.com">
          </div>
          <div class="usa-field">
            <label class="usa-label">Phone *</label>
            <input class="usa-input" id="app-phone" type="tel" placeholder="(305) 555-0100">
          </div>
        </div>
        <div class="usa-field">
          <label class="usa-label">Billing Address *</label>
          <input class="usa-input" id="app-billing" placeholder="123 Ocean Drive, Miami, FL 33101">
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.5);cursor:pointer;">
            <input type="checkbox" id="app-same-addr" checked style="accent-color:#0b85f3;width:16px;height:16px;" onchange="document.getElementById('app-shipping-row').style.display=this.checked?'none':'block'">
            Shipping address same as billing
          </label>
        </div>
        <div id="app-shipping-row" style="display:none;">
          <div class="usa-field">
            <label class="usa-label">Shipping Address</label>
            <input class="usa-input" id="app-shipping" placeholder="456 Beach Blvd, Key West, FL 33040">
          </div>
        </div>
        <div class="usa-grid-2">
          <div class="usa-field">
            <label class="usa-label">Business Type *</label>
            <select class="usa-select" id="app-biz-type">
              <option value="">-- Select --</option>
              <option value="resort">Resort / Hotel</option>
              <option value="retailer">Retailer</option>
              <option value="distributor">Distributor</option>
              <option value="screen-printer">Screen Printer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="usa-field">
            <label class="usa-label">Tax ID / EIN *</label>
            <input class="usa-input" id="app-taxid" placeholder="XX-XXXXXXX">
          </div>
        </div>
        <div class="usa-grid-2">
          <div class="usa-field">
            <label class="usa-label">Estimated Monthly Order Volume</label>
            <select class="usa-select" id="app-volume">
              <option value="">-- Select --</option>
              <option value="under-1k">Under $1,000</option>
              <option value="1k-5k">$1,000 - $5,000</option>
              <option value="5k-15k">$5,000 - $15,000</option>
              <option value="15k-50k">$15,000 - $50,000</option>
              <option value="over-50k">Over $50,000</option>
            </select>
          </div>
          <div class="usa-field">
            <label class="usa-label">How did you hear about us?</label>
            <select class="usa-select" id="app-referral">
              <option value="">-- Select --</option>
              <option value="trade-show">Trade Show</option>
              <option value="referral">Customer Referral</option>
              <option value="google">Google Search</option>
              <option value="social">Social Media</option>
              <option value="sales-rep">Sales Representative</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
      <div class="usa-modal-footer">
        <button class="usa-btn usa-btn-ghost" onclick="closeModal('modal-cust-app')">Cancel</button>
        <button class="usa-btn usa-btn-success" onclick="window._submitCustApplication()"><i class="fas fa-paper-plane"></i> Submit Application</button>
      </div>`;

    createModal('modal-cust-app', content, { fullscreen: false, width: '720px' });
  };

  window._submitCustApplication = function () {
    const company = (document.getElementById('app-company')?.value || '').trim();
    const contact = (document.getElementById('app-contact')?.value || '').trim();
    const email = (document.getElementById('app-email')?.value || '').trim();
    const phone = (document.getElementById('app-phone')?.value || '').trim();
    const billing = (document.getElementById('app-billing')?.value || '').trim();
    const bizType = (document.getElementById('app-biz-type')?.value || '').trim();
    const taxId = (document.getElementById('app-taxid')?.value || '').trim();

    if (!company || !contact || !email || !phone || !billing || !bizType || !taxId) {
      toast('Please fill in all required fields.', 'error');
      return;
    }

    const sameAddr = document.getElementById('app-same-addr')?.checked;
    const shipping = sameAddr ? billing : (document.getElementById('app-shipping')?.value || billing).trim();
    const volume = document.getElementById('app-volume')?.value || '';
    const referral = document.getElementById('app-referral')?.value || '';

    const appId = 200 + Math.floor(Math.random() * 900);
    const app = {
      id: appId,
      company: company,
      dba: (document.getElementById('app-dba')?.value || '').trim(),
      contact: contact,
      email: email,
      phone: phone,
      billingAddress: billing,
      shippingAddress: shipping,
      businessType: bizType,
      taxId: taxId,
      volume: volume,
      referral: referral,
      dateApplied: todayStr(),
      status: 'pending'
    };

    if (!window.APP_DATA.PENDING_APPLICATIONS) window.APP_DATA.PENDING_APPLICATIONS = [];
    window.APP_DATA.PENDING_APPLICATIONS.push(app);

    closeModal('modal-cust-app');
    toast(company + ' application submitted successfully!', 'success');
  };

  /* ═══════════════════════════════════════════════
     5. REPORT GENERATOR
  ═══════════════════════════════════════════════ */
  let reportTab = 'sales';

  window.openReports = function () {
    renderReportsModal();
  };

  function renderReportsModal() {
    const tabs = [
      { id: 'sales', label: 'Sales Summary', icon: 'fa-chart-line' },
      { id: 'products', label: 'Top Products', icon: 'fa-trophy' },
      { id: 'customers', label: 'Customer Report', icon: 'fa-users' },
      { id: 'inventory-val', label: 'Inventory Valuation', icon: 'fa-warehouse' },
      { id: 'low-stock', label: 'Low Stock', icon: 'fa-triangle-exclamation' }
    ];

    let tabsHTML = '<div class="usa-tab-row">';
    tabs.forEach(t => {
      tabsHTML += `<div class="usa-tab ${reportTab === t.id ? 'active' : ''}" onclick="window._reportTab('${t.id}')"><i class="fas ${t.icon}" style="margin-right:6px;font-size:11px;"></i>${t.label}</div>`;
    });
    tabsHTML += '</div>';

    let bodyHTML = '';
    if (reportTab === 'sales') bodyHTML = renderSalesReport();
    else if (reportTab === 'products') bodyHTML = renderProductsReport();
    else if (reportTab === 'customers') bodyHTML = renderCustomersReport();
    else if (reportTab === 'inventory-val') bodyHTML = renderInventoryValReport();
    else if (reportTab === 'low-stock') bodyHTML = renderLowStockReport();

    const content = `
      <div class="usa-modal-header">
        <h2><i class="fas fa-chart-bar" style="color:#0b85f3;"></i> Reports</h2>
        <button class="usa-modal-close" onclick="closeModal('modal-reports')"><i class="fas fa-times"></i></button>
      </div>
      <div class="usa-modal-body">
        ${tabsHTML}
        ${bodyHTML}
      </div>`;

    createModal('modal-reports', content);
  }

  window._reportTab = function (tab) {
    reportTab = tab;
    renderReportsModal();
  };

  function reportActions(csvFn) {
    return `<div style="display:flex;gap:8px;margin-bottom:20px;">
      <button class="usa-btn usa-btn-ghost usa-btn-sm" onclick="${csvFn}"><i class="fas fa-file-csv"></i> Export CSV</button>
      <button class="usa-btn usa-btn-ghost usa-btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
    </div>`;
  }

  function renderSalesReport() {
    const orders = ORDERS();
    const totalRev = orders.reduce((s, o) => s + o.total, 0);
    const avgOV = orders.length > 0 ? totalRev / orders.length : 0;
    const statuses = {};
    orders.forEach(o => { statuses[o.status] = (statuses[o.status] || 0) + 1; });

    let html = reportActions("window._exportCSV('sales')");
    html += `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
      <div class="usa-card-inner" style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#0b85f3;">${fmtWhole(totalRev)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Total Revenue</div>
      </div>
      <div class="usa-card-inner" style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#10b981;">${orders.length}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Total Orders</div>
      </div>
      <div class="usa-card-inner" style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#f59e0b;">${fmtWhole(avgOV)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Avg Order Value</div>
      </div>
      <div class="usa-card-inner" style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#a855f7;">${new Set(orders.map(o => o.customerId)).size}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Unique Customers</div>
      </div>
    </div>`;

    html += '<div style="font-size:13px;font-weight:600;margin-bottom:10px;">Orders by Status</div>';
    html += '<table class="usa-data-table"><thead><tr><th>Status</th><th>Count</th><th>Percentage</th></tr></thead><tbody>';
    Object.entries(statuses).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
      const pct = ((count / orders.length) * 100).toFixed(1);
      html += `<tr><td style="text-transform:capitalize;font-weight:600;">${status}</td><td>${count}</td><td><div style="display:flex;align-items:center;gap:8px;"><div style="width:80px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:#0b85f3;border-radius:3px;"></div></div>${pct}%</div></td></tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function renderProductsReport() {
    const revenueMap = {};
    ORDERS().forEach(o => {
      o.items.forEach(item => {
        if (!revenueMap[item.sku]) revenueMap[item.sku] = { sku: item.sku, name: item.name, revenue: 0, units: 0 };
        revenueMap[item.sku].revenue += item.qty * item.price;
        revenueMap[item.sku].units += item.qty;
      });
    });
    const sorted = Object.values(revenueMap).sort((a, b) => b.revenue - a.revenue);
    const maxRev = sorted[0]?.revenue || 1;

    let html = reportActions("window._exportCSV('products')");
    html += '<table class="usa-data-table"><thead><tr><th>#</th><th>SKU</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Share</th></tr></thead><tbody>';
    sorted.forEach((p, i) => {
      const pct = ((p.revenue / maxRev) * 100).toFixed(0);
      html += `<tr>
        <td style="font-weight:700;color:rgba(255,255,255,0.3);">${i + 1}</td>
        <td style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.5);">${p.sku}</td>
        <td style="font-weight:600;">${esc(p.name)}</td>
        <td>${fmtNum(p.units)}</td>
        <td style="font-weight:700;color:#0b85f3;">${fmtWhole(p.revenue)}</td>
        <td><div style="width:80px;height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#0b85f3,#36a5ff);border-radius:3px;"></div></div></td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function renderCustomersReport() {
    const custs = CUSTOMERS().slice().sort((a, b) => b.ltv - a.ltv);
    const maxLTV = custs[0]?.ltv || 1;

    let html = reportActions("window._exportCSV('customers')");
    html += '<table class="usa-data-table"><thead><tr><th>#</th><th>Customer</th><th>Tier</th><th>Orders</th><th>LTV</th><th>Last Order</th></tr></thead><tbody>';
    custs.forEach((c, i) => {
      html += `<tr>
        <td style="font-weight:700;color:rgba(255,255,255,0.3);">${i + 1}</td>
        <td><div style="font-weight:600;">${esc(c.name)}</div><div style="font-size:11px;color:rgba(255,255,255,0.3);">${esc(c.location)}</div></td>
        <td>${tierBadgeHTML(c.tier)}</td>
        <td>${c.orders}</td>
        <td style="font-weight:700;color:#0b85f3;">${fmtWhole(c.ltv)}</td>
        <td style="font-size:12px;color:rgba(255,255,255,0.45);">${fmtDate(c.lastOrder)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function renderInventoryValReport() {
    const products = PRODUCTS().slice();
    let totalValue = 0;
    products.forEach(p => { totalValue += p.stock * p.price; });
    const sorted = products.sort((a, b) => (b.stock * b.price) - (a.stock * a.price));
    const totalUnits = products.reduce((s, p) => s + p.stock, 0);

    let html = reportActions("window._exportCSV('inventory')");
    html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
      <div class="usa-card-inner" style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#0b85f3;">${fmtWhole(totalValue)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Total Inventory Value</div>
      </div>
      <div class="usa-card-inner" style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#10b981;">${fmtNum(totalUnits)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Total Units</div>
      </div>
      <div class="usa-card-inner" style="text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#f59e0b;">${products.length}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Active SKUs</div>
      </div>
    </div>`;
    html += '<table class="usa-data-table"><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Stock</th><th>Unit Cost</th><th>Total Value</th></tr></thead><tbody>';
    sorted.slice(0, 30).forEach(p => {
      const val = p.stock * p.price;
      html += `<tr>
        <td style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.5);">${p.sku}</td>
        <td style="font-weight:600;">${esc(p.name)}</td>
        <td style="font-size:12px;">${categoryLabel(p.category)}</td>
        <td>${fmtNum(p.stock)}</td>
        <td>${fmt(p.price)}</td>
        <td style="font-weight:700;color:#0b85f3;">${fmtWhole(val)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function renderLowStockReport() {
    const lowStock = PRODUCTS().filter(p => p.stock < 100).sort((a, b) => a.stock - b.stock);

    let html = reportActions("window._exportCSV('lowstock')");
    if (lowStock.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);"><i class="fas fa-check-circle" style="font-size:32px;display:block;margin-bottom:10px;color:#10b981;"></i>All products are well-stocked!</div>';
      return html;
    }
    html += `<div style="margin-bottom:16px;padding:12px 16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;"><span style="font-size:13px;font-weight:600;color:#ef4444;"><i class="fas fa-triangle-exclamation" style="margin-right:6px;"></i>${lowStock.length} products below reorder point (100 units)</span></div>`;
    html += '<table class="usa-data-table"><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Stock</th><th>Status</th><th>Restock Qty</th></tr></thead><tbody>';
    lowStock.forEach(p => {
      const urgency = p.stock < 20 ? { label: 'CRITICAL', color: '#ef4444' } : p.stock < 50 ? { label: 'LOW', color: '#f59e0b' } : { label: 'WATCH', color: '#94a3b8' };
      const restock = Math.max(200, Math.ceil((200 - p.stock) / 50) * 50);
      html += `<tr>
        <td style="font-family:monospace;font-size:12px;color:rgba(255,255,255,0.5);">${p.sku}</td>
        <td style="font-weight:600;">${esc(p.name)}</td>
        <td style="font-size:12px;">${categoryLabel(p.category)}</td>
        <td style="font-weight:700;color:${urgency.color};">${fmtNum(p.stock)}</td>
        <td><span style="display:inline-block;padding:2px 8px;border-radius:10px;background:${urgency.color}22;color:${urgency.color};font-size:10px;font-weight:700;">${urgency.label}</span></td>
        <td style="font-weight:600;">${fmtNum(restock)}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  window._exportCSV = function (type) {
    let csv = '';
    let filename = 'report.csv';

    if (type === 'sales') {
      filename = 'sales-summary.csv';
      csv = 'Order ID,Customer,Total,Status,Date\n';
      ORDERS().forEach(o => {
        const c = CUSTOMERS().find(x => x.id === o.customerId);
        csv += `"${o.id}","${c ? c.name : 'Unknown'}",${o.total},"${o.status}","${o.date}"\n`;
      });
    } else if (type === 'products') {
      filename = 'top-products.csv';
      const revMap = {};
      ORDERS().forEach(o => { o.items.forEach(item => {
        if (!revMap[item.sku]) revMap[item.sku] = { sku: item.sku, name: item.name, revenue: 0, units: 0 };
        revMap[item.sku].revenue += item.qty * item.price;
        revMap[item.sku].units += item.qty;
      }); });
      csv = 'SKU,Product,Units Sold,Revenue\n';
      Object.values(revMap).sort((a, b) => b.revenue - a.revenue).forEach(p => {
        csv += `"${p.sku}","${p.name}",${p.units},${p.revenue.toFixed(2)}\n`;
      });
    } else if (type === 'customers') {
      filename = 'customer-report.csv';
      csv = 'Customer,Tier,Location,Orders,LTV,Last Order\n';
      CUSTOMERS().sort((a, b) => b.ltv - a.ltv).forEach(c => {
        csv += `"${c.name}","${c.tier}","${c.location}",${c.orders},${c.ltv},"${c.lastOrder}"\n`;
      });
    } else if (type === 'inventory') {
      filename = 'inventory-valuation.csv';
      csv = 'SKU,Product,Category,Stock,Unit Price,Total Value\n';
      PRODUCTS().forEach(p => {
        csv += `"${p.sku}","${p.name}","${categoryLabel(p.category)}",${p.stock},${p.price.toFixed(2)},${(p.stock * p.price).toFixed(2)}\n`;
      });
    } else if (type === 'lowstock') {
      filename = 'low-stock.csv';
      csv = 'SKU,Product,Category,Stock,Status\n';
      PRODUCTS().filter(p => p.stock < 100).sort((a, b) => a.stock - b.stock).forEach(p => {
        const status = p.stock < 20 ? 'CRITICAL' : p.stock < 50 ? 'LOW' : 'WATCH';
        csv += `"${p.sku}","${p.name}","${categoryLabel(p.category)}",${p.stock},"${status}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast(filename + ' downloaded!', 'success');
  };

  /* ═══════════════════════════════════════════════
     6. GLOBAL ANIMATION SYSTEM
  ═══════════════════════════════════════════════ */
  function initAnimationSystem() {
    // Override showView for animated transitions
    const originalShowView = window.showView;
    window.showView = function (viewName) {
      const current = document.querySelector('.view-container.active');
      const target = document.getElementById('view-' + viewName);
      if (!target || current === target) {
        originalShowView(viewName);
        return;
      }

      // Update nav immediately
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      const navItem = document.querySelector('.nav-item[data-view="' + viewName + '"]');
      if (navItem) navItem.classList.add('active');

      if (current) {
        current.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        current.style.opacity = '0';
        current.style.transform = 'translateY(-8px)';
        setTimeout(() => {
          current.classList.remove('active');
          current.style.opacity = '';
          current.style.transform = '';
          current.style.transition = '';
          target.style.opacity = '0';
          target.style.transform = 'translateY(12px)';
          target.classList.add('active');
          requestAnimationFrame(() => {
            target.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            target.style.opacity = '1';
            target.style.transform = 'translateY(0)';
            setTimeout(() => {
              target.style.transition = '';
              target.style.opacity = '';
              target.style.transform = '';
            }, 350);
          });
        }, 160);
      } else {
        originalShowView(viewName);
      }
    };

    // Number count-up animation for KPI values
    function animateCountUp() {
      document.querySelectorAll('.kpi-value').forEach(el => {
        const text = el.textContent.trim();
        const match = text.match(/^\$?([\d,]+\.?\d*)(K|M)?$/);
        if (!match) return;

        const numStr = match[1].replace(/,/g, '');
        const suffix = match[2] || '';
        const hasPrefix = text.startsWith('$');
        const target = parseFloat(numStr);
        if (isNaN(target)) return;

        const duration = 1000;
        const startTime = performance.now();
        el._counted = true;

        function step(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;

          let display;
          if (Number.isInteger(target) && !suffix) {
            display = Math.round(current).toLocaleString('en-US');
          } else {
            display = current.toLocaleString('en-US', {
              minimumFractionDigits: numStr.includes('.') ? numStr.split('.')[1].length : 0,
              maximumFractionDigits: numStr.includes('.') ? numStr.split('.')[1].length : 0
            });
          }
          el.textContent = (hasPrefix ? '$' : '') + display + suffix;

          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }

    // Run count-up after a brief delay for dashboard to render
    setTimeout(animateCountUp, 500);

    // Card hover lift (CSS injection)
    if (!document.getElementById('usa-anim-styles')) {
      const s = document.createElement('style');
      s.id = 'usa-anim-styles';
      s.textContent = `
        .glass-card, .kpi-card {
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
        }
        .glass-card:hover, .kpi-card:hover {
          transform: translateY(-2px) !important;
        }
      `;
      document.head.appendChild(s);
    }
  }

  /* ═══════════════════════════════════════════════
     7. DARK / LIGHT MODE TOGGLE
  ═══════════════════════════════════════════════ */
  function initThemeToggle() {
    const saved = localStorage.getItem('usa-theme');
    if (saved === 'light') document.body.classList.add('light-mode');

    const topbarActions = document.querySelector('.topbar-actions');
    if (!topbarActions) return;

    const btn = document.createElement('button');
    btn.className = 'notif-btn';
    btn.id = 'themeToggleBtn';
    btn.title = 'Toggle Theme';
    btn.innerHTML = document.body.classList.contains('light-mode')
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
    btn.style.cssText = 'position:relative;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);cursor:pointer;transition:all 0.2s;background:transparent;border:none;font-size:16px;';

    btn.addEventListener('click', function () {
      document.body.classList.add('theme-transitioning');
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('usa-theme', isLight ? 'light' : 'dark');
      btn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
      setTimeout(() => document.body.classList.remove('theme-transitioning'), 500);
    });

    topbarActions.insertBefore(btn, topbarActions.firstChild);
  }

  /* ═══════════════════════════════════════════════
     8. FULLSCREEN MODE
  ═══════════════════════════════════════════════ */
  function initFullscreen() {
    const topbarActions = document.querySelector('.topbar-actions');
    if (!topbarActions) return;

    const btn = document.createElement('button');
    btn.className = 'notif-btn';
    btn.id = 'fullscreenBtn';
    btn.title = 'Toggle Fullscreen (F11)';
    btn.innerHTML = '<i class="fas fa-expand"></i>';
    btn.style.cssText = 'position:relative;width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);cursor:pointer;transition:all 0.2s;background:transparent;border:none;font-size:16px;';

    function updateIcon() {
      const isFS = !!document.fullscreenElement;
      btn.innerHTML = isFS ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
    }

    btn.addEventListener('click', function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    document.addEventListener('fullscreenchange', updateIcon);

    // F11 key binding
    document.addEventListener('keydown', function (e) {
      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    });

    // Insert after theme toggle or at beginning
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn && themeBtn.nextSibling) {
      topbarActions.insertBefore(btn, themeBtn.nextSibling);
    } else {
      topbarActions.insertBefore(btn, topbarActions.firstChild);
    }
  }

  /* ═══════════════════════════════════════════════
     KEYBOARD SHORTCUTS
  ═══════════════════════════════════════════════ */
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Ctrl/Cmd+Shift+N — New Order
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        window.openNewOrderModal();
      }
      // Ctrl/Cmd+Shift+R — Reports
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        window.openReports();
      }
      // Ctrl/Cmd+Shift+A — Customer Application
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        window.openNewCustomerApplication();
      }
    });
  }

  /* ═══════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════ */
  function init() {
    injectModalStyles();
    initAnimationSystem();
    initThemeToggle();
    initFullscreen();
    initKeyboardShortcuts();

    // Expose closeModal globally so onclick handlers work
    window.closeModal = closeModal;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
