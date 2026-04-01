/**
 * US Apparel LLC — CRM, AI Smart Reorder, Customer Portal Views
 * Populates: #view-customers, #view-reorder, #view-portal
 * Depends on: window.APP_DATA { PRODUCTS, CUSTOMERS, ORDERS }
 */
(function () {
  'use strict';

  const { PRODUCTS, CUSTOMERS, ORDERS } = window.APP_DATA;

  /* ─────────────────────────────────────────────
     SHARED STATE
  ───────────────────────────────────────────── */
  let customerFilter = 'all';
  let customerSearch = '';
  let selectedCustomer = null;
  let reorderFilter = 'all';
  let portalLoggedIn = false;
  let portalCart = [];
  let customerNotes = {};       // customerId -> [{text, date}]
  let pendingApplications = [
    { id: 101, company: 'Oceana Beach Hotel', contact: 'Diana Cruz', email: 'dcruz@oceanabeach.com', phone: '(305) 555-0177', location: 'Key West, FL', dateApplied: '2026-03-18' },
    { id: 102, company: 'Sunset Retailers Inc', contact: 'James Park', email: 'jpark@sunsetretail.com', phone: '(813) 555-0233', location: 'Tampa, FL', dateApplied: '2026-03-19' },
    { id: 103, company: 'Palms & Co Distribution', contact: 'Aisha Rahman', email: 'arahman@palmsco.com', phone: '(407) 555-0419', location: 'Orlando, FL', dateApplied: '2026-03-20' },
    { id: 104, company: 'Gulf Shore Boutiques', contact: 'Robert Mendes', email: 'rmendes@gulfshore.com', phone: '(239) 555-0388', location: 'Naples, FL', dateApplied: '2026-03-21' },
  ];

  /* ─────────────────────────────────────────────
     REORDER PREDICTIONS DATA
  ───────────────────────────────────────────── */
  const REORDER_PREDICTIONS = [
    { customerId: 1, lastOrder: '2026-03-14', avgCycle: 14, nextPredicted: '2026-03-28', confidence: 96, products: [{ sku: 'MPS-315', name: 'Floral Vines', qty: 300 }, { sku: 'MPS-309', name: 'Palm Paradise', qty: 200 }], estValue: 12625, status: 'upcoming' },
    { customerId: 3, lastOrder: '2026-03-10', avgCycle: 21, nextPredicted: '2026-03-31', confidence: 89, products: [{ sku: 'YJY-5293', name: 'Spaghetti Tank', qty: 500 }, { sku: 'YFL-4296', name: 'Ladies Oversized Tee', qty: 200 }], estValue: 7200, status: 'upcoming' },
    { customerId: 6, lastOrder: '2026-02-28', avgCycle: 18, nextPredicted: '2026-03-18', confidence: 94, products: [{ sku: 'MCS-312', name: 'Palmbre', qty: 200 }, { sku: 'MPS-308', name: 'Palmlandia', qty: 150 }], estValue: 4962, status: 'overdue' },
    { customerId: 10, lastOrder: '2026-02-20', avgCycle: 21, nextPredicted: '2026-03-13', confidence: 87, products: [{ sku: 'MTT-5155', name: 'Mineral Washed Tank', qty: 150 }, { sku: 'MMS-5283', name: 'Surface Dyed Muscle Tee', qty: 100 }], estValue: 2862, status: 'overdue' },
    { customerId: 12, lastOrder: '2026-02-15', avgCycle: 28, nextPredicted: '2026-03-15', confidence: 82, products: [{ sku: 'MPS-313', name: 'Tasty Waves', qty: 100 }, { sku: 'MPS-271', name: 'Kawabunga', qty: 100 }], estValue: 2825, status: 'overdue' },
    { customerId: 11, lastOrder: '2026-03-01', avgCycle: 25, nextPredicted: '2026-03-26', confidence: 78, products: [{ sku: 'MPS-271', name: 'Kawabunga', qty: 200 }, { sku: 'BY-280', name: 'Kawabunga Boys', qty: 100 }], estValue: 3725, status: 'upcoming' },
    { customerId: 4, lastOrder: '2026-03-17', avgCycle: 10, nextPredicted: '2026-03-27', confidence: 92, products: [{ sku: 'MAS-317', name: 'Beach Comber', qty: 250 }, { sku: 'MPS-307', name: 'Palm Shadows', qty: 200 }], estValue: 6562, status: 'upcoming' },
    { customerId: 2, lastOrder: '2026-03-18', avgCycle: 7, nextPredicted: '2026-03-25', confidence: 98, products: [{ sku: 'IMP-1001', name: 'Classic Crew Tee', qty: 1000 }, { sku: 'IMP-1004', name: 'Ladies Fitted Tee', qty: 600 }], estValue: 9200, status: 'upcoming' },
    { customerId: 9, lastOrder: '2026-03-05', avgCycle: 14, nextPredicted: '2026-03-19', confidence: 91, products: [{ sku: 'IMP-1001', name: 'Classic Crew Tee', qty: 800 }, { sku: 'IMP-1003', name: 'Ringspun Tank', qty: 400 }], estValue: 6700, status: 'overdue' },
    { customerId: 13, lastOrder: '2026-03-16', avgCycle: 12, nextPredicted: '2026-03-28', confidence: 88, products: [{ sku: 'MPS-272', name: 'Villa Palm', qty: 150 }, { sku: 'APS-9278', name: 'Villa Palm Camp Shirt', qty: 80 }], estValue: 3542, status: 'upcoming' },
    { customerId: 15, lastOrder: '2026-03-13', avgCycle: 15, nextPredicted: '2026-03-28', confidence: 85, products: [{ sku: 'YFR-4214', name: 'Vintage Raw Edge Crew', qty: 200 }, { sku: 'YFR-6215', name: 'Vintage Raw Edge Short', qty: 150 }], estValue: 4237, status: 'upcoming' },
    { customerId: 5, lastOrder: '2026-03-09', avgCycle: 20, nextPredicted: '2026-03-29', confidence: 83, products: [{ sku: 'MPS-307', name: 'Palm Shadows', qty: 200 }, { sku: 'MCS-312', name: 'Palmbre', qty: 100 }], estValue: 4200, status: 'upcoming' },
  ];

  /* ─────────────────────────────────────────────
     PORTAL DEMO DATA (Sandals Resort Group)
  ───────────────────────────────────────────── */
  const PORTAL_USER = {
    name: 'Marcus',
    company: 'Sandals Resort Group',
    email: 'mwilliams@sandals.com',
    phone: '(876) 555-0142',
    tier: 'Platinum',
    discount: 20,
    customerSince: '2024-06-15',
    shippingAddresses: [
      '1 Kent Ave, Montego Bay, Jamaica',
      '400 Royal Mile, Nassau, Bahamas',
      '900 Caribbean Dr, Ocho Rios, Jamaica',
    ],
  };

  const PORTAL_ORDERS = [
    { id: 'ORD-2087', date: '2026-03-19', total: 12487, status: 'processing', tracking: null, items: [{ sku: 'MPS-315', name: 'Floral Vines', qty: 300, price: 18.75 }, { sku: 'MPS-309', name: 'Palm Paradise', qty: 200, price: 22.50 }, { sku: 'MAS-317', name: 'Beach Comber', qty: 150, price: 14.25 }] },
    { id: 'ORD-2081', date: '2026-03-14', total: 9850, status: 'shipped', tracking: '1Z999AA10123456784', items: [{ sku: 'MPS-307', name: 'Palm Shadows', qty: 250, price: 19.50 }, { sku: 'MCS-312', name: 'Palmbre', qty: 200, price: 16.75 }] },
    { id: 'ORD-2064', date: '2026-03-01', total: 7230, status: 'delivered', tracking: '1Z999AA10123456729', items: [{ sku: 'IMP-1001', name: 'Classic Crew Tee', qty: 500, price: 5.20 }, { sku: 'IMP-1004', name: 'Ladies Fitted Tee', qty: 400, price: 6.10 }, { sku: 'MPS-271', name: 'Kawabunga', qty: 100, price: 21.90 }] },
    { id: 'ORD-2038', date: '2026-02-18', total: 15620, status: 'delivered', tracking: '1Z999AA10123456698', items: [{ sku: 'MPS-315', name: 'Floral Vines', qty: 400, price: 18.75 }, { sku: 'MPS-309', name: 'Palm Paradise', qty: 300, price: 22.50 }] },
    { id: 'ORD-2011', date: '2026-02-03', total: 6475, status: 'delivered', tracking: '1Z999AA10123456655', items: [{ sku: 'MAS-317', name: 'Beach Comber', qty: 200, price: 14.25 }, { sku: 'MPS-313', name: 'Tasty Waves', qty: 150, price: 20.50 }] },
  ];

  const PORTAL_INVOICES = [
    { id: 'INV-4087', orderId: 'ORD-2087', date: '2026-03-19', amount: 12487, status: 'unpaid' },
    { id: 'INV-4081', orderId: 'ORD-2081', date: '2026-03-14', amount: 9850, status: 'paid' },
    { id: 'INV-4064', orderId: 'ORD-2064', date: '2026-03-01', amount: 7230, status: 'paid' },
    { id: 'INV-4038', orderId: 'ORD-2038', date: '2026-02-18', amount: 15620, status: 'paid' },
    { id: 'INV-4011', orderId: 'ORD-2011', date: '2026-02-03', amount: 6475, status: 'paid' },
  ];

  /* ─────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function daysBetween(a, b) {
    const d1 = new Date(a + 'T00:00:00');
    const d2 = new Date(b + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000);
  }

  function daysAgo(d) {
    const now = new Date('2026-03-21T00:00:00');
    const dt = new Date(d + 'T00:00:00');
    return Math.round((now - dt) / 86400000);
  }

  function initials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function tierColor(tier) {
    const t = (tier || '').toLowerCase();
    if (t === 'platinum') return { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', border: '#a855f7' };
    if (t === 'gold') return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: '#f59e0b' };
    return { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', border: '#9ca3af' };
  }

  function tierGradient(tier) {
    const t = (tier || '').toLowerCase();
    if (t === 'platinum') return 'linear-gradient(135deg, #7c3aed, #a855f7)';
    if (t === 'gold') return 'linear-gradient(135deg, #d97706, #f59e0b)';
    return 'linear-gradient(135deg, #6b7280, #9ca3af)';
  }

  function statusBadge(status) {
    const s = (status || '').toLowerCase();
    if (s === 'active') return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:rgba(34,197,94,0.12);color:#22c55e;"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;"></span>Active</span>';
    if (s === 'at-risk') return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:rgba(245,158,11,0.12);color:#f59e0b;"><span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>At Risk</span>';
    if (s === 'churned') return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:rgba(239,68,68,0.12);color:#ef4444;"><span style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block;"></span>Churned</span>';
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:rgba(107,114,128,0.12);color:#9ca3af;">Unknown</span>';
  }

  function getCustomerStatus(lastOrderDate) {
    if (!lastOrderDate) return 'churned';
    const d = daysAgo(lastOrderDate);
    if (d <= 30) return 'active';
    if (d <= 60) return 'at-risk';
    return 'churned';
  }

  function getCustomerOrders(customerId) {
    return ORDERS.filter(o => o.customerId === customerId);
  }

  function getCustomerLTV(customerId) {
    return getCustomerOrders(customerId).reduce((sum, o) => sum + (o.total || 0), 0);
  }

  function getCustomerLastOrder(customerId) {
    const orders = getCustomerOrders(customerId);
    if (!orders.length) return null;
    return orders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }

  function getCustomerTopProduct(customerId) {
    const orders = getCustomerOrders(customerId);
    const productCounts = {};
    orders.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          const key = item.sku || item.name;
          if (!productCounts[key]) productCounts[key] = { name: item.name, sku: item.sku, qty: 0 };
          productCounts[key].qty += item.qty || 1;
        });
      }
    });
    const sorted = Object.values(productCounts).sort((a, b) => b.qty - a.qty);
    return sorted[0] || null;
  }

  function toast(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:14px 24px;border-radius:12px;background:rgba(11,133,243,0.95);color:#fff;font-size:14px;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,0.4);backdrop-filter:blur(12px);animation:slideUp .3s ease;max-width:420px;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 3000);
    setTimeout(() => el.remove(), 3400);
  }

  /* Inject keyframe animations once */
  if (!document.getElementById('crm-animations')) {
    const style = document.createElement('style');
    style.id = 'crm-animations';
    style.textContent = `
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
      .crm-glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; }
      .crm-glass-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; }
      .crm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all .2s; }
      .crm-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
      .crm-btn-primary { background: #0b85f3; color: #fff; }
      .crm-btn-primary:hover { background: #0a78db; }
      .crm-btn-glass { background: rgba(255,255,255,0.06); color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1); }
      .crm-btn-glass:hover { background: rgba(255,255,255,0.1); }
      .crm-btn-success { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.25); }
      .crm-btn-success:hover { background: rgba(34,197,94,0.25); }
      .crm-btn-danger { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.25); }
      .crm-btn-danger:hover { background: rgba(239,68,68,0.25); }
      .crm-btn-amber { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
      .crm-btn-amber:hover { background: rgba(245,158,11,0.25); }
      .crm-btn-sm { padding: 5px 12px; font-size: 12px; border-radius: 8px; }
      .crm-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #e2e8f0; font-size: 13px; outline: none; transition: border-color .2s; width: 100%; }
      .crm-input:focus { border-color: #0b85f3; }
      .crm-input::placeholder { color: rgba(255,255,255,0.3); }
      .crm-table { width: 100%; border-collapse: separate; border-spacing: 0; }
      .crm-table th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.4); border-bottom: 1px solid rgba(255,255,255,0.06); }
      .crm-table td { padding: 12px 14px; font-size: 13px; color: #e2e8f0; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
      .crm-table tr:hover td { background: rgba(255,255,255,0.02); }
      .crm-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 10px; color: #e2e8f0; font-size: 12px; outline: none; cursor: pointer; }
      .crm-select option { background: #1a1a2e; color: #e2e8f0; }
      .crm-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 9998; animation: fadeIn .2s ease; }
      .crm-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 9999; background: linear-gradient(135deg, rgba(26,26,46,0.98), rgba(22,22,40,0.98)); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; max-width: 540px; width: 90%; box-shadow: 0 24px 64px rgba(0,0,0,0.5); animation: slideUp .3s ease; }
      .crm-slideover { position: fixed; top: 0; right: 0; bottom: 0; width: 560px; max-width: 95vw; z-index: 9999; background: linear-gradient(180deg, rgba(26,26,46,0.99), rgba(18,18,36,0.99)); border-left: 1px solid rgba(255,255,255,0.06); box-shadow: -8px 0 48px rgba(0,0,0,0.4); overflow-y: auto; animation: slideInRight .3s ease; }
      .crm-tab { padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); cursor: pointer; transition: all .2s; border: none; background: none; }
      .crm-tab.active { background: rgba(11,133,243,0.15); color: #0b85f3; }
      .crm-tab:hover:not(.active) { color: rgba(255,255,255,0.8); }
      .crm-stat-card { border-radius: 14px; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
      .crm-bar { height: 8px; border-radius: 4px; transition: width .6s ease; }
      .portal-nav-btn { padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.6); cursor: pointer; transition: all .2s; border: none; background: none; display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; }
      .portal-nav-btn.active { background: rgba(11,133,243,0.12); color: #0b85f3; }
      .portal-nav-btn:hover:not(.active) { background: rgba(255,255,255,0.04); color: #e2e8f0; }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════
     VIEW 1: CUSTOMER CRM
  ═══════════════════════════════════════════════ */
  function renderCustomers() {
    const container = document.getElementById('view-customers');
    if (!container) return;

    const tierCounts = { platinum: 0, gold: 0, silver: 0 };
    CUSTOMERS.forEach(c => {
      const t = (c.tier || '').toLowerCase();
      if (tierCounts[t] !== undefined) tierCounts[t]++;
    });

    const filtered = CUSTOMERS.filter(c => {
      if (customerFilter !== 'all' && (c.tier || '').toLowerCase() !== customerFilter) return false;
      if (customerSearch) {
        const s = customerSearch.toLowerCase();
        const match = (c.name || '').toLowerCase().includes(s)
          || (c.location || '').toLowerCase().includes(s)
          || (c.contact || '').toLowerCase().includes(s)
          || (c.company || '').toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });

    container.innerHTML = `
      <!-- HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:28px;">
        <div>
          <h2 style="font-size:24px;font-weight:700;color:#fff;margin:0;">Customer Management</h2>
          <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:4px 0 0;">${CUSTOMERS.length} active B2B accounts</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <input type="text" class="crm-input" placeholder="Search customers..." style="width:240px;" id="crm-customer-search" value="${customerSearch}" />
          <button class="crm-btn crm-btn-primary" onclick="window._crmNewCustomer()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New Customer
          </button>
          <button class="crm-btn crm-btn-glass" onclick="window._crmExportCustomers()">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export
          </button>
        </div>
      </div>

      <!-- TIER FILTER -->
      <div style="display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;" id="crm-tier-filters">
        <button class="crm-tab ${customerFilter === 'all' ? 'active' : ''}" data-tier="all">All</button>
        <button class="crm-tab ${customerFilter === 'platinum' ? 'active' : ''}" data-tier="platinum">Platinum</button>
        <button class="crm-tab ${customerFilter === 'gold' ? 'active' : ''}" data-tier="gold">Gold</button>
        <button class="crm-tab ${customerFilter === 'silver' ? 'active' : ''}" data-tier="silver">Silver</button>
      </div>

      <!-- STATS CARDS -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:28px;">
        <div class="crm-stat-card" style="border-left:3px solid #a855f7;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:8px;">Platinum Accounts</div>
          <div style="font-size:28px;font-weight:700;color:#a855f7;">${tierCounts.platinum}</div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #f59e0b;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:8px;">Gold Accounts</div>
          <div style="font-size:28px;font-weight:700;color:#f59e0b;">${tierCounts.gold}</div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #9ca3af;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:8px;">Silver Accounts</div>
          <div style="font-size:28px;font-weight:700;color:#9ca3af;">${tierCounts.silver}</div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #22c55e;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:8px;">Pending Applications</div>
          <div style="font-size:28px;font-weight:700;color:#22c55e;">${pendingApplications.length}</div>
        </div>
      </div>

      <!-- CUSTOMER TABLE -->
      <div class="crm-glass" style="overflow-x:auto;margin-bottom:32px;">
        <table class="crm-table">
          <thead>
            <tr>
              <th style="width:44px;"></th>
              <th>Customer</th>
              <th>Tier</th>
              <th>Orders</th>
              <th>Lifetime Value</th>
              <th>Last Order</th>
              <th>Top Product</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(c => {
              const orders = getCustomerOrders(c.id);
              const ltv = getCustomerLTV(c.id);
              const lastOrder = getCustomerLastOrder(c.id);
              const lastDate = lastOrder ? lastOrder.date : null;
              const status = getCustomerStatus(lastDate);
              const topProd = getCustomerTopProduct(c.id);
              const tc = tierColor(c.tier);
              return `
                <tr>
                  <td>
                    <div style="width:36px;height:36px;border-radius:50%;background:${tierGradient(c.tier)};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;">
                      ${initials(c.name || c.company || 'NA')}
                    </div>
                  </td>
                  <td>
                    <div style="font-weight:600;color:#fff;">${c.name || c.company}</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);">${c.location || ''} ${c.contact ? '&middot; ' + c.contact : ''}</div>
                  </td>
                  <td>
                    <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:${tc.bg};color:${tc.text};border:1px solid ${tc.border}22;">
                      ${(c.tier || 'Silver').charAt(0).toUpperCase() + (c.tier || 'Silver').slice(1)}
                    </span>
                  </td>
                  <td style="font-weight:500;">${orders.length}</td>
                  <td style="font-weight:600;color:#fff;">${fmt(ltv)}</td>
                  <td>${fmtDate(lastDate)}</td>
                  <td>
                    ${topProd ? `<div style="font-size:12px;">${topProd.name}</div><div style="font-size:10px;color:rgba(255,255,255,0.35);">${topProd.sku}</div>` : '<span style="color:rgba(255,255,255,0.25);">—</span>'}
                  </td>
                  <td>${statusBadge(status)}</td>
                  <td>
                    <button class="crm-btn crm-btn-glass crm-btn-sm" onclick="window._crmOpenProfile(${c.id})">Profile</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${filtered.length === 0 ? '<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.3);font-size:14px;">No customers match your filters.</div>' : ''}
      </div>

      <!-- PENDING APPLICATIONS -->
      <div>
        <h3 style="font-size:18px;font-weight:600;color:#fff;margin:0 0 16px;">
          <span style="display:inline-flex;align-items:center;gap:8px;">
            <svg width="18" height="18" fill="none" stroke="#22c55e" stroke-width="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4V7"/><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Pending Applications
          </span>
        </h3>
        <div class="crm-glass" style="overflow-x:auto;">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${pendingApplications.map(p => `
                <tr id="pending-row-${p.id}">
                  <td style="font-weight:600;color:#fff;">${p.company}</td>
                  <td>
                    <div>${p.contact}</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);">${p.email}</div>
                  </td>
                  <td>${p.location}</td>
                  <td>${fmtDate(p.dateApplied)}</td>
                  <td style="display:flex;gap:8px;">
                    <button class="crm-btn crm-btn-success crm-btn-sm" onclick="window._crmApproveApp(${p.id})">Approve</button>
                    <button class="crm-btn crm-btn-danger crm-btn-sm" onclick="window._crmRejectApp(${p.id})">Reject</button>
                  </td>
                </tr>
              `).join('')}
              ${pendingApplications.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:28px;color:rgba(255,255,255,0.3);">No pending applications</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    /* Bind events */
    const searchInput = document.getElementById('crm-customer-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        customerSearch = this.value;
        renderCustomers();
      });
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }

    $$('#crm-tier-filters .crm-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        customerFilter = this.dataset.tier;
        renderCustomers();
      });
    });
  }

  /* ── Customer Profile Slide-Over ── */
  function openCustomerProfile(customerId) {
    const c = CUSTOMERS.find(x => x.id === customerId);
    if (!c) return;

    selectedCustomer = c;
    const orders = getCustomerOrders(c.id);
    const ltv = getCustomerLTV(c.id);
    const lastOrder = getCustomerLastOrder(c.id);
    const avgOrderValue = orders.length ? Math.round(ltv / orders.length) : 0;
    const topProd = getCustomerTopProduct(c.id);
    const tc = tierColor(c.tier);
    const notes = customerNotes[c.id] || [];

    // Product frequency data for bar chart
    const productFreq = {};
    orders.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          const key = item.name || item.sku;
          productFreq[key] = (productFreq[key] || 0) + (item.qty || 1);
        });
      }
    });
    const topProducts = Object.entries(productFreq).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxProductQty = topProducts.length ? topProducts[0][1] : 1;

    // Order frequency sparkline data (last 12 months)
    const monthlyOrders = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(2026, 2 - i, 1);
      const key = d.toISOString().slice(0, 7);
      monthlyOrders[key] = 0;
    }
    orders.forEach(o => {
      const key = o.date ? o.date.slice(0, 7) : null;
      if (key && monthlyOrders[key] !== undefined) monthlyOrders[key]++;
    });
    const sparkData = Object.values(monthlyOrders);
    const sparkMax = Math.max(...sparkData, 1);

    // Remove old slide-over if exists
    const oldOverlay = document.getElementById('crm-profile-overlay');
    const oldSlide = document.getElementById('crm-profile-slideover');
    if (oldOverlay) oldOverlay.remove();
    if (oldSlide) oldSlide.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'crm-profile-overlay';
    overlay.className = 'crm-overlay';
    overlay.onclick = closeCustomerProfile;
    document.body.appendChild(overlay);

    // Create slide-over
    const slide = document.createElement('div');
    slide.id = 'crm-profile-slideover';
    slide.className = 'crm-slideover';
    slide.innerHTML = `
      <div style="padding:28px;">
        <!-- Close button -->
        <button onclick="window._crmCloseProfile()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.06);border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#e2e8f0;">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <!-- Header -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
          <div style="width:56px;height:56px;border-radius:50%;background:${tierGradient(c.tier)};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;">
            ${initials(c.name || c.company || 'NA')}
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <h3 style="font-size:20px;font-weight:700;color:#fff;margin:0;">${c.name || c.company}</h3>
              <span style="display:inline-block;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:${tc.bg};color:${tc.text};">${(c.tier || 'Silver')}</span>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.45);margin-top:2px;">${c.location || ''}</div>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="crm-glass-card" style="margin-bottom:20px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
            <div><span style="color:rgba(255,255,255,0.4);">Email:</span> <span style="color:#e2e8f0;">${c.email || 'N/A'}</span></div>
            <div><span style="color:rgba(255,255,255,0.4);">Phone:</span> <span style="color:#e2e8f0;">${c.phone || 'N/A'}</span></div>
            <div><span style="color:rgba(255,255,255,0.4);">Contact:</span> <span style="color:#e2e8f0;">${c.contact || 'N/A'}</span></div>
            <div><span style="color:rgba(255,255,255,0.4);">Location:</span> <span style="color:#e2e8f0;">${c.location || 'N/A'}</span></div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
          <div class="crm-stat-card" style="padding:14px;text-align:center;">
            <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Orders</div>
            <div style="font-size:22px;font-weight:700;color:#fff;margin-top:4px;">${orders.length}</div>
          </div>
          <div class="crm-stat-card" style="padding:14px;text-align:center;">
            <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">LTV</div>
            <div style="font-size:22px;font-weight:700;color:#22c55e;margin-top:4px;">${fmt(ltv)}</div>
          </div>
          <div class="crm-stat-card" style="padding:14px;text-align:center;">
            <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Avg Order</div>
            <div style="font-size:22px;font-weight:700;color:#0b85f3;margin-top:4px;">${fmt(avgOrderValue)}</div>
          </div>
          <div class="crm-stat-card" style="padding:14px;text-align:center;">
            <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Since</div>
            <div style="font-size:14px;font-weight:600;color:#fff;margin-top:8px;">${c.customerSince ? fmtDate(c.customerSince) : '2024'}</div>
          </div>
        </div>

        <!-- Order History -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 10px;">Order History</h4>
          <div class="crm-glass" style="max-height:200px;overflow-y:auto;">
            <table class="crm-table">
              <thead>
                <tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${orders.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:rgba(255,255,255,0.3);padding:16px;">No orders</td></tr>' :
                  orders.sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => `
                    <tr>
                      <td style="font-weight:500;">${o.id || ('ORD-' + o.id)}</td>
                      <td>${fmtDate(o.date)}</td>
                      <td style="font-weight:600;">${fmt(o.total)}</td>
                      <td>
                        <span style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:500;
                          background:${o.status === 'delivered' ? 'rgba(34,197,94,0.12)' : o.status === 'shipped' ? 'rgba(11,133,243,0.12)' : 'rgba(245,158,11,0.12)'};
                          color:${o.status === 'delivered' ? '#22c55e' : o.status === 'shipped' ? '#0b85f3' : '#f59e0b'};">
                          ${(o.status || 'pending').charAt(0).toUpperCase() + (o.status || 'pending').slice(1)}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Top Products Bar Chart -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 10px;">Top Products</h4>
          <div class="crm-glass-card">
            ${topProducts.length === 0 ? '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:12px;">No product data</div>' :
              topProducts.map(([name, qty]) => `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                  <div style="width:120px;font-size:12px;color:rgba(255,255,255,0.6);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${name}">${name}</div>
                  <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:4px;height:8px;overflow:hidden;">
                    <div class="crm-bar" style="width:${Math.round(qty / maxProductQty * 100)}%;background:linear-gradient(90deg,#0b85f3,#6366f1);"></div>
                  </div>
                  <div style="font-size:12px;font-weight:600;color:#fff;width:50px;text-align:right;">${qty.toLocaleString()}</div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Order Frequency Sparkline -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 10px;">Order Frequency (12mo)</h4>
          <div class="crm-glass-card">
            <div style="display:flex;align-items:flex-end;gap:4px;height:48px;">
              ${sparkData.map((v, i) => `
                <div style="flex:1;background:${v > 0 ? 'linear-gradient(180deg,#0b85f3,#6366f1)' : 'rgba(255,255,255,0.06)'};height:${Math.max(v / sparkMax * 100, 4)}%;border-radius:3px;min-height:3px;transition:height .4s;" title="${Object.keys(monthlyOrders)[i]}: ${v} orders"></div>
              `).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:6px;">
              <span style="font-size:10px;color:rgba(255,255,255,0.3);">${Object.keys(monthlyOrders)[0]}</span>
              <span style="font-size:10px;color:rgba(255,255,255,0.3);">${Object.keys(monthlyOrders)[11]}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 10px;">Notes</h4>
          <div class="crm-glass-card">
            <div id="crm-notes-list" style="margin-bottom:12px;max-height:120px;overflow-y:auto;">
              ${notes.length === 0 ? '<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:8px 0;">No notes yet.</div>' :
                notes.map((n, i) => `
                  <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;">
                    <div style="color:#e2e8f0;">${n.text}</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:2px;">${fmtDate(n.date)}</div>
                  </div>
                `).join('')}
            </div>
            <div style="display:flex;gap:8px;">
              <input type="text" class="crm-input" id="crm-note-input" placeholder="Add a note..." style="flex:1;" />
              <button class="crm-btn crm-btn-primary crm-btn-sm" onclick="window._crmAddNote(${c.id})">Add</button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div style="margin-bottom:20px;">
          <h4 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 10px;">Actions</h4>
          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12px;color:rgba(255,255,255,0.4);">Tier:</span>
              <select class="crm-select" id="crm-tier-select" onchange="window._crmChangeTier(${c.id}, this.value)">
                <option value="Platinum" ${c.tier === 'Platinum' ? 'selected' : ''}>Platinum</option>
                <option value="Gold" ${c.tier === 'Gold' ? 'selected' : ''}>Gold</option>
                <option value="Silver" ${c.tier === 'Silver' ? 'selected' : ''}>Silver</option>
              </select>
            </div>
            <button class="crm-btn crm-btn-success crm-btn-sm" onclick="window._crmSendReorderReminder(${c.id})">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Send Reorder Reminder
            </button>
            <button class="crm-btn crm-btn-primary crm-btn-sm" onclick="toast('Draft order created for ${(c.name || c.company).replace(/'/g, "\\'")}')">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Create Order
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(slide);
  }

  function closeCustomerProfile() {
    const overlay = document.getElementById('crm-profile-overlay');
    const slide = document.getElementById('crm-profile-slideover');
    if (slide) {
      slide.style.animation = 'slideOutRight .25s ease forwards';
    }
    if (overlay) {
      overlay.style.animation = 'fadeOut .25s ease forwards';
    }
    setTimeout(() => {
      if (overlay) overlay.remove();
      if (slide) slide.remove();
      selectedCustomer = null;
    }, 260);
  }

  /* ── Approve / Reject Applications ── */
  function approveApplication(appId) {
    const app = pendingApplications.find(p => p.id === appId);
    if (!app) return;

    // Remove old modals
    const oldOv = document.getElementById('crm-approve-overlay');
    const oldMd = document.getElementById('crm-approve-modal');
    if (oldOv) oldOv.remove();
    if (oldMd) oldMd.remove();

    const overlay = document.createElement('div');
    overlay.id = 'crm-approve-overlay';
    overlay.className = 'crm-overlay';
    overlay.onclick = function () { overlay.remove(); modal.remove(); };
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.id = 'crm-approve-modal';
    modal.className = 'crm-modal';
    modal.innerHTML = `
      <h3 style="font-size:18px;font-weight:700;color:#fff;margin:0 0 4px;">Approve Application</h3>
      <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 20px;">${app.company} &middot; ${app.contact}</p>

      <div style="margin-bottom:16px;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);display:block;margin-bottom:4px;">Assign Tier</label>
        <select class="crm-select" id="crm-approve-tier" style="width:100%;padding:10px 14px;">
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
        </select>
      </div>
      <div style="margin-bottom:16px;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);display:block;margin-bottom:4px;">Credit Limit</label>
        <input type="text" class="crm-input" id="crm-approve-credit" placeholder="e.g. $25,000" value="$25,000" />
      </div>
      <div style="margin-bottom:20px;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);display:block;margin-bottom:4px;">Notes</label>
        <textarea class="crm-input" id="crm-approve-notes" rows="2" placeholder="Optional notes..." style="resize:vertical;"></textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button class="crm-btn crm-btn-glass" onclick="document.getElementById('crm-approve-overlay').click()">Cancel</button>
        <button class="crm-btn crm-btn-success" id="crm-approve-confirm">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          Approve & Create Account
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('crm-approve-confirm').addEventListener('click', function () {
      const tier = document.getElementById('crm-approve-tier').value;
      pendingApplications = pendingApplications.filter(p => p.id !== appId);
      overlay.remove();
      modal.remove();
      toast(`${app.company} approved as ${tier} account!`);
      renderCustomers();
    });
  }

  function rejectApplication(appId) {
    const app = pendingApplications.find(p => p.id === appId);
    if (!app) return;
    pendingApplications = pendingApplications.filter(p => p.id !== appId);
    toast(`${app.company} application rejected.`);
    renderCustomers();
  }

  /* ── CRM Utility Handlers ── */
  window._crmOpenProfile = openCustomerProfile;
  window._crmCloseProfile = closeCustomerProfile;
  window._crmApproveApp = approveApplication;
  window._crmRejectApp = rejectApplication;

  window._crmAddNote = function (customerId) {
    const input = document.getElementById('crm-note-input');
    if (!input || !input.value.trim()) return;
    if (!customerNotes[customerId]) customerNotes[customerId] = [];
    customerNotes[customerId].unshift({ text: input.value.trim(), date: '2026-03-21' });
    openCustomerProfile(customerId);
  };

  window._crmChangeTier = function (customerId, newTier) {
    const c = CUSTOMERS.find(x => x.id === customerId);
    if (c) {
      c.tier = newTier;
      toast(`${c.name || c.company} tier changed to ${newTier}`);
      openCustomerProfile(customerId);
      renderCustomers();
    }
  };

  window._crmSendReorderReminder = function (customerId) {
    const c = CUSTOMERS.find(x => x.id === customerId);
    if (!c) return;
    toast(`Reorder reminder sent to ${c.contact || c.name || c.company}!`);
  };

  window._crmNewCustomer = function () {
    toast('New customer form would open here.');
  };

  window._crmExportCustomers = function () {
    toast('Customer list exported to CSV.');
  };

  /* ═══════════════════════════════════════════════
     VIEW 2: AI SMART REORDER
  ═══════════════════════════════════════════════ */
  function renderReorder() {
    const container = document.getElementById('view-reorder');
    if (!container) return;

    const predictions = REORDER_PREDICTIONS.map(p => {
      const cust = CUSTOMERS.find(c => c.id === p.customerId);
      return { ...p, customer: cust };
    });

    const totalEstRevenue = predictions.reduce((sum, p) => sum + p.estValue, 0);
    const overdue = predictions.filter(p => p.status === 'overdue');
    const upcoming = predictions.filter(p => p.status === 'upcoming');
    const highConf = predictions.filter(p => p.confidence >= 90);

    let filteredPredictions = predictions;
    if (reorderFilter === 'high') filteredPredictions = highConf;
    else if (reorderFilter === 'overdue') filteredPredictions = overdue;
    else if (reorderFilter === 'upcoming') filteredPredictions = upcoming;

    // Sort by confidence desc
    const sortedForChart = [...predictions].sort((a, b) => b.confidence - a.confidence);

    container.innerHTML = `
      <!-- AI INSIGHTS BANNER -->
      <div style="background:linear-gradient(135deg,rgba(11,133,243,0.06),rgba(139,92,246,0.06));border:1px solid rgba(11,133,243,0.15);border-radius:14px;padding:20px 24px;margin-bottom:24px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#0b85f3,#8b5cf6,#0b85f3);"></div>
        <div style="display:flex;align-items:flex-start;gap:14px;">
          <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#0b85f3,#8b5cf6);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="20" height="20" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.27a7 7 0 01-13.46 0H5a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/><circle cx="12" cy="14" r="3"/></svg>
          </div>
          <div style="font-size:14px;color:#e2e8f0;line-height:1.6;">
            Based on 12 months of order data: <strong style="color:#0b85f3;">${predictions.length} customers</strong> predicted to reorder within 14 days. <strong style="color:#22c55e;">${fmt(totalEstRevenue)}</strong> estimated reorder revenue. <strong style="color:#f59e0b;">${overdue.length} accounts</strong> overdue for seasonal restock — highest churn risk.
          </div>
        </div>
      </div>

      <!-- STATS ROW -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:28px;">
        <div class="crm-stat-card" style="border-left:3px solid #22c55e;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:6px;">Predicted Reorders (14d)</div>
          <div style="display:flex;align-items:baseline;gap:10px;">
            <span style="font-size:32px;font-weight:700;color:#22c55e;">${predictions.length}</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.5);">${fmt(totalEstRevenue)} est. revenue</span>
          </div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #f59e0b;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:6px;">Overdue Restocks</div>
          <div style="display:flex;align-items:baseline;gap:10px;">
            <span style="font-size:32px;font-weight:700;color:#f59e0b;">${overdue.length}</span>
            <span style="font-size:13px;color:#f59e0b;font-weight:600;">Churn risk: HIGH</span>
          </div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #a855f7;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:6px;">Prediction Accuracy</div>
          <div style="display:flex;align-items:baseline;gap:10px;">
            <span style="font-size:32px;font-weight:700;color:#a855f7;">91%</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.5);">Based on last 6 months</span>
          </div>
        </div>
      </div>

      <!-- PREDICTION CONFIDENCE CHART -->
      <div class="crm-glass-card" style="margin-bottom:28px;">
        <h4 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 16px;">Prediction Confidence by Customer</h4>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${sortedForChart.map(p => {
            const custName = p.customer ? (p.customer.name || p.customer.company) : 'Customer #' + p.customerId;
            const confColor = p.confidence >= 90 ? '#22c55e' : p.confidence >= 80 ? '#f59e0b' : '#9ca3af';
            return `
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:140px;font-size:12px;color:rgba(255,255,255,0.6);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${custName}">${custName}</div>
                <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:4px;height:10px;overflow:hidden;position:relative;">
                  <div class="crm-bar" style="width:${p.confidence}%;background:${confColor};height:10px;border-radius:4px;"></div>
                </div>
                <div style="font-size:12px;font-weight:700;color:${confColor};width:40px;text-align:right;">${p.confidence}%</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- FILTER TABS -->
      <div style="display:flex;gap:6px;margin-bottom:20px;flex-wrap:wrap;" id="reorder-filter-tabs">
        <button class="crm-tab ${reorderFilter === 'all' ? 'active' : ''}" data-rf="all">All (${predictions.length})</button>
        <button class="crm-tab ${reorderFilter === 'high' ? 'active' : ''}" data-rf="high">High Confidence (${highConf.length})</button>
        <button class="crm-tab ${reorderFilter === 'overdue' ? 'active' : ''}" data-rf="overdue">Overdue (${overdue.length})</button>
        <button class="crm-tab ${reorderFilter === 'upcoming' ? 'active' : ''}" data-rf="upcoming">Upcoming (${upcoming.length})</button>
      </div>

      <!-- PREDICTIONS TABLE -->
      <div class="crm-glass" style="overflow-x:auto;">
        <table class="crm-table">
          <thead>
            <tr>
              <th style="width:30px;"></th>
              <th>Customer</th>
              <th>Last Order</th>
              <th>Avg Cycle</th>
              <th>Predicted Next</th>
              <th>Product Predictions</th>
              <th>Est. Value</th>
              <th>Confidence</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filteredPredictions.sort((a, b) => b.confidence - a.confidence).map(p => {
              const custName = p.customer ? (p.customer.name || p.customer.company) : 'Customer #' + p.customerId;
              const isOverdue = p.status === 'overdue';
              const daysOverdue = isOverdue ? daysAgo(p.nextPredicted) : 0;
              const daysAway = !isOverdue ? -daysAgo(p.nextPredicted) : 0;
              const confColor = p.confidence >= 90 ? '#22c55e' : p.confidence >= 80 ? '#f59e0b' : '#9ca3af';
              const confBg = p.confidence >= 90 ? 'rgba(34,197,94,0.12)' : p.confidence >= 80 ? 'rgba(245,158,11,0.12)' : 'rgba(156,163,175,0.12)';
              return `
                <tr>
                  <td>
                    ${isOverdue
                      ? '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" stroke-width="2"/><circle cx="12" cy="16" r="0.5" fill="#f59e0b" stroke="#f59e0b"/></svg>'
                      : '<svg width="18" height="18" fill="none" stroke="#0b85f3" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'}
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-weight:600;color:#fff;">${custName}</span>
                      ${isOverdue
                        ? `<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(239,68,68,0.12);color:#ef4444;font-weight:600;">${daysOverdue}d overdue</span>`
                        : `<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(11,133,243,0.12);color:#0b85f3;font-weight:600;">in ${daysAway}d</span>`}
                    </div>
                  </td>
                  <td>${fmtDate(p.lastOrder)}</td>
                  <td>${p.avgCycle}d</td>
                  <td>${fmtDate(p.nextPredicted)}</td>
                  <td>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;">
                      ${p.products.map(pr => `
                        <span style="font-size:11px;padding:2px 8px;border-radius:6px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);">
                          ${pr.sku} ${pr.name} <span style="color:rgba(255,255,255,0.4);">(${pr.qty}u)</span>
                        </span>
                      `).join('')}
                    </div>
                  </td>
                  <td style="font-weight:700;color:#fff;font-size:14px;">${fmt(p.estValue)}</td>
                  <td>
                    <span style="display:inline-block;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;background:${confBg};color:${confColor};">
                      ${p.confidence}%
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="crm-btn crm-btn-success crm-btn-sm" onclick="window._reorderSendReminder(${p.customerId})" title="Send Reminder">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Send
                      </button>
                      <button class="crm-btn crm-btn-glass crm-btn-sm" onclick="toast('Draft order created for ${custName.replace(/'/g, "\\'")}')" title="Draft Order">Draft</button>
                      <button class="crm-btn crm-btn-sm" style="background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.35);border:none;font-size:11px;" onclick="this.closest('tr').style.display='none';toast('Prediction dismissed')">Dismiss</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${filteredPredictions.length === 0 ? '<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.3);font-size:14px;">No predictions match this filter.</div>' : ''}
      </div>
    `;

    /* Bind filter tabs */
    $$('#reorder-filter-tabs .crm-tab').forEach(btn => {
      btn.addEventListener('click', function () {
        reorderFilter = this.dataset.rf;
        renderReorder();
      });
    });
  }

  /* ── Reorder Send Reminder Modal ── */
  window._reorderSendReminder = function (customerId) {
    const pred = REORDER_PREDICTIONS.find(p => p.customerId === customerId);
    const cust = CUSTOMERS.find(c => c.id === customerId);
    if (!pred || !cust) return;

    const oldOv = document.getElementById('reorder-remind-overlay');
    const oldMd = document.getElementById('reorder-remind-modal');
    if (oldOv) oldOv.remove();
    if (oldMd) oldMd.remove();

    const overlay = document.createElement('div');
    overlay.id = 'reorder-remind-overlay';
    overlay.className = 'crm-overlay';
    overlay.onclick = function () { overlay.remove(); modal.remove(); };
    document.body.appendChild(overlay);

    const contactName = cust.contact || cust.name || 'there';
    const productList = pred.products.map(p => `${p.name} (${p.qty} units)`).join(', ');

    const modal = document.createElement('div');
    modal.id = 'reorder-remind-modal';
    modal.className = 'crm-modal';
    modal.innerHTML = `
      <h3 style="font-size:18px;font-weight:700;color:#fff;margin:0 0 4px;">Send Reorder Reminder</h3>
      <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 20px;">${cust.name || cust.company} &middot; ${cust.email || ''}</p>

      <div style="margin-bottom:16px;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);display:block;margin-bottom:6px;">Predicted Products</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${pred.products.map(p => `
            <span style="font-size:12px;padding:4px 10px;border-radius:8px;background:rgba(11,133,243,0.1);color:#0b85f3;border:1px solid rgba(11,133,243,0.2);">
              ${p.sku} ${p.name} (${p.qty}u)
            </span>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <label style="font-size:12px;color:rgba(255,255,255,0.5);display:block;margin-bottom:6px;">Email Preview</label>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;font-size:13px;color:#e2e8f0;line-height:1.7;">
          Hi ${contactName},<br><br>
          Based on your order history, you typically reorder around now. We have <strong>${productList}</strong> in stock and ready to ship.<br><br>
          Would you like us to prepare an order? Just reply to this email or log into your portal to place it directly.<br><br>
          Best regards,<br>
          U.S. Apparel Team
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button class="crm-btn crm-btn-glass" onclick="document.getElementById('reorder-remind-overlay').click()">Cancel</button>
        <button class="crm-btn crm-btn-primary" onclick="document.getElementById('reorder-remind-overlay').click();toast('Reminder email sent to ${(cust.contact || cust.name || '').replace(/'/g, "\\'")}!')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          Send Email
        </button>
        <button class="crm-btn crm-btn-success" onclick="document.getElementById('reorder-remind-overlay').click();toast('Reminder sent & draft order created!')">
          Send & Draft Order
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  };

  /* ═══════════════════════════════════════════════
     VIEW 3: CUSTOMER PORTAL
  ═══════════════════════════════════════════════ */
  let portalSection = 'dashboard';
  let expandedPortalOrder = null;

  function renderPortal() {
    const container = document.getElementById('view-portal');
    if (!container) return;

    if (!portalLoggedIn) {
      renderPortalLogin(container);
    } else {
      renderPortalDashboard(container);
    }
  }

  function renderPortalLogin(container) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:500px;">
        <div style="width:380px;background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px;box-shadow:0 24px 64px rgba(0,0,0,0.3);">
          <!-- Logo -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#0b85f3,#6366f1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
              <svg width="32" height="32" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h2 style="font-size:20px;font-weight:700;color:#fff;margin:0;">U.S. Apparel</h2>
            <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:4px 0 0;">Customer Portal</p>
          </div>

          <!-- Form -->
          <div style="margin-bottom:16px;">
            <label style="font-size:12px;color:rgba(255,255,255,0.5);display:block;margin-bottom:4px;">Email</label>
            <input type="email" class="crm-input" id="portal-email" placeholder="your@company.com" value="mwilliams@sandals.com" />
          </div>
          <div style="margin-bottom:24px;">
            <label style="font-size:12px;color:rgba(255,255,255,0.5);display:block;margin-bottom:4px;">Password</label>
            <input type="password" class="crm-input" id="portal-password" placeholder="Enter your password" value="demo1234" />
          </div>
          <button class="crm-btn crm-btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:14px;" id="portal-login-btn">
            Sign In
          </button>
          <p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.3);margin:16px 0 0;">Demo: Click Sign In to log in as Sandals Resort Group</p>
        </div>
      </div>
    `;

    document.getElementById('portal-login-btn').addEventListener('click', function () {
      portalLoggedIn = true;
      portalSection = 'dashboard';
      renderPortal();
    });
  }

  function renderPortalDashboard(container) {
    const u = PORTAL_USER;
    const cartCount = portalCart.reduce((sum, item) => sum + item.qty, 0);
    const openOrders = PORTAL_ORDERS.filter(o => o.status !== 'delivered').length;
    const lastOrder = PORTAL_ORDERS[0];

    container.innerHTML = `
      <!-- TOP BAR -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;">MW</div>
          <div>
            <div style="font-size:16px;font-weight:600;color:#fff;">Welcome back, ${u.name}</div>
            <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,0.45);">
              ${u.company}
              <span style="padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;background:rgba(168,85,247,0.15);color:#a855f7;">${u.tier}</span>
            </div>
          </div>
        </div>
        <button class="crm-btn crm-btn-glass" onclick="window._portalLogout()">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          Logout
        </button>
      </div>

      <!-- PORTAL NAV -->
      <div style="display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;background:rgba(255,255,255,0.02);border-radius:12px;padding:6px;" id="portal-nav">
        <button class="portal-nav-btn ${portalSection === 'dashboard' ? 'active' : ''}" data-sec="dashboard">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          Dashboard
        </button>
        <button class="portal-nav-btn ${portalSection === 'orders' ? 'active' : ''}" data-sec="orders">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          My Orders
        </button>
        <button class="portal-nav-btn ${portalSection === 'catalog' ? 'active' : ''}" data-sec="catalog">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
          Browse Catalog
        </button>
        <button class="portal-nav-btn ${portalSection === 'reorder' ? 'active' : ''}" data-sec="reorder">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Quick Reorder
        </button>
        <button class="portal-nav-btn ${portalSection === 'invoices' ? 'active' : ''}" data-sec="invoices">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Invoices
        </button>
        <button class="portal-nav-btn ${portalSection === 'account' ? 'active' : ''}" data-sec="account">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Account
        </button>
      </div>

      <!-- PORTAL CONTENT -->
      <div id="portal-content"></div>

      <!-- FLOATING CART BUTTON -->
      <div id="portal-cart-fab" style="position:fixed;bottom:28px;right:28px;z-index:9990;">
        <button onclick="window._portalToggleCart()" style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#0b85f3,#6366f1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 32px rgba(11,133,243,0.4);transition:transform .2s;position:relative;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="24" height="24" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
          ${cartCount > 0 ? `<span style="position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${cartCount}</span>` : ''}
        </button>
      </div>
    `;

    /* Render active section */
    const content = document.getElementById('portal-content');
    switch (portalSection) {
      case 'dashboard': renderPortalHome(content); break;
      case 'orders': renderPortalOrders(content); break;
      case 'catalog': renderPortalCatalog(content); break;
      case 'reorder': renderPortalReorder(content); break;
      case 'invoices': renderPortalInvoices(content); break;
      case 'account': renderPortalAccount(content); break;
    }

    /* Bind nav */
    $$('#portal-nav .portal-nav-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        portalSection = this.dataset.sec;
        renderPortal();
      });
    });
  }

  /* ── Portal: Dashboard Home ── */
  function renderPortalHome(el) {
    const openOrders = PORTAL_ORDERS.filter(o => o.status !== 'delivered').length;
    const lastOrder = PORTAL_ORDERS[0];
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        <div class="crm-stat-card" style="border-left:3px solid #0b85f3;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:6px;">Open Orders</div>
          <div style="font-size:32px;font-weight:700;color:#0b85f3;">${openOrders}</div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #22c55e;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:6px;">Last Order</div>
          <div style="font-size:22px;font-weight:700;color:#22c55e;">${fmt(lastOrder.total)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">${fmtDate(lastOrder.date)}</div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #a855f7;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:6px;">Account Balance</div>
          <div style="font-size:22px;font-weight:700;color:#a855f7;">$0</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">Current</div>
        </div>
        <div class="crm-stat-card" style="border-left:3px solid #f59e0b;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.4);margin-bottom:6px;">Tier</div>
          <div style="font-size:22px;font-weight:700;color:#f59e0b;">${PORTAL_USER.tier}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">${PORTAL_USER.discount}% discount</div>
        </div>
      </div>

      <!-- RECENT ORDERS -->
      <div style="margin-top:28px;">
        <h4 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 14px;">Recent Orders</h4>
        <div class="crm-glass" style="overflow-x:auto;">
          <table class="crm-table">
            <thead>
              <tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              ${PORTAL_ORDERS.slice(0, 3).map(o => `
                <tr>
                  <td style="font-weight:600;color:#fff;">${o.id}</td>
                  <td>${fmtDate(o.date)}</td>
                  <td style="font-weight:600;">${fmt(o.total)}</td>
                  <td>
                    <span style="padding:2px 10px;border-radius:6px;font-size:11px;font-weight:600;
                      background:${o.status === 'delivered' ? 'rgba(34,197,94,0.12)' : o.status === 'shipped' ? 'rgba(11,133,243,0.12)' : 'rgba(245,158,11,0.12)'};
                      color:${o.status === 'delivered' ? '#22c55e' : o.status === 'shipped' ? '#0b85f3' : '#f59e0b'};">
                      ${o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button class="crm-btn crm-btn-glass crm-btn-sm" onclick="window._portalNav('orders')">View</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap;">
        <button class="crm-btn crm-btn-primary" onclick="window._portalNav('catalog')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg>
          Browse Catalog
        </button>
        <button class="crm-btn crm-btn-success" onclick="window._portalNav('reorder')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          Quick Reorder
        </button>
        <button class="crm-btn crm-btn-glass" onclick="window._portalNav('invoices')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
          View Invoices
        </button>
      </div>
    `;
  }

  /* ── Portal: My Orders ── */
  function renderPortalOrders(el) {
    el.innerHTML = `
      <h4 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 14px;">My Orders</h4>
      <div class="crm-glass" style="overflow-x:auto;">
        <table class="crm-table">
          <thead>
            <tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${PORTAL_ORDERS.map(o => `
              <tr>
                <td style="font-weight:600;color:#fff;">${o.id}</td>
                <td>${fmtDate(o.date)}</td>
                <td>${o.items.length} items</td>
                <td style="font-weight:600;">${fmt(o.total)}</td>
                <td>
                  <span style="padding:2px 10px;border-radius:6px;font-size:11px;font-weight:600;
                    background:${o.status === 'delivered' ? 'rgba(34,197,94,0.12)' : o.status === 'shipped' ? 'rgba(11,133,243,0.12)' : 'rgba(245,158,11,0.12)'};
                    color:${o.status === 'delivered' ? '#22c55e' : o.status === 'shipped' ? '#0b85f3' : '#f59e0b'};">
                    ${o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                  </span>
                </td>
                <td style="display:flex;gap:6px;">
                  <button class="crm-btn crm-btn-glass crm-btn-sm" onclick="window._portalExpandOrder('${o.id}')">
                    ${expandedPortalOrder === o.id ? 'Collapse' : 'Details'}
                  </button>
                  ${o.tracking ? `<button class="crm-btn crm-btn-primary crm-btn-sm" onclick="window._portalTrack('${o.tracking}')">Track</button>` : ''}
                  <button class="crm-btn crm-btn-success crm-btn-sm" onclick="window._portalReorderOrder('${o.id}')">Reorder</button>
                </td>
              </tr>
              ${expandedPortalOrder === o.id ? `
                <tr>
                  <td colspan="6" style="padding:0 14px 14px;">
                    <div style="background:rgba(255,255,255,0.02);border-radius:10px;padding:14px;">
                      <table style="width:100%;border-collapse:collapse;">
                        <thead>
                          <tr>
                            <th style="text-align:left;font-size:11px;color:rgba(255,255,255,0.4);padding:6px 10px;text-transform:uppercase;">SKU</th>
                            <th style="text-align:left;font-size:11px;color:rgba(255,255,255,0.4);padding:6px 10px;text-transform:uppercase;">Product</th>
                            <th style="text-align:right;font-size:11px;color:rgba(255,255,255,0.4);padding:6px 10px;text-transform:uppercase;">Qty</th>
                            <th style="text-align:right;font-size:11px;color:rgba(255,255,255,0.4);padding:6px 10px;text-transform:uppercase;">Price</th>
                            <th style="text-align:right;font-size:11px;color:rgba(255,255,255,0.4);padding:6px 10px;text-transform:uppercase;">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${o.items.map(item => `
                            <tr>
                              <td style="padding:6px 10px;font-size:12px;color:rgba(255,255,255,0.5);">${item.sku}</td>
                              <td style="padding:6px 10px;font-size:13px;color:#e2e8f0;">${item.name}</td>
                              <td style="padding:6px 10px;font-size:13px;color:#e2e8f0;text-align:right;">${item.qty}</td>
                              <td style="padding:6px 10px;font-size:13px;color:#e2e8f0;text-align:right;">${fmt(item.price)}</td>
                              <td style="padding:6px 10px;font-size:13px;font-weight:600;color:#fff;text-align:right;">${fmt(item.qty * item.price)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      ${o.tracking ? `
                        <div style="margin-top:12px;padding:10px;background:rgba(11,133,243,0.08);border-radius:8px;font-size:12px;">
                          <span style="color:rgba(255,255,255,0.5);">Tracking:</span>
                          <span style="color:#0b85f3;font-weight:600;margin-left:6px;">${o.tracking}</span>
                        </div>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              ` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ── Portal: Browse Catalog ── */
  function renderPortalCatalog(el) {
    const discount = PORTAL_USER.discount / 100;
    const catalogProducts = PRODUCTS.slice(0, 20); // Show first 20

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px;">
        <h4 style="font-size:16px;font-weight:600;color:#fff;margin:0;">Product Catalog</h4>
        <div style="font-size:13px;color:rgba(255,255,255,0.45);">
          Your tier pricing: <span style="color:#a855f7;font-weight:600;">${PORTAL_USER.tier} (${PORTAL_USER.discount}% off)</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
        ${catalogProducts.map(p => {
          const basePrice = p.price || p.wholesale || 15;
          const tierPrice = (basePrice * (1 - discount)).toFixed(2);
          return `
            <div class="crm-glass-card" style="display:flex;flex-direction:column;gap:10px;">
              <div style="height:120px;background:linear-gradient(135deg,rgba(11,133,243,0.08),rgba(139,92,246,0.08));border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M20.38 3.46L16 2 12 3.46 8 2 3.62 3.46a1 1 0 00-.62.94v15.2a1 1 0 00.62.94L8 22l4-1.46L16 22l4.38-1.46a1 1 0 00.62-.94V4.4a1 1 0 00-.62-.94z"/></svg>
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:#fff;">${p.name}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.35);">${p.sku || ''} ${p.category ? '&middot; ' + p.category : ''}</div>
              </div>
              <div style="display:flex;align-items:baseline;gap:8px;">
                <span style="font-size:16px;font-weight:700;color:#22c55e;">$${tierPrice}</span>
                <span style="font-size:12px;color:rgba(255,255,255,0.3);text-decoration:line-through;">$${Number(basePrice).toFixed(2)}</span>
              </div>
              <button class="crm-btn crm-btn-primary crm-btn-sm" style="width:100%;justify-content:center;" onclick="window._portalAddToCart('${(p.sku || '').replace(/'/g, "\\'")}', '${(p.name || '').replace(/'/g, "\\'")}', ${tierPrice})">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                Add to Cart
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ── Portal: Quick Reorder ── */
  function renderPortalReorder(el) {
    // Build frequency from portal orders
    const productFreq = {};
    PORTAL_ORDERS.forEach(o => {
      o.items.forEach(item => {
        if (!productFreq[item.sku]) productFreq[item.sku] = { ...item, totalQty: 0, orders: 0 };
        productFreq[item.sku].totalQty += item.qty;
        productFreq[item.sku].orders++;
      });
    });
    const topProducts = Object.values(productFreq).sort((a, b) => b.totalQty - a.totalQty);
    const lastOrder = PORTAL_ORDERS[0];

    el.innerHTML = `
      <h4 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 16px;">Quick Reorder</h4>

      <!-- Reorder Last Order -->
      <div class="crm-glass-card" style="margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:14px;font-weight:600;color:#fff;">Reorder Last Order</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:2px;">${lastOrder.id} &middot; ${fmtDate(lastOrder.date)} &middot; ${lastOrder.items.length} items &middot; ${fmt(lastOrder.total)}</div>
          </div>
          <button class="crm-btn crm-btn-success" onclick="window._portalReorderOrder('${lastOrder.id}')">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Reorder Now
          </button>
        </div>
      </div>

      <!-- Most Ordered Products -->
      <h5 style="font-size:14px;font-weight:600;color:#fff;margin:0 0 12px;">Your Most Ordered Products</h5>
      <div class="crm-glass" style="overflow-x:auto;">
        <table class="crm-table">
          <thead>
            <tr><th>SKU</th><th>Product</th><th>Total Ordered</th><th>Unit Price</th><th>Qty</th><th></th></tr>
          </thead>
          <tbody>
            ${topProducts.map(p => `
              <tr>
                <td style="font-size:12px;color:rgba(255,255,255,0.5);">${p.sku}</td>
                <td style="font-weight:500;color:#fff;">${p.name}</td>
                <td>${p.totalQty.toLocaleString()} units (${p.orders} orders)</td>
                <td style="font-weight:600;">${fmt(p.price)}</td>
                <td style="width:100px;">
                  <input type="number" class="crm-input" style="width:80px;padding:6px 8px;text-align:center;" value="${Math.round(p.totalQty / p.orders)}" min="1" id="reorder-qty-${p.sku.replace(/[^a-zA-Z0-9]/g, '_')}" />
                </td>
                <td>
                  <button class="crm-btn crm-btn-primary crm-btn-sm" onclick="window._portalAddToCartWithQty('${p.sku.replace(/'/g, "\\'")}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, 'reorder-qty-${p.sku.replace(/[^a-zA-Z0-9]/g, '_')}')">
                    Add to Cart
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ── Portal: Invoices ── */
  function renderPortalInvoices(el) {
    el.innerHTML = `
      <h4 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 14px;">My Invoices</h4>
      <div class="crm-glass" style="overflow-x:auto;">
        <table class="crm-table">
          <thead>
            <tr><th>Invoice</th><th>Order</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            ${PORTAL_INVOICES.map(inv => `
              <tr>
                <td style="font-weight:600;color:#fff;">${inv.id}</td>
                <td>${inv.orderId}</td>
                <td>${fmtDate(inv.date)}</td>
                <td style="font-weight:600;">${fmt(inv.amount)}</td>
                <td>
                  <span style="padding:2px 10px;border-radius:6px;font-size:11px;font-weight:600;
                    background:${inv.status === 'paid' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)'};
                    color:${inv.status === 'paid' ? '#22c55e' : '#f59e0b'};">
                    ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button class="crm-btn crm-btn-glass crm-btn-sm" onclick="toast('Downloading ${inv.id}.pdf...')">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Download PDF
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ── Portal: Account Settings ── */
  function renderPortalAccount(el) {
    const u = PORTAL_USER;
    el.innerHTML = `
      <h4 style="font-size:16px;font-weight:600;color:#fff;margin:0 0 14px;">Account Settings</h4>

      <div class="crm-glass-card" style="margin-bottom:20px;">
        <h5 style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;margin:0 0 14px;">Company Information</h5>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:14px;">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:2px;">Company Name</div>
            <div style="color:#fff;font-weight:500;">${u.company}</div>
          </div>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:2px;">Account Tier</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:rgba(168,85,247,0.15);color:#a855f7;">${u.tier}</span>
              <span style="font-size:12px;color:rgba(255,255,255,0.4);">${u.discount}% discount</span>
            </div>
          </div>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:2px;">Primary Contact</div>
            <div style="color:#fff;font-weight:500;">${u.name} Williams</div>
          </div>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:2px;">Customer Since</div>
            <div style="color:#fff;font-weight:500;">${fmtDate(u.customerSince)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:2px;">Email</div>
            <div style="color:#fff;font-weight:500;">${u.email}</div>
          </div>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:2px;">Phone</div>
            <div style="color:#fff;font-weight:500;">${u.phone}</div>
          </div>
        </div>
      </div>

      <div class="crm-glass-card">
        <h5 style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.05em;margin:0 0 14px;">Shipping Addresses</h5>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${u.shippingAddresses.map((addr, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
              <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div style="font-size:13px;color:#e2e8f0;">${addr}</div>
              ${i === 0 ? '<span style="margin-left:auto;font-size:10px;padding:2px 8px;border-radius:6px;background:rgba(11,133,243,0.12);color:#0b85f3;font-weight:600;">Default</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ── Portal Cart Overlay ── */
  function togglePortalCart() {
    const existing = document.getElementById('portal-cart-overlay');
    if (existing) {
      existing.remove();
      document.getElementById('portal-cart-panel')?.remove();
      return;
    }

    const cartTotal = portalCart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const overlay = document.createElement('div');
    overlay.id = 'portal-cart-overlay';
    overlay.className = 'crm-overlay';
    overlay.onclick = function () { overlay.remove(); panel.remove(); };
    document.body.appendChild(overlay);

    const panel = document.createElement('div');
    panel.id = 'portal-cart-panel';
    panel.style.cssText = 'position:fixed;bottom:96px;right:28px;z-index:9999;width:380px;max-width:90vw;background:linear-gradient(180deg,rgba(26,26,46,0.99),rgba(18,18,36,0.99));border:1px solid rgba(255,255,255,0.08);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.5);animation:slideUp .3s ease;';
    panel.innerHTML = `
      <div style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4 style="font-size:16px;font-weight:700;color:#fff;margin:0;">Your Cart</h4>
          <span style="font-size:13px;color:rgba(255,255,255,0.4);">${portalCart.length} items</span>
        </div>

        ${portalCart.length === 0
          ? '<div style="text-align:center;padding:24px;color:rgba(255,255,255,0.3);font-size:14px;">Your cart is empty</div>'
          : `
            <div style="max-height:260px;overflow-y:auto;margin-bottom:16px;">
              ${portalCart.map((item, idx) => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                  <div style="flex:1;">
                    <div style="font-size:13px;font-weight:500;color:#fff;">${item.name}</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.35);">${item.sku} &middot; ${fmt(item.price)}/ea</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <button onclick="window._portalCartQty(${idx}, -1)" style="width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,0.06);border:none;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">-</button>
                    <span style="font-size:13px;font-weight:600;color:#fff;min-width:24px;text-align:center;">${item.qty}</span>
                    <button onclick="window._portalCartQty(${idx}, 1)" style="width:24px;height:24px;border-radius:6px;background:rgba(255,255,255,0.06);border:none;color:#e2e8f0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;">+</button>
                  </div>
                  <div style="font-size:13px;font-weight:600;color:#fff;min-width:60px;text-align:right;">${fmt(item.price * item.qty)}</div>
                  <button onclick="window._portalCartRemove(${idx})" style="background:none;border:none;color:rgba(255,255,255,0.25);cursor:pointer;padding:4px;">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              `).join('')}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-top:1px solid rgba(255,255,255,0.08);margin-bottom:14px;">
              <span style="font-size:14px;color:rgba(255,255,255,0.6);">Subtotal</span>
              <span style="font-size:18px;font-weight:700;color:#fff;">${fmt(cartTotal)}</span>
            </div>

            <button class="crm-btn crm-btn-success" style="width:100%;justify-content:center;padding:12px;font-size:14px;" onclick="window._portalSubmitOrder()">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Submit Order
            </button>
          `}
      </div>
    `;
    document.body.appendChild(panel);
  }

  /* ── Portal Handlers ── */
  window._portalLogout = function () {
    portalLoggedIn = false;
    portalCart = [];
    portalSection = 'dashboard';
    expandedPortalOrder = null;
    renderPortal();
  };

  window._portalNav = function (sec) {
    portalSection = sec;
    renderPortal();
  };

  window._portalExpandOrder = function (orderId) {
    expandedPortalOrder = expandedPortalOrder === orderId ? null : orderId;
    renderPortal();
  };

  window._portalTrack = function (tracking) {
    toast('Tracking: ' + tracking + ' — Package is in transit via UPS');
  };

  window._portalReorderOrder = function (orderId) {
    const order = PORTAL_ORDERS.find(o => o.id === orderId);
    if (!order) return;
    order.items.forEach(item => {
      const existing = portalCart.find(c => c.sku === item.sku);
      if (existing) {
        existing.qty += item.qty;
      } else {
        portalCart.push({ sku: item.sku, name: item.name, price: item.price, qty: item.qty });
      }
    });
    toast(`${order.items.length} items from ${orderId} added to cart!`);
    renderPortal();
  };

  window._portalAddToCart = function (sku, name, price) {
    const existing = portalCart.find(c => c.sku === sku);
    if (existing) {
      existing.qty += 50;
    } else {
      portalCart.push({ sku: sku, name: name, price: Number(price), qty: 50 });
    }
    toast(`${name} added to cart!`);
    renderPortal();
  };

  window._portalAddToCartWithQty = function (sku, name, price, qtyInputId) {
    const input = document.getElementById(qtyInputId);
    const qty = input ? parseInt(input.value, 10) || 50 : 50;
    const existing = portalCart.find(c => c.sku === sku);
    if (existing) {
      existing.qty += qty;
    } else {
      portalCart.push({ sku: sku, name: name, price: Number(price), qty: qty });
    }
    toast(`${name} (${qty} units) added to cart!`);
    renderPortal();
  };

  window._portalToggleCart = togglePortalCart;

  window._portalCartQty = function (idx, delta) {
    if (portalCart[idx]) {
      portalCart[idx].qty = Math.max(1, portalCart[idx].qty + delta);
      togglePortalCart();
      togglePortalCart();
    }
  };

  window._portalCartRemove = function (idx) {
    portalCart.splice(idx, 1);
    togglePortalCart();
    togglePortalCart();
    renderPortal();
  };

  window._portalSubmitOrder = function () {
    const overlay = document.getElementById('portal-cart-overlay');
    const panel = document.getElementById('portal-cart-panel');
    if (overlay) overlay.remove();
    if (panel) panel.remove();
    portalCart = [];
    toast('Order submitted! You\'ll receive confirmation at ' + PORTAL_USER.email);
    renderPortal();
  };

  /* ─────────────────────────────────────────────
     EXPORTS & INIT
  ───────────────────────────────────────────── */
  window.renderCustomers = renderCustomers;
  window.renderReorder = renderReorder;
  window.renderPortal = renderPortal;

  document.addEventListener('DOMContentLoaded', function () {
    renderCustomers();
    renderReorder();
    renderPortal();
  });

})();
