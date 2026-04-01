/**
 * US Apparel LLC — B2B Catalog, Order Management, Inventory Tracker Views
 * Loaded by index.html after window.APP_DATA is defined.
 * Populates: #view-catalog, #view-orders, #view-inventory
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

  /* ────────────────────────────────────────────
     SHARED STATE
  ──────────────────────────────────────────── */
  let catalogFilter = 'all';
  let catalogSearch = '';
  let catalogSort = 'name-asc';
  let catalogView = 'grid';
  let catalogPage = 1;
  const CATALOG_PER_PAGE = 24;

  let selectedCustomerIdx = 0; // index into CUSTOMERS()
  const TIER_DISCOUNTS = { platinum: 0.20, gold: 0.15, silver: 0.10, standard: 0 };
  const TIER_TERMS = {
    platinum: { terms: 'Net 60', freeShip: 500 },
    gold: { terms: 'Net 45', freeShip: 750 },
    silver: { terms: 'Net 30', freeShip: 1000 },
    standard: { terms: 'Prepaid', freeShip: 2000 }
  };

  let cart = []; // { product, qty }

  let ordersSearch = '';
  let ordersStatusFilter = 'all';
  let selectedOrders = new Set();
  let orderDetailId = null;
  let orderDateFrom = '';
  let orderDateTo = '';

  let inventoryTab = 'critical';
  let stockAdjustProduct = null; // product obj for modal

  /* ────────────────────────────────────────────
     HELPERS
  ──────────────────────────────────────────── */
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function fmt(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  function fmtNum(n) {
    return new Intl.NumberFormat('en-US').format(n);
  }

  function customerTier(c) {
    return (c && c.tier || 'standard').toLowerCase();
  }

  function tierPrice(price, tier) {
    const disc = TIER_DISCOUNTS[tier] || 0;
    return price * (1 - disc);
  }

  function currentCustomer() {
    const custs = CUSTOMERS();
    return custs[selectedCustomerIdx] || { name: 'Guest', tier: 'standard' };
  }

  function categoryColor(cat) {
    const c = (cat || '').toLowerCase();
    if (c.includes('swim')) return { bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)', badge: '#2563eb', label: 'Swimwear' };
    if (c.includes('resort')) return { bg: 'linear-gradient(135deg,#78350f,#d97706)', badge: '#d97706', label: 'Resort' };
    if (c.includes('imprint')) return { bg: 'linear-gradient(135deg,#374151,#6b7280)', badge: '#6b7280', label: 'Imprintables' };
    if (c.includes('last')) return { bg: 'linear-gradient(135deg,#7f1d1d,#dc2626)', badge: '#dc2626', label: 'Last Call' };
    return { bg: 'linear-gradient(135deg,#1e293b,#334155)', badge: '#475569', label: cat || 'Other' };
  }

  function stockColor(stock) {
    if (stock < 50) return '#ef4444';
    if (stock < 100) return '#f59e0b';
    return '#22c55e';
  }

  function statusColor(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('pending')) return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' };
    if (s.includes('processing')) return { bg: 'rgba(168,85,247,0.15)', text: '#a855f7' };
    if (s.includes('shipped')) return { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' };
    if (s.includes('deliver')) return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' };
    if (s.includes('cancel')) return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' };
    return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
  }

  function dateStr(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function generateId(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  /* ────────────────────────────────────────────
     FILTERED / SORTED PRODUCTS
  ──────────────────────────────────────────── */
  function filteredProducts() {
    let prods = PRODUCTS().slice();

    // category filter
    if (catalogFilter !== 'all') {
      prods = prods.filter(p => {
        const cat = (p.category || '').toLowerCase();
        if (catalogFilter === 'swimwear') return cat.includes('swim');
        if (catalogFilter === 'resort') return cat.includes('resort');
        if (catalogFilter === 'imprintables') return cat.includes('imprint');
        if (catalogFilter === 'lastcall') return cat.includes('last');
        return true;
      });
    }

    // search
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      prods = prods.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    // sort
    prods.sort((a, b) => {
      switch (catalogSort) {
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'price-asc': return (a.price || 0) - (b.price || 0);
        case 'price-desc': return (b.price || 0) - (a.price || 0);
        case 'stock-asc': return (a.stock || 0) - (b.stock || 0);
        default: return 0;
      }
    });

    return prods;
  }

  function categoryCounts() {
    const prods = PRODUCTS();
    return {
      all: prods.length,
      swimwear: prods.filter(p => (p.category || '').toLowerCase().includes('swim')).length,
      resort: prods.filter(p => (p.category || '').toLowerCase().includes('resort')).length,
      imprintables: prods.filter(p => (p.category || '').toLowerCase().includes('imprint')).length,
      lastcall: prods.filter(p => (p.category || '').toLowerCase().includes('last')).length
    };
  }

  /* ────────────────────────────────────────────
     CART
  ──────────────────────────────────────────── */
  function addToCart(product, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    const existing = cart.find(c => c.product.sku === product.sku);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ product, qty });
    }
    renderCatalog();
  }

  function removeFromCart(sku) {
    cart = cart.filter(c => c.product.sku !== sku);
    renderCatalog();
  }

  function updateCartQty(sku, qty) {
    qty = Math.max(1, parseInt(qty, 10) || 1);
    const item = cart.find(c => c.product.sku === sku);
    if (item) item.qty = qty;
    renderCatalog();
  }

  function clearCart() {
    cart = [];
    renderCatalog();
  }

  function cartTotal() {
    const tier = customerTier(currentCustomer());
    return cart.reduce((sum, c) => sum + tierPrice(c.product.price || 0, tier) * c.qty, 0);
  }

  /* ────────────────────────────────────────────
     STYLES (injected once)
  ──────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('usa-views-styles')) return;
    const style = document.createElement('style');
    style.id = 'usa-views-styles';
    style.textContent = `
      /* ── Base ──────────────────── */
      .usa-view { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e2e8f0; }
      .usa-view * { box-sizing: border-box; }

      /* ── Glass Card ────────────── */
      .glass { background: rgba(15,23,42,0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }
      .glass-sm { background: rgba(15,23,42,0.5); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; }

      /* ── Section Header ────────── */
      .view-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
      .view-title { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0; }
      .view-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 2px 0 0; }

      /* ── Buttons ────────────────── */
      .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.06); color: #e2e8f0; font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
      .btn:hover { background: rgba(255,255,255,0.12); }
      .btn-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
      .btn-primary:hover { background: #1d4ed8; }
      .btn-success { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: #22c55e; }
      .btn-danger { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
      .btn-sm { padding: 5px 10px; font-size: 0.75rem; border-radius: 6px; }
      .btn-active { background: #2563eb; border-color: #2563eb; color: #fff; }
      .btn-group { display: flex; gap: 6px; flex-wrap: wrap; }

      /* ── Inputs ──────────────────── */
      .input { padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.06); color: #e2e8f0; font-size: 0.82rem; outline: none; transition: border-color 0.15s; }
      .input:focus { border-color: #2563eb; }
      .input-sm { padding: 5px 8px; font-size: 0.75rem; border-radius: 6px; }
      select.input { cursor: pointer; }

      /* ── Badge ───────────────────── */
      .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

      /* ── Stat Card ───────────────── */
      .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px; }
      .stat-card { padding: 18px; display: flex; flex-direction: column; gap: 4px; }
      .stat-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #fff; }
      .stat-sub { font-size: 0.72rem; color: #64748b; }

      /* ── Table ───────────────────── */
      .tbl-wrap { overflow-x: auto; }
      .tbl { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
      .tbl th { text-align: left; padding: 10px 12px; color: #94a3b8; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.06); white-space: nowrap; }
      .tbl td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
      .tbl tr:hover td { background: rgba(255,255,255,0.03); }
      .tbl input[type="checkbox"] { accent-color: #2563eb; width: 15px; height: 15px; cursor: pointer; }

      /* ── Tabs ─────────────────────── */
      .tab-bar { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0; }
      .tab-btn { padding: 8px 16px; font-size: 0.8rem; font-weight: 500; color: #94a3b8; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
      .tab-btn:hover { color: #e2e8f0; }
      .tab-btn.active { color: #fff; border-bottom-color: #2563eb; }
      .tab-btn .tab-count { font-size: 0.7rem; margin-left: 4px; padding: 1px 6px; border-radius: 9999px; }

      /* ── Product Grid ────────────── */
      .prod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
      .prod-card { overflow: hidden; transition: transform 0.15s, box-shadow 0.15s; position: relative; }
      .prod-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
      .prod-img { width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; font-size: 3rem; position: relative; }
      .prod-badge-cat { position: absolute; top: 8px; right: 8px; padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 600; color: #fff; }
      .prod-badge-low { position: absolute; top: 8px; left: 8px; padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 700; background: rgba(239,68,68,0.85); color: #fff; }
      .prod-body { padding: 14px; }
      .prod-sku { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.7rem; color: #64748b; }
      .prod-name { font-weight: 600; font-size: 0.92rem; color: #fff; margin: 4px 0; line-height: 1.3; }
      .prod-meta { font-size: 0.72rem; color: #94a3b8; margin-bottom: 6px; }
      .prod-prices { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
      .prod-price-orig { text-decoration: line-through; color: #64748b; font-size: 0.78rem; }
      .prod-price-tier { color: #22c55e; font-weight: 700; font-size: 1rem; }
      .prod-stock { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; margin-bottom: 10px; }
      .prod-stock-dot { width: 8px; height: 8px; border-radius: 50%; }
      .prod-swatches { display: flex; gap: 3px; margin-bottom: 10px; }
      .prod-swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); }
      .prod-actions { display: flex; gap: 6px; align-items: center; }
      .prod-qty-wrap { display: flex; align-items: center; gap: 4px; }
      .prod-qty-wrap input { width: 48px; text-align: center; }

      /* ── Cart Sidebar ────────────── */
      .cart-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; background: rgba(0,0,0,0.5); z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
      .cart-overlay.open { opacity: 1; pointer-events: auto; }
      .cart-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 380px; max-width: 90vw; background: #0f172a; border-left: 1px solid rgba(255,255,255,0.08); z-index: 1000; transform: translateX(100%); transition: transform 0.3s; display: flex; flex-direction: column; }
      .cart-panel.open { transform: translateX(0); }
      .cart-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .cart-header h3 { margin: 0; font-size: 1.1rem; color: #fff; }
      .cart-close { background: none; border: none; color: #94a3b8; font-size: 1.3rem; cursor: pointer; padding: 4px; }
      .cart-close:hover { color: #fff; }
      .cart-items { flex: 1; overflow-y: auto; padding: 12px 20px; }
      .cart-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; }
      .cart-item-img { width: 48px; height: 48px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
      .cart-item-info { flex: 1; min-width: 0; }
      .cart-item-name { font-size: 0.8rem; font-weight: 600; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cart-item-sku { font-family: monospace; font-size: 0.68rem; color: #64748b; }
      .cart-item-price { font-size: 0.78rem; color: #22c55e; font-weight: 600; }
      .cart-item-controls { display: flex; align-items: center; gap: 4px; }
      .cart-item-controls input { width: 40px; text-align: center; }
      .cart-item-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; padding: 2px 4px; }
      .cart-footer { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.06); }
      .cart-total { display: flex; justify-content: space-between; font-size: 1rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
      .cart-actions { display: flex; gap: 8px; }
      .cart-badge-float { position: fixed; bottom: 24px; right: 24px; z-index: 998; padding: 12px 20px; border-radius: 50px; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(37,99,235,0.4); display: none; align-items: center; gap: 8px; font-size: 0.9rem; border: none; }
      .cart-badge-float.visible { display: flex; }

      /* ── Pagination ──────────────── */
      .pagination { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 20px; }
      .page-btn { min-width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #94a3b8; font-size: 0.8rem; cursor: pointer; }
      .page-btn:hover { background: rgba(255,255,255,0.1); }
      .page-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; }
      .page-btn:disabled { opacity: 0.3; cursor: default; }

      /* ── Order Detail Modal ──────── */
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1001; display: flex; align-items: flex-start; justify-content: flex-end; opacity: 0; pointer-events: none; transition: opacity 0.25s; }
      .modal-overlay.open { opacity: 1; pointer-events: auto; }
      .modal-panel { width: 560px; max-width: 95vw; height: 100vh; overflow-y: auto; background: #0f172a; border-left: 1px solid rgba(255,255,255,0.08); transform: translateX(100%); transition: transform 0.3s; padding: 0; }
      .modal-overlay.open .modal-panel { transform: translateX(0); }
      .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; background: #0f172a; z-index: 1; }
      .modal-header h3 { margin: 0; font-size: 1.1rem; color: #fff; }
      .modal-body { padding: 20px 24px; }
      .modal-section { margin-bottom: 20px; }
      .modal-section h4 { font-size: 0.82rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px; }

      /* ── Timeline ────────────────── */
      .timeline { position: relative; padding-left: 24px; }
      .timeline::before { content: ''; position: absolute; left: 7px; top: 4px; bottom: 4px; width: 2px; background: rgba(255,255,255,0.08); }
      .timeline-item { position: relative; margin-bottom: 16px; }
      .timeline-dot { position: absolute; left: -24px; top: 2px; width: 16px; height: 16px; border-radius: 50%; border: 2px solid; display: flex; align-items: center; justify-content: center; }
      .timeline-dot.done { background: #22c55e; border-color: #22c55e; }
      .timeline-dot.current { background: #2563eb; border-color: #2563eb; box-shadow: 0 0 8px rgba(37,99,235,0.5); }
      .timeline-dot.pending { background: transparent; border-color: #475569; }
      .timeline-label { font-size: 0.82rem; font-weight: 600; color: #e2e8f0; }
      .timeline-time { font-size: 0.7rem; color: #64748b; }

      /* ── Bulk Actions Bar ────────── */
      .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; margin-bottom: 12px; border: 1px solid rgba(37,99,235,0.3); background: rgba(37,99,235,0.08); border-radius: 8px; }
      .bulk-bar .bulk-count { font-size: 0.82rem; font-weight: 600; color: #93c5fd; }

      /* ── Inventory Bar ───────────── */
      .stock-bar-outer { width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
      .stock-bar-inner { height: 100%; border-radius: 4px; transition: width 0.3s; }

      /* ── Capacity Bar ────────────── */
      .capacity-bar { width: 100%; height: 10px; background: rgba(255,255,255,0.06); border-radius: 5px; overflow: hidden; margin-top: 6px; }
      .capacity-fill { height: 100%; border-radius: 5px; }

      /* ── Charts (simple CSS) ─────── */
      .hbar-chart { display: flex; flex-direction: column; gap: 8px; }
      .hbar-row { display: flex; align-items: center; gap: 10px; }
      .hbar-label { min-width: 100px; font-size: 0.75rem; color: #94a3b8; text-align: right; }
      .hbar-track { flex: 1; height: 22px; background: rgba(255,255,255,0.04); border-radius: 4px; overflow: hidden; position: relative; }
      .hbar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 8px; font-size: 0.68rem; font-weight: 600; color: #fff; transition: width 0.5s; }
      .hbar-val { min-width: 50px; font-size: 0.75rem; color: #e2e8f0; text-align: right; }

      /* ── Stock Modal ─────────────── */
      .stock-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1002; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
      .stock-modal-overlay.open { opacity: 1; pointer-events: auto; }
      .stock-modal { width: 400px; max-width: 90vw; border-radius: 12px; padding: 24px; }
      .stock-modal h3 { margin: 0 0 4px; font-size: 1rem; color: #fff; }
      .stock-modal .stock-modal-sub { font-size: 0.78rem; color: #94a3b8; margin-bottom: 16px; }
      .stock-modal label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 4px; margin-top: 10px; }
      .stock-modal .field { width: 100%; }
      .stock-modal .stock-modal-actions { display: flex; gap: 8px; margin-top: 18px; justify-content: flex-end; }

      /* ── Pulse dot ───────────────── */
      .pulse-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; animation: pulse-anim 2s infinite; }
      @keyframes pulse-anim { 0%,100%{ opacity: 1; } 50%{ opacity: 0.3; } }

      /* ── Pricing Banner ──────────── */
      .pricing-banner { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; margin-bottom: 16px; }
      .pricing-banner .pb-label { font-size: 0.8rem; color: #94a3b8; }
      .pricing-banner .pb-customer { font-weight: 700; color: #fff; font-size: 0.9rem; }
      .pricing-banner .pb-info { display: flex; gap: 16px; margin-left: auto; flex-wrap: wrap; }
      .pricing-banner .pb-info span { font-size: 0.75rem; color: #94a3b8; }
      .pricing-banner .pb-info strong { color: #e2e8f0; }

      /* ── Chart area placeholder ──── */
      .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
      @media (max-width: 768px) { .chart-row { grid-template-columns: 1fr; } }
      .chart-card { padding: 18px; }
      .chart-card h4 { margin: 0 0 14px; font-size: 0.85rem; color: #e2e8f0; }

      /* ── Line chart (CSS) ────────── */
      .line-chart-wrap { position: relative; height: 180px; display: flex; align-items: flex-end; gap: 2px; padding-bottom: 20px; }
      .line-chart-bar { flex: 1; border-radius: 3px 3px 0 0; transition: height 0.3s; min-width: 4px; }
      .line-chart-labels { position: absolute; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 0.6rem; color: #64748b; }

      /* ── Responsive ──────────────── */
      @media (max-width: 640px) {
        .prod-grid { grid-template-columns: 1fr; }
        .stat-row { grid-template-columns: 1fr 1fr; }
        .cart-panel { width: 100vw; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ================================================================
     VIEW 1: B2B CATALOG
  ================================================================ */
  function renderCatalog() {
    injectStyles();
    const container = document.getElementById('view-catalog');
    if (!container) return;

    const prods = filteredProducts();
    const counts = categoryCounts();
    const cust = currentCustomer();
    const tier = customerTier(cust);
    const tierInfo = TIER_TERMS[tier] || TIER_TERMS.standard;
    const totalPages = Math.ceil(prods.length / CATALOG_PER_PAGE);
    if (catalogPage > totalPages) catalogPage = Math.max(1, totalPages);
    const pageProds = prods.slice((catalogPage - 1) * CATALOG_PER_PAGE, catalogPage * CATALOG_PER_PAGE);
    const cartOpen = container.querySelector('.cart-panel.open') ? true : false;

    let html = '<div class="usa-view">';

    // ── Header ──
    html += `
      <div class="view-header">
        <div>
          <h2 class="view-title">B2B Product Catalog</h2>
          <p class="view-subtitle">${counts.all} products across 4 collections &mdash; Spring/Summer 2026</p>
        </div>
      </div>`;

    // ── Filter bar ──
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;">';
    const filters = [
      { key: 'all', label: `All (${counts.all})` },
      { key: 'swimwear', label: `Swimwear (${counts.swimwear})` },
      { key: 'resort', label: `Resort (${counts.resort})` },
      { key: 'imprintables', label: `Imprintables (${counts.imprintables})` },
      { key: 'lastcall', label: `Last Call (${counts.lastcall})` }
    ];
    filters.forEach(f => {
      html += `<button class="btn btn-sm${catalogFilter === f.key ? ' btn-active' : ''}" data-catfilter="${f.key}">${f.label}</button>`;
    });
    html += '</div>';

    // ── Search + Sort + View toggle ──
    html += `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;">
        <input class="input" type="text" placeholder="Search by name or SKU..." value="${esc(catalogSearch)}" data-catsearch style="flex:1;min-width:200px;">
        <select class="input" data-catsort>
          <option value="name-asc"${catalogSort === 'name-asc' ? ' selected' : ''}>Name A-Z</option>
          <option value="name-desc"${catalogSort === 'name-desc' ? ' selected' : ''}>Name Z-A</option>
          <option value="price-asc"${catalogSort === 'price-asc' ? ' selected' : ''}>Price Low-High</option>
          <option value="price-desc"${catalogSort === 'price-desc' ? ' selected' : ''}>Price High-Low</option>
          <option value="stock-asc"${catalogSort === 'stock-asc' ? ' selected' : ''}>Stock Low-High</option>
        </select>
        <button class="btn btn-sm${catalogView === 'grid' ? ' btn-active' : ''}" data-catview="grid" title="Grid view">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
        </button>
        <button class="btn btn-sm${catalogView === 'list' ? ' btn-active' : ''}" data-catview="list" title="List view">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="3" x2="15" y2="3"/><line x1="1" y1="8" x2="15" y2="8"/><line x1="1" y1="13" x2="15" y2="13"/></svg>
        </button>
      </div>`;

    // ── Customer Pricing Banner ──
    const custOptions = CUSTOMERS().map((c, i) =>
      `<option value="${i}"${i === selectedCustomerIdx ? ' selected' : ''}>${esc(c.name)} (${(c.tier || 'standard').toUpperCase()})</option>`
    ).join('');
    html += `
      <div class="glass-sm pricing-banner">
        <span class="pb-label">Viewing as:</span>
        <span class="pb-customer">${esc(cust.name)}</span>
        <span class="badge" style="background:${tier === 'platinum' ? '#2563eb' : tier === 'gold' ? '#d97706' : tier === 'silver' ? '#94a3b8' : '#475569'};color:#fff;margin-left:4px;">${tier.toUpperCase()}</span>
        <select class="input input-sm" data-custselect style="margin-left:8px;">${custOptions}</select>
        <div class="pb-info">
          <span>Discount: <strong>${Math.round((TIER_DISCOUNTS[tier] || 0) * 100)}%</strong></span>
          <span>Terms: <strong>${tierInfo.terms}</strong></span>
          <span>Free ship: <strong>${fmt(tierInfo.freeShip)}+</strong></span>
        </div>
      </div>`;

    // ── Products ──
    if (pageProds.length === 0) {
      html += '<div class="glass" style="padding:40px;text-align:center;color:#64748b;">No products match your filters.</div>';
    } else if (catalogView === 'grid') {
      // Grid view
      html += '<div class="prod-grid">';
      pageProds.forEach(p => {
        const cc = categoryColor(p.category);
        const tp = tierPrice(p.price || 0, tier);
        const colors = p.colors || [];
        const inCart = cart.find(c => c.product.sku === p.sku);
        html += `
          <div class="glass prod-card">
            <div class="prod-img" style="background:${cc.bg};">
              <span style="opacity:0.3;">&#128085;</span>
              <span class="prod-badge-cat" style="background:${cc.badge};">${esc(cc.label)}</span>
              ${(p.stock || 0) < 50 ? '<span class="prod-badge-low">LOW STOCK</span>' : ''}
            </div>
            <div class="prod-body">
              <div class="prod-sku">${esc(p.sku || '')}</div>
              <div class="prod-name">${esc(p.name || '')}</div>
              <div class="prod-meta">${esc(p.subcategory || '')}${colors.length ? ' &middot; ' + colors.length + ' colors' : ''}</div>
              <div class="prod-prices">
                <span class="prod-price-orig">${fmt(p.price || 0)}</span>
                <span class="prod-price-tier">${fmt(tp)}</span>
              </div>
              <div class="prod-stock">
                <span class="prod-stock-dot" style="background:${stockColor(p.stock || 0)};"></span>
                <span style="color:${stockColor(p.stock || 0)};">${fmtNum(p.stock || 0)} units</span>
              </div>
              ${colors.length ? '<div class="prod-swatches">' + colors.slice(0, 8).map(cl => `<span class="prod-swatch" style="background:${esc(cl)};" title="${esc(cl)}"></span>`).join('') + (colors.length > 8 ? `<span style="font-size:0.65rem;color:#94a3b8;">+${colors.length - 8}</span>` : '') + '</div>' : ''}
              <div class="prod-actions">
                ${inCart
                  ? `<div class="prod-qty-wrap">
                      <input class="input input-sm" type="number" min="1" value="${inCart.qty}" data-cartqty="${esc(p.sku)}">
                      <button class="btn btn-sm btn-danger" data-cartremove="${esc(p.sku)}">&times;</button>
                    </div>`
                  : `<div class="prod-qty-wrap">
                      <input class="input input-sm" type="number" min="1" value="1" data-addqty="${esc(p.sku)}" style="display:none;">
                      <button class="btn btn-sm btn-primary" data-addtocart="${esc(p.sku)}">Add to Order</button>
                    </div>`
                }
              </div>
            </div>
          </div>`;
      });
      html += '</div>';
    } else {
      // List view
      html += `
        <div class="glass tbl-wrap" style="padding:0;">
          <table class="tbl">
            <thead><tr>
              <th style="width:30px;"><input type="checkbox" data-catselectall></th>
              <th style="width:50px;"></th>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Colors</th>
              <th>Price</th>
              <th>Tier Price</th>
              <th>Stock</th>
              <th style="width:120px;"></th>
            </tr></thead>
            <tbody>`;
      pageProds.forEach(p => {
        const cc = categoryColor(p.category);
        const tp = tierPrice(p.price || 0, tier);
        html += `
          <tr>
            <td><input type="checkbox" data-catcheck="${esc(p.sku)}"></td>
            <td><div style="width:40px;height:40px;border-radius:6px;background:${cc.bg};display:flex;align-items:center;justify-content:center;font-size:1rem;opacity:0.6;">&#128085;</div></td>
            <td style="font-family:monospace;font-size:0.75rem;color:#94a3b8;">${esc(p.sku || '')}</td>
            <td style="font-weight:600;color:#fff;">${esc(p.name || '')}</td>
            <td><span class="badge" style="background:${cc.badge};color:#fff;">${esc(cc.label)}</span></td>
            <td style="font-size:0.75rem;">${(p.colors || []).length}</td>
            <td style="color:#64748b;text-decoration:line-through;">${fmt(p.price || 0)}</td>
            <td style="color:#22c55e;font-weight:700;">${fmt(tp)}</td>
            <td><span style="color:${stockColor(p.stock || 0)};">${fmtNum(p.stock || 0)}</span></td>
            <td><button class="btn btn-sm btn-primary" data-addtocart="${esc(p.sku)}">Add</button></td>
          </tr>`;
      });
      html += '</tbody></table></div>';
    }

    // ── Pagination ──
    if (totalPages > 1) {
      html += '<div class="pagination">';
      html += `<button class="page-btn" data-catpage="${catalogPage - 1}"${catalogPage === 1 ? ' disabled' : ''}>&laquo;</button>`;
      for (let i = 1; i <= totalPages; i++) {
        if (totalPages <= 7 || Math.abs(i - catalogPage) <= 2 || i === 1 || i === totalPages) {
          html += `<button class="page-btn${i === catalogPage ? ' active' : ''}" data-catpage="${i}">${i}</button>`;
        } else if (i === catalogPage - 3 || i === catalogPage + 3) {
          html += '<span style="color:#64748b;padding:0 4px;">&hellip;</span>';
        }
      }
      html += `<button class="page-btn" data-catpage="${catalogPage + 1}"${catalogPage === totalPages ? ' disabled' : ''}>&raquo;</button>`;
      html += '</div>';
    }

    // ── Cart floating button ──
    html += `<button class="cart-badge-float${cart.length ? ' visible' : ''}" data-opencart>
      &#128722; Cart (${cart.length} item${cart.length !== 1 ? 's' : ''}) &mdash; ${fmt(cartTotal())}
    </button>`;

    // ── Cart overlay + panel ──
    html += `
      <div class="cart-overlay${cartOpen ? ' open' : ''}" data-cartoverlay></div>
      <div class="cart-panel${cartOpen ? ' open' : ''}" data-cartpanel>
        <div class="cart-header">
          <h3>&#128722; Order Cart (${cart.length})</h3>
          <button class="cart-close" data-closecart>&times;</button>
        </div>
        <div class="cart-items">`;
    if (cart.length === 0) {
      html += '<div style="text-align:center;padding:40px 0;color:#64748b;">Cart is empty</div>';
    } else {
      cart.forEach(c => {
        const cc = categoryColor(c.product.category);
        const tp = tierPrice(c.product.price || 0, tier);
        html += `
          <div class="cart-item">
            <div class="cart-item-img" style="background:${cc.bg};">&#128085;</div>
            <div class="cart-item-info">
              <div class="cart-item-name">${esc(c.product.name)}</div>
              <div class="cart-item-sku">${esc(c.product.sku)}</div>
              <div class="cart-item-price">${fmt(tp)} &times; ${c.qty} = ${fmt(tp * c.qty)}</div>
            </div>
            <div class="cart-item-controls">
              <input class="input input-sm" type="number" min="1" value="${c.qty}" data-cartqty="${esc(c.product.sku)}">
              <button class="cart-item-remove" data-cartremove="${esc(c.product.sku)}">&times;</button>
            </div>
          </div>`;
      });
    }
    html += `</div>
        <div class="cart-footer">
          <div class="cart-total"><span>Total</span><span>${fmt(cartTotal())}</span></div>
          <div class="cart-actions">
            <button class="btn btn-danger btn-sm" data-clearcart ${cart.length === 0 ? 'disabled' : ''}>Clear Cart</button>
            <button class="btn btn-primary" data-placeorder style="flex:1;" ${cart.length === 0 ? 'disabled' : ''}>Place Order</button>
          </div>
        </div>
      </div>`;

    html += '</div>'; // end usa-view
    container.innerHTML = html;

    // ── Event Binding ──
    bindCatalogEvents(container);
  }

  function bindCatalogEvents(container) {
    // Category filter buttons
    container.querySelectorAll('[data-catfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        catalogFilter = btn.dataset.catfilter;
        catalogPage = 1;
        renderCatalog();
      });
    });

    // Search
    const searchInput = container.querySelector('[data-catsearch]');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          catalogSearch = searchInput.value;
          catalogPage = 1;
          renderCatalog();
          // re-focus search
          const newInput = document.querySelector('[data-catsearch]');
          if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = newInput.value.length; }
        }, 200);
      });
    }

    // Sort
    const sortSelect = container.querySelector('[data-catsort]');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        catalogSort = sortSelect.value;
        renderCatalog();
      });
    }

    // View toggle
    container.querySelectorAll('[data-catview]').forEach(btn => {
      btn.addEventListener('click', () => {
        catalogView = btn.dataset.catview;
        renderCatalog();
      });
    });

    // Customer select
    const custSelect = container.querySelector('[data-custselect]');
    if (custSelect) {
      custSelect.addEventListener('change', () => {
        selectedCustomerIdx = parseInt(custSelect.value, 10);
        renderCatalog();
      });
    }

    // Add to cart
    container.querySelectorAll('[data-addtocart]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.dataset.addtocart;
        const qtyInput = container.querySelector(`[data-addqty="${sku}"]`);
        // Show qty input on first click if hidden
        if (qtyInput && qtyInput.style.display === 'none') {
          qtyInput.style.display = '';
          qtyInput.focus();
          btn.textContent = 'Add';
          // On second click or just add
          return;
        }
        const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
        const product = PRODUCTS().find(p => p.sku === sku);
        if (product) addToCart(product, qty);
      });
    });

    // Cart quantity update
    container.querySelectorAll('[data-cartqty]').forEach(inp => {
      inp.addEventListener('change', () => {
        updateCartQty(inp.dataset.cartqty, inp.value);
      });
    });

    // Cart remove
    container.querySelectorAll('[data-cartremove]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(btn.dataset.cartremove);
      });
    });

    // Open cart
    const openCartBtn = container.querySelector('[data-opencart]');
    if (openCartBtn) {
      openCartBtn.addEventListener('click', () => {
        const panel = container.querySelector('[data-cartpanel]');
        const overlay = container.querySelector('[data-cartoverlay]');
        if (panel) panel.classList.add('open');
        if (overlay) overlay.classList.add('open');
      });
    }

    // Close cart
    const closeCartBtn = container.querySelector('[data-closecart]');
    if (closeCartBtn) {
      closeCartBtn.addEventListener('click', () => {
        const panel = container.querySelector('[data-cartpanel]');
        const overlay = container.querySelector('[data-cartoverlay]');
        if (panel) panel.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
      });
    }
    const cartOverlay = container.querySelector('[data-cartoverlay]');
    if (cartOverlay) {
      cartOverlay.addEventListener('click', () => {
        const panel = container.querySelector('[data-cartpanel]');
        cartOverlay.classList.remove('open');
        if (panel) panel.classList.remove('open');
      });
    }

    // Clear cart
    const clearBtn = container.querySelector('[data-clearcart]');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);

    // Place order
    const placeBtn = container.querySelector('[data-placeorder]');
    if (placeBtn) {
      placeBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        const cust = currentCustomer();
        const tier = customerTier(cust);
        const items = cart.map(c => ({
          sku: c.product.sku,
          name: c.product.name,
          qty: c.qty,
          unitPrice: tierPrice(c.product.price || 0, tier),
          subtotal: tierPrice(c.product.price || 0, tier) * c.qty
        }));
        const newOrder = {
          id: generateId('ORD'),
          customer: cust.name,
          customerId: cust.id || null,
          items: items,
          total: cartTotal(),
          status: 'Pending Review',
          shipMethod: 'UPS Ground',
          tracking: null,
          date: new Date().toISOString(),
          notes: ''
        };
        ORDERS().push(newOrder);
        cart = [];
        renderCatalog();
        renderOrders();
        alert('Order ' + newOrder.id + ' placed successfully!');
      });
    }

    // Pagination
    container.querySelectorAll('[data-catpage]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        catalogPage = parseInt(btn.dataset.catpage, 10);
        renderCatalog();
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ================================================================
     VIEW 2: ORDER MANAGEMENT
  ================================================================ */
  function renderOrders() {
    injectStyles();
    const container = document.getElementById('view-orders');
    if (!container) return;

    const allOrders = ORDERS();

    // Filter orders
    let filtered = allOrders.slice();
    if (ordersStatusFilter !== 'all') {
      filtered = filtered.filter(o => (o.status || '').toLowerCase().includes(ordersStatusFilter));
    }
    if (ordersSearch.trim()) {
      const q = ordersSearch.toLowerCase().trim();
      filtered = filtered.filter(o =>
        (o.id || '').toLowerCase().includes(q) ||
        (o.customer || '').toLowerCase().includes(q)
      );
    }
    if (orderDateFrom) {
      const from = new Date(orderDateFrom);
      filtered = filtered.filter(o => new Date(o.date) >= from);
    }
    if (orderDateTo) {
      const to = new Date(orderDateTo);
      to.setHours(23, 59, 59);
      filtered = filtered.filter(o => new Date(o.date) <= to);
    }

    // Counts by status
    const statusCounts = {
      pending: allOrders.filter(o => (o.status || '').toLowerCase().includes('pending')).length,
      processing: allOrders.filter(o => (o.status || '').toLowerCase().includes('processing')).length,
      shipped: allOrders.filter(o => (o.status || '').toLowerCase().includes('shipped')).length,
      delivered: allOrders.filter(o => (o.status || '').toLowerCase().includes('deliver')).length
    };

    let html = '<div class="usa-view">';

    // ── Header ──
    html += `
      <div class="view-header">
        <div>
          <h2 class="view-title">Order Management</h2>
          <p class="view-subtitle">${allOrders.length} total orders &mdash; ${statusCounts.pending} pending review</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <input class="input input-sm" type="date" value="${esc(orderDateFrom)}" data-orderdatefrom title="From date">
          <input class="input input-sm" type="date" value="${esc(orderDateTo)}" data-orderdateto title="To date">
          <input class="input" type="text" placeholder="Search orders..." value="${esc(ordersSearch)}" data-ordersearch style="min-width:180px;">
          <button class="btn btn-primary" data-neworder>+ New Order</button>
          <button class="btn" data-exportcsv>Export CSV</button>
        </div>
      </div>`;

    // ── Stat Cards ──
    html += `
      <div class="stat-row">
        <div class="glass stat-card" style="border-left:3px solid #f59e0b;">
          <span class="stat-label">Pending Review</span>
          <span class="stat-value" style="color:#f59e0b;">${statusCounts.pending}</span>
          <span class="stat-sub">Awaiting approval</span>
        </div>
        <div class="glass stat-card" style="border-left:3px solid #a855f7;">
          <span class="stat-label">Processing</span>
          <span class="stat-value" style="color:#a855f7;">${statusCounts.processing}</span>
          <span class="stat-sub">Being prepared</span>
        </div>
        <div class="glass stat-card" style="border-left:3px solid #3b82f6;">
          <span class="stat-label">Shipped</span>
          <span class="stat-value" style="color:#3b82f6;">${statusCounts.shipped}</span>
          <span class="stat-sub">In transit</span>
        </div>
        <div class="glass stat-card" style="border-left:3px solid #22c55e;">
          <span class="stat-label">Delivered</span>
          <span class="stat-value" style="color:#22c55e;">${statusCounts.delivered}</span>
          <span class="stat-sub">Completed</span>
        </div>
      </div>`;

    // ── Bulk Actions ──
    if (selectedOrders.size > 0) {
      html += `
        <div class="bulk-bar">
          <span class="bulk-count">${selectedOrders.size} order${selectedOrders.size !== 1 ? 's' : ''} selected</span>
          <button class="btn btn-sm" data-bulkstatus="Processing">Mark as Processing</button>
          <button class="btn btn-sm" data-bulkstatus="Shipped">Mark as Shipped</button>
          <button class="btn btn-sm" data-bulkprint>Print Labels</button>
          <button class="btn btn-sm" data-bulkexport>Export Selected</button>
          <button class="btn btn-sm btn-danger" data-bulkclear>Clear Selection</button>
        </div>`;
    }

    // ── Status filter tabs ──
    html += `
      <div class="tab-bar">
        <button class="tab-btn${ordersStatusFilter === 'all' ? ' active' : ''}" data-ordstatusfilter="all">All <span class="tab-count" style="background:rgba(255,255,255,0.08);">${allOrders.length}</span></button>
        <button class="tab-btn${ordersStatusFilter === 'pending' ? ' active' : ''}" data-ordstatusfilter="pending">Pending <span class="tab-count" style="background:rgba(245,158,11,0.2);color:#f59e0b;">${statusCounts.pending}</span></button>
        <button class="tab-btn${ordersStatusFilter === 'processing' ? ' active' : ''}" data-ordstatusfilter="processing">Processing <span class="tab-count" style="background:rgba(168,85,247,0.2);color:#a855f7;">${statusCounts.processing}</span></button>
        <button class="tab-btn${ordersStatusFilter === 'shipped' ? ' active' : ''}" data-ordstatusfilter="shipped">Shipped <span class="tab-count" style="background:rgba(59,130,246,0.2);color:#3b82f6;">${statusCounts.shipped}</span></button>
        <button class="tab-btn${ordersStatusFilter === 'deliver' ? ' active' : ''}" data-ordstatusfilter="deliver">Delivered <span class="tab-count" style="background:rgba(34,197,94,0.2);color:#22c55e;">${statusCounts.delivered}</span></button>
      </div>`;

    // ── Orders Table ──
    html += `
      <div class="glass tbl-wrap" style="padding:0;">
        <table class="tbl">
          <thead><tr>
            <th style="width:30px;"><input type="checkbox" data-ordselectall></th>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Ship Method</th>
            <th>Tracking</th>
            <th>Date</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>`;

    if (filtered.length === 0) {
      html += '<tr><td colspan="10" style="text-align:center;color:#64748b;padding:30px;">No orders found.</td></tr>';
    } else {
      filtered.forEach(o => {
        const sc = statusColor(o.status);
        const isSelected = selectedOrders.has(o.id);
        const items = o.items || [];
        const itemSummary = items.length <= 2
          ? items.map(it => `${esc(it.name || it.sku || '?')} &times;${it.qty}`).join(', ')
          : `${esc(items[0].name || items[0].sku || '?')} &times;${items[0].qty} +${items.length - 1} more`;

        html += `
          <tr>
            <td><input type="checkbox" data-ordcheck="${esc(o.id)}" ${isSelected ? 'checked' : ''}></td>
            <td style="font-family:monospace;color:#3b82f6;cursor:pointer;font-weight:600;" data-orderdetail="${esc(o.id)}">${esc(o.id)}</td>
            <td style="font-weight:500;">${esc(o.customer || '—')}</td>
            <td>
              <span style="font-size:0.78rem;">${itemSummary}</span>
              ${items.length > 0 ? `<button class="btn btn-sm" style="padding:2px 6px;font-size:0.65rem;margin-left:4px;" data-expanditems="${esc(o.id)}">&#9660;</button>` : ''}
              <div data-itemsexpanded="${esc(o.id)}" style="display:none;margin-top:6px;font-size:0.72rem;color:#94a3b8;">
                ${items.map(it => `<div style="padding:2px 0;">${esc(it.sku || '')} &mdash; ${esc(it.name || '')} &times;${it.qty}</div>`).join('')}
              </div>
            </td>
            <td style="font-weight:700;color:#fff;">${fmt(o.total || 0)}</td>
            <td><span class="badge" style="background:${sc.bg};color:${sc.text};">${esc(o.status || '—')}</span></td>
            <td style="font-size:0.78rem;">${esc(o.shipMethod || '—')}</td>
            <td style="font-family:monospace;font-size:0.72rem;">${o.tracking ? `<a href="#" style="color:#3b82f6;text-decoration:none;">${esc(o.tracking)}</a>` : '<span style="color:#475569;">—</span>'}</td>
            <td style="font-size:0.78rem;white-space:nowrap;">${dateStr(o.date)}</td>
            <td>
              <div style="display:flex;gap:4px;">
                <button class="btn btn-sm" data-orderdetail="${esc(o.id)}" title="View">&#128065;</button>
                <button class="btn btn-sm" data-ordedit="${esc(o.id)}" title="Edit">&#9998;</button>
                <button class="btn btn-sm" data-ordprint="${esc(o.id)}" title="Print Invoice">&#128424;</button>
              </div>
            </td>
          </tr>`;
      });
    }

    html += '</tbody></table></div>';

    // ── Order Detail Modal ──
    const detailOrder = orderDetailId ? allOrders.find(o => o.id === orderDetailId) : null;
    html += `
      <div class="modal-overlay${detailOrder ? ' open' : ''}" data-ordermodaloverlay>
        <div class="modal-panel">
          ${detailOrder ? renderOrderDetailContent(detailOrder) : ''}
        </div>
      </div>`;

    html += '</div>';
    container.innerHTML = html;

    bindOrderEvents(container);
  }

  function renderOrderDetailContent(o) {
    const sc = statusColor(o.status);
    const items = o.items || [];
    const statuses = ['Pending Review', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = statuses.findIndex(s => (o.status || '').toLowerCase().includes(s.toLowerCase().split(' ')[0]));

    let html = `
      <div class="modal-header">
        <h3>Order ${esc(o.id)}</h3>
        <button class="cart-close" data-closeordermodal>&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-section">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span class="badge" style="background:${sc.bg};color:${sc.text};font-size:0.8rem;padding:4px 12px;">${esc(o.status || '—')}</span>
            <span style="font-size:0.78rem;color:#64748b;">${dateStr(o.date)}</span>
          </div>
        </div>

        <div class="modal-section">
          <h4>Status Timeline</h4>
          <div class="timeline">`;

    statuses.forEach((s, i) => {
      const dotClass = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'pending';
      const timeLabel = i <= currentIdx ? dateStr(o.date) : '—';
      html += `
        <div class="timeline-item">
          <div class="timeline-dot ${dotClass}"></div>
          <div class="timeline-label">${esc(s)}</div>
          <div class="timeline-time">${timeLabel}</div>
        </div>`;
    });

    html += `</div></div>

        <div class="modal-section">
          <h4>Line Items</h4>
          <div class="tbl-wrap">
            <table class="tbl">
              <thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>`;
    items.forEach(it => {
      html += `<tr>
        <td style="font-family:monospace;font-size:0.75rem;">${esc(it.sku || '')}</td>
        <td>${esc(it.name || '')}</td>
        <td>${it.qty || 0}</td>
        <td>${fmt(it.unitPrice || 0)}</td>
        <td style="font-weight:600;color:#fff;">${fmt(it.subtotal || (it.unitPrice || 0) * (it.qty || 0))}</td>
      </tr>`;
    });
    html += `</tbody>
            <tfoot><tr><td colspan="4" style="text-align:right;font-weight:600;color:#94a3b8;">Total</td><td style="font-weight:700;color:#fff;font-size:1rem;">${fmt(o.total || 0)}</td></tr></tfoot>
            </table>
          </div>
        </div>

        <div class="modal-section">
          <h4>Customer Info</h4>
          <div class="glass-sm" style="padding:12px;">
            <div style="font-weight:600;color:#fff;">${esc(o.customer || '—')}</div>
            <div style="font-size:0.78rem;color:#94a3b8;">Customer ID: ${esc(o.customerId || '—')}</div>
          </div>
        </div>

        <div class="modal-section">
          <h4>Shipping</h4>
          <div class="glass-sm" style="padding:12px;">
            <div style="font-size:0.82rem;"><strong>Method:</strong> ${esc(o.shipMethod || '—')}</div>
            <div style="font-size:0.82rem;margin-top:4px;"><strong>Tracking:</strong> ${o.tracking ? esc(o.tracking) : '<span style="color:#64748b;">Not yet assigned</span>'}</div>
          </div>
        </div>

        <div class="modal-section">
          <h4>Notes</h4>
          <textarea class="input" style="width:100%;min-height:60px;resize:vertical;" data-ordernotes="${esc(o.id)}">${esc(o.notes || '')}</textarea>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
          <button class="btn btn-primary" data-ordaction="Processing" data-ordactionid="${esc(o.id)}">Approve &amp; Process</button>
          <button class="btn btn-success" data-ordaction="Shipped" data-ordactionid="${esc(o.id)}">Mark Shipped</button>
          <button class="btn btn-danger" data-ordaction="Cancelled" data-ordactionid="${esc(o.id)}">Cancel Order</button>
        </div>
      </div>`;

    return html;
  }

  function bindOrderEvents(container) {
    // Search
    const search = container.querySelector('[data-ordersearch]');
    if (search) {
      let debounce;
      search.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          ordersSearch = search.value;
          renderOrders();
          const el = document.querySelector('[data-ordersearch]');
          if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
        }, 200);
      });
    }

    // Date filters
    const dateFrom = container.querySelector('[data-orderdatefrom]');
    const dateTo = container.querySelector('[data-orderdateto]');
    if (dateFrom) dateFrom.addEventListener('change', () => { orderDateFrom = dateFrom.value; renderOrders(); });
    if (dateTo) dateTo.addEventListener('change', () => { orderDateTo = dateTo.value; renderOrders(); });

    // Status filter tabs
    container.querySelectorAll('[data-ordstatusfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        ordersStatusFilter = btn.dataset.ordstatusfilter;
        renderOrders();
      });
    });

    // Checkbox selection
    container.querySelectorAll('[data-ordcheck]').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.ordcheck;
        if (cb.checked) selectedOrders.add(id);
        else selectedOrders.delete(id);
        renderOrders();
      });
    });
    const selectAll = container.querySelector('[data-ordselectall]');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        const allIds = ORDERS().map(o => o.id);
        if (selectAll.checked) allIds.forEach(id => selectedOrders.add(id));
        else selectedOrders.clear();
        renderOrders();
      });
    }

    // Bulk actions
    container.querySelectorAll('[data-bulkstatus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.dataset.bulkstatus;
        ORDERS().forEach(o => {
          if (selectedOrders.has(o.id)) o.status = status;
        });
        selectedOrders.clear();
        renderOrders();
      });
    });
    const bulkClear = container.querySelector('[data-bulkclear]');
    if (bulkClear) bulkClear.addEventListener('click', () => { selectedOrders.clear(); renderOrders(); });

    const bulkPrint = container.querySelector('[data-bulkprint]');
    if (bulkPrint) bulkPrint.addEventListener('click', () => { alert('Printing labels for ' + selectedOrders.size + ' orders...'); });

    const bulkExport = container.querySelector('[data-bulkexport]');
    if (bulkExport) bulkExport.addEventListener('click', () => exportOrdersCSV(ORDERS().filter(o => selectedOrders.has(o.id))));

    // Expand items
    container.querySelectorAll('[data-expanditems]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.expanditems;
        const expanded = container.querySelector(`[data-itemsexpanded="${id}"]`);
        if (expanded) {
          const isHidden = expanded.style.display === 'none';
          expanded.style.display = isHidden ? 'block' : 'none';
          btn.innerHTML = isHidden ? '&#9650;' : '&#9660;';
        }
      });
    });

    // Order detail open
    container.querySelectorAll('[data-orderdetail]').forEach(el => {
      el.addEventListener('click', () => {
        orderDetailId = el.dataset.orderdetail;
        renderOrders();
      });
    });

    // Close order modal
    const closeModal = container.querySelector('[data-closeordermodal]');
    if (closeModal) closeModal.addEventListener('click', () => { orderDetailId = null; renderOrders(); });
    const modalOverlay = container.querySelector('[data-ordermodaloverlay]');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) { orderDetailId = null; renderOrders(); }
      });
    }

    // Order detail actions
    container.querySelectorAll('[data-ordaction]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.ordactionid;
        const status = btn.dataset.ordaction;
        const order = ORDERS().find(o => o.id === id);
        if (order) {
          order.status = status;
          if (status === 'Shipped' && !order.tracking) {
            order.tracking = '1Z' + Math.random().toString(36).slice(2, 14).toUpperCase();
          }
        }
        // Save notes
        const notesEl = container.querySelector(`[data-ordernotes="${id}"]`);
        if (notesEl && order) order.notes = notesEl.value;
        orderDetailId = null;
        renderOrders();
      });
    });

    // Edit order (simple — opens detail)
    container.querySelectorAll('[data-ordedit]').forEach(btn => {
      btn.addEventListener('click', () => {
        orderDetailId = btn.dataset.ordedit;
        renderOrders();
      });
    });

    // Print invoice
    container.querySelectorAll('[data-ordprint]').forEach(btn => {
      btn.addEventListener('click', () => {
        const order = ORDERS().find(o => o.id === btn.dataset.ordprint);
        if (order) printInvoice(order);
      });
    });

    // New order
    const newOrderBtn = container.querySelector('[data-neworder]');
    if (newOrderBtn) {
      newOrderBtn.addEventListener('click', () => {
        const newOrder = {
          id: generateId('ORD'),
          customer: CUSTOMERS().length > 0 ? CUSTOMERS()[0].name : 'New Customer',
          customerId: CUSTOMERS().length > 0 ? CUSTOMERS()[0].id : null,
          items: [],
          total: 0,
          status: 'Pending Review',
          shipMethod: 'UPS Ground',
          tracking: null,
          date: new Date().toISOString(),
          notes: ''
        };
        ORDERS().unshift(newOrder);
        orderDetailId = newOrder.id;
        renderOrders();
      });
    }

    // Export CSV
    const exportBtn = container.querySelector('[data-exportcsv]');
    if (exportBtn) exportBtn.addEventListener('click', () => exportOrdersCSV(ORDERS()));
  }

  function exportOrdersCSV(orders) {
    let csv = 'Order ID,Customer,Items,Total,Status,Ship Method,Tracking,Date\n';
    orders.forEach(o => {
      const items = (o.items || []).map(it => `${it.sku || ''}x${it.qty}`).join('; ');
      csv += `"${o.id}","${o.customer}","${items}","${(o.total || 0).toFixed(2)}","${o.status}","${o.shipMethod || ''}","${o.tracking || ''}","${dateStr(o.date)}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders_export_' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function printInvoice(order) {
    const items = order.items || [];
    const w = window.open('', '_blank', 'width=700,height=900');
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 24px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px 12px; border-bottom: 1px solid #ddd; text-align: left; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .total { font-size: 16px; font-weight: 700; text-align: right; margin-top: 10px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>INVOICE</h1>
      <div class="sub">U.S. Apparel LLC &mdash; 7414 Kingspointe Pkwy #400, Orlando, FL 32819</div>
      <p><strong>Order:</strong> ${order.id}<br><strong>Customer:</strong> ${order.customer}<br><strong>Date:</strong> ${dateStr(order.date)}<br><strong>Status:</strong> ${order.status}</p>
      <table><thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead><tbody>
      ${items.map(it => `<tr><td>${it.sku || ''}</td><td>${it.name || ''}</td><td>${it.qty}</td><td>$${(it.unitPrice || 0).toFixed(2)}</td><td>$${(it.subtotal || 0).toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <div class="total">Total: $${(order.total || 0).toFixed(2)}</div>
      <p style="margin-top:30px;font-size:12px;color:#999;">Ship Method: ${order.shipMethod || '—'} | Tracking: ${order.tracking || 'N/A'}</p>
      <script>window.print();<\/script>
    </body></html>`);
  }

  /* ================================================================
     VIEW 3: INVENTORY TRACKER
  ================================================================ */
  function renderInventory() {
    injectStyles();
    const container = document.getElementById('view-inventory');
    if (!container) return;

    const prods = PRODUCTS();

    // Summary calculations
    const totalStock = prods.reduce((s, p) => s + (p.stock || 0), 0);
    const maxCapacity = Math.max(totalStock * 1.4, 35000); // estimate capacity
    const capacityPct = Math.round((totalStock / maxCapacity) * 100);
    const criticalProds = prods.filter(p => (p.stock || 0) < 50);
    const lowProds = prods.filter(p => (p.stock || 0) >= 50 && (p.stock || 0) < 100);
    const healthyProds = prods.filter(p => (p.stock || 0) >= 100);

    // Simulated incoming / reserved
    const incomingUnits = 3200;
    const reservedUnits = Math.min(6420, Math.round(totalStock * 0.26));
    const openOrderCount = ORDERS().filter(o => !(o.status || '').toLowerCase().includes('deliver')).length;

    // Tab data
    let tabProds;
    switch (inventoryTab) {
      case 'critical': tabProds = criticalProds; break;
      case 'low': tabProds = lowProds; break;
      case 'healthy': tabProds = healthyProds; break;
      default: tabProds = prods.slice();
    }
    tabProds.sort((a, b) => (a.stock || 0) - (b.stock || 0));

    // Category stock breakdown
    const catStocks = {};
    prods.forEach(p => {
      const cat = categoryColor(p.category).label;
      catStocks[cat] = (catStocks[cat] || 0) + (p.stock || 0);
    });
    const maxCatStock = Math.max(...Object.values(catStocks), 1);
    const catColors = { Swimwear: '#2563eb', Resort: '#d97706', Imprintables: '#6b7280', 'Last Call': '#dc2626', Other: '#475569' };

    let html = '<div class="usa-view">';

    // ── Header ──
    html += `
      <div class="view-header">
        <div>
          <h2 class="view-title">Live Inventory Tracker</h2>
          <p class="view-subtitle">${prods.length} SKUs tracked &mdash; ${fmtNum(totalStock)} total units</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#94a3b8;">
            <span class="pulse-dot" style="background:#22c55e;"></span> Last synced: 2 min ago
          </span>
          <button class="btn btn-sm" data-invsync>Sync Now</button>
          <button class="btn btn-sm" data-invexport>Export</button>
          <button class="btn btn-sm btn-primary" data-invreceive>Receive Stock</button>
        </div>
      </div>`;

    // ── Summary Cards ──
    html += `
      <div class="stat-row">
        <div class="glass stat-card">
          <span class="stat-label">Total Units in Stock</span>
          <span class="stat-value">${fmtNum(totalStock)}</span>
          <div class="capacity-bar"><div class="capacity-fill" style="width:${capacityPct}%;background:${capacityPct > 85 ? '#ef4444' : capacityPct > 60 ? '#f59e0b' : '#22c55e'};"></div></div>
          <span class="stat-sub">Capacity: ${capacityPct}%</span>
        </div>
        <div class="glass stat-card">
          <span class="stat-label">Incoming Shipments</span>
          <span class="stat-value" style="color:#3b82f6;">${fmtNum(incomingUnits)}</span>
          <span class="stat-sub">2 containers, ETA Mar 28</span>
        </div>
        <div class="glass stat-card">
          <span class="stat-label">Reserved / Committed</span>
          <span class="stat-value" style="color:#a855f7;">${fmtNum(reservedUnits)}</span>
          <span class="stat-sub">Across ${openOrderCount} open orders</span>
        </div>
        <div class="glass stat-card" style="border:1px solid rgba(239,68,68,0.3);">
          <span class="stat-label" style="color:#ef4444;">&#9888; Critical Low Stock</span>
          <span class="stat-value" style="color:#ef4444;">${criticalProds.length} SKUs</span>
          <span class="stat-sub">Below 50 units — action required</span>
        </div>
      </div>`;

    // ── Tabs ──
    html += `
      <div class="tab-bar">
        <button class="tab-btn${inventoryTab === 'critical' ? ' active' : ''}" data-invtab="critical" style="${inventoryTab === 'critical' ? 'border-bottom-color:#ef4444;' : ''}">Critical <span class="tab-count" style="background:rgba(239,68,68,0.2);color:#ef4444;">${criticalProds.length}</span></button>
        <button class="tab-btn${inventoryTab === 'low' ? ' active' : ''}" data-invtab="low" style="${inventoryTab === 'low' ? 'border-bottom-color:#f59e0b;' : ''}">Low Stock <span class="tab-count" style="background:rgba(245,158,11,0.2);color:#f59e0b;">${lowProds.length}</span></button>
        <button class="tab-btn${inventoryTab === 'healthy' ? ' active' : ''}" data-invtab="healthy" style="${inventoryTab === 'healthy' ? 'border-bottom-color:#22c55e;' : ''}">Healthy <span class="tab-count" style="background:rgba(34,197,94,0.2);color:#22c55e;">${healthyProds.length}</span></button>
        <button class="tab-btn${inventoryTab === 'all' ? ' active' : ''}" data-invtab="all">All Products <span class="tab-count" style="background:rgba(255,255,255,0.08);">${prods.length}</span></button>
      </div>`;

    // ── Inventory List ──
    html += '<div class="glass" style="padding:0;">';
    if (tabProds.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:#64748b;">No products in this category.</div>';
    } else {
      html += '<table class="tbl"><thead><tr><th style="width:30px;"></th><th>Product</th><th style="width:180px;">Stock Level</th><th>Units</th><th>Days Left</th><th>Reorder Pt.</th><th>Actions</th></tr></thead><tbody>';
      tabProds.forEach(p => {
        const sc = stockColor(p.stock || 0);
        const cc = categoryColor(p.category);
        const maxStock = 500; // reference max for bar
        const barPct = Math.min(100, Math.round(((p.stock || 0) / maxStock) * 100));
        const avgDailySales = Math.max(1, Math.round(Math.random() * 5 + 2)); // simulated
        const daysLeft = Math.round((p.stock || 0) / avgDailySales);
        const reorderPt = avgDailySales * 14; // 2 weeks safety

        html += `
          <tr>
            <td>
              <div style="width:28px;height:28px;border-radius:6px;background:${cc.bg};display:flex;align-items:center;justify-content:center;font-size:0.7rem;opacity:0.7;">&#128085;</div>
            </td>
            <td>
              <div style="font-weight:600;color:#fff;font-size:0.85rem;">${esc(p.name || '')}</div>
              <div style="display:flex;gap:6px;align-items:center;margin-top:2px;">
                <span style="font-family:monospace;font-size:0.7rem;color:#64748b;">${esc(p.sku || '')}</span>
                <span class="badge" style="background:${cc.badge};color:#fff;font-size:0.6rem;">${esc(cc.label)}</span>
              </div>
            </td>
            <td>
              <div class="stock-bar-outer">
                <div class="stock-bar-inner" style="width:${barPct}%;background:${sc};"></div>
              </div>
            </td>
            <td style="font-weight:600;color:${sc};">${fmtNum(p.stock || 0)}</td>
            <td style="font-size:0.82rem;color:${daysLeft < 14 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#94a3b8'};">${daysLeft}d</td>
            <td style="font-size:0.78rem;color:#64748b;">${(p.stock || 0) <= reorderPt ? '<span style="color:#ef4444;">&#9888; Below</span>' : '<span style="color:#22c55e;">OK</span>'}</td>
            <td>
              <div style="display:flex;gap:4px;">
                ${(p.stock || 0) < 100 ? `<button class="btn btn-sm btn-primary" data-invreorder="${esc(p.sku)}">Reorder</button>` : ''}
                <button class="btn btn-sm" data-invadjust="${esc(p.sku)}">Adjust</button>
                <button class="btn btn-sm" data-invhistory="${esc(p.sku)}" title="View History">&#128200;</button>
              </div>
            </td>
          </tr>`;
      });
      html += '</tbody></table>';
    }
    html += '</div>';

    // ── Charts Section ──
    html += '<div class="chart-row">';

    // Left: Stock Distribution by Category (horizontal bar chart)
    html += '<div class="glass chart-card"><h4>Stock Distribution by Category</h4><div class="hbar-chart">';
    Object.keys(catStocks).sort((a, b) => catStocks[b] - catStocks[a]).forEach(cat => {
      const val = catStocks[cat];
      const pct = Math.round((val / maxCatStock) * 100);
      const color = catColors[cat] || '#475569';
      html += `
        <div class="hbar-row">
          <span class="hbar-label">${esc(cat)}</span>
          <div class="hbar-track">
            <div class="hbar-fill" style="width:${pct}%;background:${color};">${pct > 15 ? fmtNum(val) : ''}</div>
          </div>
          <span class="hbar-val">${fmtNum(val)}</span>
        </div>`;
    });
    html += '</div></div>';

    // Right: Stock Level Trends (simulated line chart for top 5 low-stock items)
    html += '<div class="glass chart-card"><h4>Stock Level Trends (Last 30 Days)</h4>';
    const trendItems = prods.slice().sort((a, b) => (a.stock || 0) - (b.stock || 0)).slice(0, 5);
    if (trendItems.length > 0) {
      trendItems.forEach(p => {
        const sc = stockColor(p.stock || 0);
        // Generate 30 days of simulated decreasing data
        const points = [];
        let val = (p.stock || 0) + Math.round(Math.random() * 80 + 40);
        for (let d = 0; d < 30; d++) {
          val = Math.max(0, val - Math.round(Math.random() * 6));
          points.push(val);
        }
        // Ensure final value matches current stock
        points[29] = p.stock || 0;
        const maxVal = Math.max(...points, 1);

        html += `<div style="margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${sc};"></span>
            <span style="font-size:0.72rem;color:#e2e8f0;font-weight:500;">${esc(p.name || p.sku || '')} — ${fmtNum(p.stock || 0)} units</span>
          </div>
          <div class="line-chart-wrap" style="height:40px;">
            ${points.map(v => `<div class="line-chart-bar" style="height:${Math.max(2, Math.round((v / maxVal) * 100))}%;background:${sc};opacity:0.7;"></div>`).join('')}
          </div>
        </div>`;
      });
      html += '<div style="display:flex;justify-content:space-between;font-size:0.6rem;color:#64748b;margin-top:4px;"><span>30 days ago</span><span>Today</span></div>';
    } else {
      html += '<div style="text-align:center;color:#64748b;padding:20px;">No data</div>';
    }
    html += '</div></div>';

    // ── Stock Adjustment Modal ──
    const adjProduct = stockAdjustProduct ? prods.find(p => p.sku === stockAdjustProduct) : null;
    html += `
      <div class="stock-modal-overlay${adjProduct ? ' open' : ''}" data-stockmodaloverlay>
        <div class="glass stock-modal">
          ${adjProduct ? `
            <h3>Adjust Stock: ${esc(adjProduct.name || '')}</h3>
            <div class="stock-modal-sub">${esc(adjProduct.sku || '')} &mdash; Current stock: <strong style="color:#fff;">${fmtNum(adjProduct.stock || 0)} units</strong></div>
            <label>Adjustment Type</label>
            <select class="input field" data-adjtype>
              <option value="receive">Receive (add stock)</option>
              <option value="ship">Ship (deduct stock)</option>
              <option value="damage">Damage (deduct stock)</option>
              <option value="count">Count Correction</option>
            </select>
            <label>Quantity</label>
            <input class="input field" type="number" min="0" value="0" data-adjqty>
            <label>Notes</label>
            <textarea class="input field" style="min-height:50px;resize:vertical;" data-adjnotes placeholder="Reason for adjustment..."></textarea>
            <div class="stock-modal-actions">
              <button class="btn" data-adjcancel>Cancel</button>
              <button class="btn btn-primary" data-adjsubmit data-adjsku="${esc(adjProduct.sku)}">Submit Adjustment</button>
            </div>
          ` : ''}
        </div>
      </div>`;

    html += '</div>';
    container.innerHTML = html;

    bindInventoryEvents(container);
  }

  function bindInventoryEvents(container) {
    // Tab switching
    container.querySelectorAll('[data-invtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        inventoryTab = btn.dataset.invtab;
        renderInventory();
      });
    });

    // Sync now
    const syncBtn = container.querySelector('[data-invsync]');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        syncBtn.textContent = 'Syncing...';
        syncBtn.disabled = true;
        setTimeout(() => {
          renderInventory();
        }, 800);
      });
    }

    // Export
    const exportBtn = container.querySelector('[data-invexport]');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const prods = PRODUCTS();
        let csv = 'SKU,Product,Category,Stock,Status\n';
        prods.forEach(p => {
          const status = (p.stock || 0) < 50 ? 'Critical' : (p.stock || 0) < 100 ? 'Low' : 'Healthy';
          csv += `"${p.sku}","${p.name}","${p.category}","${p.stock || 0}","${status}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory_export_' + Date.now() + '.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // Receive stock (bulk — opens modal for first critical product)
    const receiveBtn = container.querySelector('[data-invreceive]');
    if (receiveBtn) {
      receiveBtn.addEventListener('click', () => {
        const critical = PRODUCTS().filter(p => (p.stock || 0) < 50);
        if (critical.length > 0) {
          stockAdjustProduct = critical[0].sku;
        } else {
          stockAdjustProduct = PRODUCTS().length > 0 ? PRODUCTS()[0].sku : null;
        }
        renderInventory();
      });
    }

    // Reorder
    container.querySelectorAll('[data-invreorder]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.dataset.invreorder;
        const p = PRODUCTS().find(pr => pr.sku === sku);
        if (p) {
          alert(`Reorder request submitted for ${p.name} (${p.sku}). A purchase order will be generated.`);
        }
      });
    });

    // Adjust stock modal open
    container.querySelectorAll('[data-invadjust]').forEach(btn => {
      btn.addEventListener('click', () => {
        stockAdjustProduct = btn.dataset.invadjust;
        renderInventory();
      });
    });

    // View history
    container.querySelectorAll('[data-invhistory]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.dataset.invhistory;
        const p = PRODUCTS().find(pr => pr.sku === sku);
        if (p) {
          alert(`Stock history for ${p.name} (${p.sku}):\n\nCurrent: ${p.stock} units\nNo historical data available in demo mode.`);
        }
      });
    });

    // Stock modal cancel
    const adjCancel = container.querySelector('[data-adjcancel]');
    if (adjCancel) adjCancel.addEventListener('click', () => { stockAdjustProduct = null; renderInventory(); });
    const modalOverlay = container.querySelector('[data-stockmodaloverlay]');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) { stockAdjustProduct = null; renderInventory(); }
      });
    }

    // Stock modal submit
    const adjSubmit = container.querySelector('[data-adjsubmit]');
    if (adjSubmit) {
      adjSubmit.addEventListener('click', () => {
        const sku = adjSubmit.dataset.adjsku;
        const type = container.querySelector('[data-adjtype]').value;
        const qty = parseInt(container.querySelector('[data-adjqty]').value, 10) || 0;
        const notes = container.querySelector('[data-adjnotes]').value;

        const product = PRODUCTS().find(p => p.sku === sku);
        if (product && qty > 0) {
          switch (type) {
            case 'receive':
              product.stock = (product.stock || 0) + qty;
              break;
            case 'ship':
            case 'damage':
              product.stock = Math.max(0, (product.stock || 0) - qty);
              break;
            case 'count':
              product.stock = qty;
              break;
          }
        }

        stockAdjustProduct = null;
        renderInventory();
        // Also refresh catalog if it's visible
        if (document.getElementById('view-catalog')) renderCatalog();
      });
    }
  }

  /* ================================================================
     GLOBAL REGISTRATION
  ================================================================ */
  window.renderCatalog = renderCatalog;
  window.renderOrders = renderOrders;
  window.renderInventory = renderInventory;

  /* ── Auto-render on DOM ready ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderCatalog();
      renderOrders();
      renderInventory();
    });
  } else {
    // DOM already loaded
    renderCatalog();
    renderOrders();
    renderInventory();
  }
})();
