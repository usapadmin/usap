/**
 * US Apparel LLC — Settings View, Notification Center, Toast System, Keyboard Shortcuts
 * Populates: #view-settings
 * Enhances: #notifBtn (bell icon in top bar)
 * Exposes: window.showToast(message, type, duration)
 * Depends on: window.APP_DATA { PRODUCTS, CUSTOMERS, ORDERS }
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
     SETTINGS STATE
  ──────────────────────────────────────────── */
  let settingsSection = 'company';

  let companyProfile = {
    name: 'U.S. Apparel LLC',
    address: '7414 Kingspointe Pkwy #400, Orlando, FL 32819',
    phone: '(407) 447-9980',
    email: 'info@usapparelonline.com',
    logo: null
  };

  let pricingTiers = [
    { id: 1, name: 'Platinum', discount: 20, terms: 'Net 45', freeShipping: 500, minOrder: 1000 },
    { id: 2, name: 'Gold', discount: 15, terms: 'Net 30', freeShipping: 750, minOrder: 500 },
    { id: 3, name: 'Silver', discount: 10, terms: 'Net 15', freeShipping: 1000, minOrder: 250 }
  ];

  let notifPrefs = {
    orderReceived: true,
    orderShipped: true,
    lowStock: true,
    reorderPrediction: true,
    newCustomer: true,
    paymentReceived: true
  };

  let emailRecipients = [
    'tahir@usapparelonline.com',
    'warehouse@usapparelonline.com',
    'sales@usapparelonline.com'
  ];

  let smsEnabled = false;

  let integrations = [
    { id: 'quickbooks', name: 'QuickBooks Desktop', icon: 'fa-calculator', status: 'connected', lastSync: '2026-03-21 14:32', color: '#22c55e' },
    { id: 'shipstation', name: 'ShipStation', icon: 'fa-ship', status: 'connected', lastSync: '2026-03-21 15:05', color: '#22c55e' },
    { id: 'ups', name: 'UPS API', icon: 'fa-truck', status: 'connected', lastSync: '2026-03-21 15:12', color: '#22c55e' },
    { id: 'fedex', name: 'FedEx API', icon: 'fa-truck-fast', status: 'connected', lastSync: '2026-03-21 14:58', color: '#22c55e' },
    { id: 'elastic', name: 'Elastic Portal', icon: 'fa-globe', status: 'connected', lastSync: '2026-03-21 13:45', color: '#22c55e' }
  ];

  let users = [
    { id: 1, name: 'Tahir Ahmed', email: 'tahir@usapparelonline.com', role: 'Admin', lastLogin: '2026-03-21 15:10', active: true },
    { id: 2, name: 'Warehouse Team', email: 'warehouse@usapparelonline.com', role: 'Picker', lastLogin: '2026-03-21 14:45', active: true },
    { id: 3, name: 'Sales Rep', email: 'sales@usapparelonline.com', role: 'Sales', lastLogin: '2026-03-21 12:30', active: true },
    { id: 4, name: 'Customer Service', email: 'support@usapparelonline.com', role: 'Support', lastLogin: '2026-03-20 17:00', active: true }
  ];

  let shippingConfig = {
    defaultCarrier: 'ups',
    warehouseAddress: '7414 Kingspointe Pkwy #400, Orlando, FL 32819',
    cutoffTime: '14:00',
    methods: { ground: true, express: true, freight: true },
    rateMarkup: 5
  };

  let lastBackup = '2026-03-21 02:00 AM';

  /* ────────────────────────────────────────────
     NOTIFICATION CENTER STATE
  ──────────────────────────────────────────── */
  let notifications = [
    { id: 1, type: 'order', icon: 'fa-shopping-cart', title: 'New Order Received', desc: 'Order #USA-26-4281 from Hilton Hotels — $5,775', time: '2 min ago', read: false, view: 'orders' },
    { id: 2, type: 'inventory', icon: 'fa-triangle-exclamation', title: 'LOW STOCK: Primitive (MCS-311)', desc: 'Down to 22 units — below reorder threshold', time: '15 min ago', read: false, view: 'inventory' },
    { id: 3, type: 'shipping', icon: 'fa-truck-fast', title: 'Order Shipped', desc: 'Sandals Resort Group order #USA-26-4280 shipped via FedEx', time: '1 hr ago', read: false, view: 'orders' },
    { id: 4, type: 'customer', icon: 'fa-user-plus', title: 'New Customer Application', desc: 'Ocean View Resorts, Panama City submitted application', time: '2 hrs ago', read: false, view: 'customers' },
    { id: 5, type: 'inventory', icon: 'fa-rotate', title: 'REORDER ALERT', desc: 'Tropical Outfitters overdue for restock by 3 days', time: '3 hrs ago', read: true, view: 'reorder' },
    { id: 6, type: 'order', icon: 'fa-credit-card', title: 'Payment Received', desc: 'Paradise Print Shop — $8,375 via wire transfer', time: '5 hrs ago', read: true, view: 'orders' },
    { id: 7, type: 'inventory', icon: 'fa-triangle-exclamation', title: 'CRITICAL: Ladies GD Baby Tee', desc: 'YJY-4292 at 18 units — immediate restock needed', time: '6 hrs ago', read: true, view: 'inventory' },
    { id: 8, type: 'order', icon: 'fa-shopping-cart', title: 'New Order Placed', desc: 'Beach Vibes Wholesale order #USA-26-4279 — $5,112', time: '8 hrs ago', read: true, view: 'orders' },
    { id: 9, type: 'shipping', icon: 'fa-box', title: 'Order Delivered', desc: 'Paradise Print Shop order #USA-26-4273 confirmed delivered', time: '12 hrs ago', read: true, view: 'orders' },
    { id: 10, type: 'customer', icon: 'fa-chart-line', title: 'Customer Milestone', desc: 'Hilton Hotels crossed $200K lifetime value', time: '1 day ago', read: true, view: 'customers' }
  ];

  let notifPanelOpen = false;

  /* ────────────────────────────────────────────
     HELPERS
  ──────────────────────────────────────────── */
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function notifTypeColor(type) {
    switch (type) {
      case 'order': return { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' };
      case 'inventory': return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' };
      case 'customer': return { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' };
      case 'shipping': return { bg: 'rgba(168,85,247,0.15)', text: '#a855f7' };
      default: return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
    }
  }

  function unreadCount() {
    return notifications.filter(n => !n.read).length;
  }

  /* ────────────────────────────────────────────
     SETTINGS VIEW — SIDEBAR NAV
  ──────────────────────────────────────────── */
  const settingsSections = [
    { id: 'company', label: 'Company Profile', icon: 'fa-building' },
    { id: 'pricing', label: 'Pricing Tiers', icon: 'fa-tags' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'integrations', label: 'Integrations', icon: 'fa-plug' },
    { id: 'users', label: 'User Management', icon: 'fa-users-gear' },
    { id: 'shipping', label: 'Shipping', icon: 'fa-truck' },
    { id: 'data', label: 'Data & Export', icon: 'fa-database' }
  ];

  /* ────────────────────────────────────────────
     RENDER: SETTINGS VIEW
  ──────────────────────────────────────────── */
  function renderSettings() {
    const container = document.getElementById('view-settings');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <div>
          <h2 style="font-size:22px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">Settings</h2>
          <p style="font-size:13px;color:var(--text-muted);">Manage your company configuration, integrations, and preferences</p>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:11px;color:var(--text-muted);">Last saved: Mar 21, 2026 3:12 PM</span>
        </div>
      </div>

      <div style="display:flex;gap:24px;min-height:calc(100vh - 180px);">
        <!-- Settings Nav -->
        <div id="settingsNav" style="width:220px;flex-shrink:0;">
          ${renderSettingsNav()}
        </div>
        <!-- Settings Content -->
        <div id="settingsContent" style="flex:1;min-width:0;">
          ${renderSettingsContent()}
        </div>
      </div>
    `;

    wireSettingsEvents();
  }

  function renderSettingsNav() {
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:8px;position:sticky;top:84px;">
        ${settingsSections.map(s => `
          <div class="settings-nav-item ${s.id === settingsSection ? 'active' : ''}" data-section="${s.id}"
               style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;cursor:pointer;
               transition:all 0.2s ease;margin-bottom:2px;
               ${s.id === settingsSection
                 ? 'background:rgba(11,133,243,0.12);color:#36a5ff;'
                 : 'color:var(--text-muted);'}">
            <i class="fas ${s.icon}" style="width:18px;text-align:center;font-size:14px;"></i>
            <span style="font-size:13px;font-weight:${s.id === settingsSection ? '600' : '500'};">${s.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderSettingsContent() {
    switch (settingsSection) {
      case 'company': return renderCompanyProfile();
      case 'pricing': return renderPricingTiers();
      case 'notifications': return renderNotificationPrefs();
      case 'integrations': return renderIntegrations();
      case 'users': return renderUserManagement();
      case 'shipping': return renderShippingConfig();
      case 'data': return renderDataExport();
      default: return '';
    }
  }

  /* ────────────────────────────────────────────
     SECTION: COMPANY PROFILE
  ──────────────────────────────────────────── */
  function renderCompanyProfile() {
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Company Profile</h3>
            <p style="font-size:12px;color:var(--text-muted);">Your business information displayed on invoices and correspondence</p>
          </div>
          <div style="display:flex;align-items:center;gap:4px;padding:4px 12px;border-radius:8px;background:rgba(34,197,94,0.1);color:#22c55e;font-size:11px;font-weight:600;">
            <i class="fas fa-check-circle"></i> Verified
          </div>
        </div>

        <!-- Logo Upload -->
        <div style="display:flex;gap:24px;margin-bottom:24px;">
          <div id="logoUploadArea" style="width:120px;height:120px;border-radius:16px;border:2px dashed rgba(255,255,255,0.1);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s ease;flex-shrink:0;background:rgba(255,255,255,0.02);">
            <i class="fas fa-cloud-upload-alt" style="font-size:24px;color:var(--text-muted);margin-bottom:6px;"></i>
            <span style="font-size:10px;color:var(--text-muted);text-align:center;">Upload Logo<br>PNG, SVG</span>
          </div>
          <div style="flex:1;">
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Company Name</div>
            <input type="text" id="companyName" value="${esc(companyProfile.name)}"
              style="width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:10px;padding:0 14px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none;margin-bottom:16px;transition:border-color 0.2s;">
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Address</div>
            <input type="text" id="companyAddress" value="${esc(companyProfile.address)}"
              style="width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:10px;padding:0 14px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;">
          </div>
        </div>

        <!-- Phone & Email Row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Phone</div>
            <input type="text" id="companyPhone" value="${esc(companyProfile.phone)}"
              style="width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:10px;padding:0 14px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;">
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Email</div>
            <input type="text" id="companyEmail" value="${esc(companyProfile.email)}"
              style="width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:10px;padding:0 14px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;">
          </div>
        </div>

        <!-- Save Button -->
        <div style="display:flex;justify-content:flex-end;">
          <button id="saveCompanyBtn"
            style="display:flex;align-items:center;gap:8px;padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#0b85f3,#36a5ff);color:white;font-size:13px;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all 0.2s ease;box-shadow:0 4px 16px rgba(11,133,243,0.3);">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────
     SECTION: PRICING TIERS
  ──────────────────────────────────────────── */
  function renderPricingTiers() {
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Pricing Tiers</h3>
            <p style="font-size:12px;color:var(--text-muted);">Configure discount levels, payment terms, and order thresholds for each customer tier</p>
          </div>
          <button id="addTierBtn"
            style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:rgba(11,133,243,0.12);color:#36a5ff;font-size:12px;font-weight:600;border:1px solid rgba(11,133,243,0.2);cursor:pointer;font-family:inherit;transition:all 0.2s ease;">
            <i class="fas fa-plus"></i> Add Tier
          </button>
        </div>

        <!-- Tiers Table -->
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-card);">
                <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Tier</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Discount %</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Payment Terms</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Free Shipping</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Min Order</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pricingTiers.map(t => {
                const tierColors = {
                  'Platinum': { bg: 'rgba(168,85,247,0.12)', text: '#a855f7' },
                  'Gold': { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
                  'Silver': { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af' }
                };
                const tc = tierColors[t.name] || { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' };
                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03);" data-tier-id="${t.id}">
                    <td style="padding:14px;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${tc.bg};color:${tc.text};">
                          <i class="fas fa-crown" style="font-size:10px;"></i> ${esc(t.name)}
                        </span>
                      </div>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <div style="display:inline-flex;align-items:center;gap:4px;">
                        <input type="number" value="${t.discount}" min="0" max="50" data-tier-field="discount" data-tier-id="${t.id}"
                          style="width:60px;height:32px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:8px;padding:0 8px;color:var(--text-primary);font-size:13px;font-family:inherit;text-align:center;outline:none;">
                        <span style="font-size:13px;color:var(--text-muted);">%</span>
                      </div>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <select data-tier-field="terms" data-tier-id="${t.id}"
                        style="height:32px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:8px;padding:0 10px;color:var(--text-primary);font-size:12px;font-family:inherit;outline:none;cursor:pointer;">
                        <option value="Net 15" ${t.terms === 'Net 15' ? 'selected' : ''} style="background:#111827;">Net 15</option>
                        <option value="Net 30" ${t.terms === 'Net 30' ? 'selected' : ''} style="background:#111827;">Net 30</option>
                        <option value="Net 45" ${t.terms === 'Net 45' ? 'selected' : ''} style="background:#111827;">Net 45</option>
                        <option value="Net 60" ${t.terms === 'Net 60' ? 'selected' : ''} style="background:#111827;">Net 60</option>
                        <option value="Prepaid" ${t.terms === 'Prepaid' ? 'selected' : ''} style="background:#111827;">Prepaid</option>
                      </select>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <div style="display:inline-flex;align-items:center;gap:4px;">
                        <span style="font-size:13px;color:var(--text-muted);">$</span>
                        <input type="number" value="${t.freeShipping}" min="0" data-tier-field="freeShipping" data-tier-id="${t.id}"
                          style="width:70px;height:32px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:8px;padding:0 8px;color:var(--text-primary);font-size:13px;font-family:inherit;text-align:center;outline:none;">
                      </div>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <div style="display:inline-flex;align-items:center;gap:4px;">
                        <span style="font-size:13px;color:var(--text-muted);">$</span>
                        <input type="number" value="${t.minOrder}" min="0" data-tier-field="minOrder" data-tier-id="${t.id}"
                          style="width:70px;height:32px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:8px;padding:0 8px;color:var(--text-primary);font-size:13px;font-family:inherit;text-align:center;outline:none;">
                      </div>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <button data-edit-tier="${t.id}" title="Edit tier"
                        style="width:30px;height:30px;border-radius:8px;border:none;background:rgba(255,255,255,0.04);color:var(--text-muted);cursor:pointer;font-size:12px;transition:all 0.2s;">
                        <i class="fas fa-pen"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Tier Summary Cards -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px;">
          ${pricingTiers.map(t => {
            const count = CUSTOMERS().filter(c => (c.tier || '').toLowerCase() === t.name.toLowerCase()).length;
            return `
              <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:14px;">
                <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:4px;">${esc(t.name)} Customers</div>
                <div style="font-size:22px;font-weight:800;color:var(--text-primary);">${count}</div>
                <div style="font-size:11px;color:var(--text-muted);">${t.discount}% discount &middot; ${t.terms}</div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Save -->
        <div style="display:flex;justify-content:flex-end;margin-top:20px;">
          <button id="saveTiersBtn"
            style="display:flex;align-items:center;gap:8px;padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#0b85f3,#36a5ff);color:white;font-size:13px;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all 0.2s ease;box-shadow:0 4px 16px rgba(11,133,243,0.3);">
            <i class="fas fa-save"></i> Save Tiers
          </button>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────
     SECTION: NOTIFICATION PREFERENCES
  ──────────────────────────────────────────── */
  function renderNotificationPrefs() {
    const toggles = [
      { key: 'orderReceived', label: 'Order Received', desc: 'Get notified when a new order is placed', icon: 'fa-shopping-cart', color: '#3b82f6' },
      { key: 'orderShipped', label: 'Order Shipped', desc: 'Notification when an order ships out', icon: 'fa-truck', color: '#a855f7' },
      { key: 'lowStock', label: 'Low Stock Alert', desc: 'Warning when inventory drops below threshold', icon: 'fa-triangle-exclamation', color: '#ef4444' },
      { key: 'reorderPrediction', label: 'Reorder Prediction', desc: 'AI-predicted customer reorder alerts', icon: 'fa-brain', color: '#f59e0b' },
      { key: 'newCustomer', label: 'New Customer Application', desc: 'Notify when a new customer applies', icon: 'fa-user-plus', color: '#22c55e' },
      { key: 'paymentReceived', label: 'Payment Received', desc: 'Confirmation when payment is received', icon: 'fa-credit-card', color: '#10b981' }
    ];

    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;margin-bottom:16px;">
        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Notification Preferences</h3>
          <p style="font-size:12px;color:var(--text-muted);">Choose which events trigger notifications</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:4px;">
          ${toggles.map(t => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.03);transition:all 0.2s;">
              <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${t.color}15;color:${t.color};font-size:15px;">
                  <i class="fas ${t.icon}"></i>
                </div>
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${t.label}</div>
                  <div style="font-size:11px;color:var(--text-muted);">${t.desc}</div>
                </div>
              </div>
              <label style="position:relative;width:44px;height:24px;cursor:pointer;">
                <input type="checkbox" data-notif-toggle="${t.key}" ${notifPrefs[t.key] ? 'checked' : ''}
                  style="opacity:0;width:0;height:0;position:absolute;">
                <span style="position:absolute;top:0;left:0;right:0;bottom:0;border-radius:12px;transition:all 0.3s ease;
                  background:${notifPrefs[t.key] ? '#0b85f3' : 'rgba(255,255,255,0.1)'};"></span>
                <span style="position:absolute;top:2px;left:${notifPrefs[t.key] ? '22px' : '2px'};width:20px;height:20px;border-radius:50%;background:white;transition:all 0.3s ease;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
              </label>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Email Recipients -->
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div>
            <h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Email Recipients</h3>
            <p style="font-size:12px;color:var(--text-muted);">Who receives notification emails</p>
          </div>
          <button id="addEmailBtn"
            style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:8px;background:rgba(11,133,243,0.12);color:#36a5ff;font-size:12px;font-weight:600;border:1px solid rgba(11,133,243,0.2);cursor:pointer;font-family:inherit;">
            <i class="fas fa-plus"></i> Add Email
          </button>
        </div>

        <div id="emailRecipientsList" style="display:flex;flex-direction:column;gap:6px;">
          ${emailRecipients.map((email, i) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-radius:10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);">
              <div style="display:flex;align-items:center;gap:10px;">
                <i class="fas fa-envelope" style="font-size:13px;color:var(--text-muted);"></i>
                <span style="font-size:13px;color:var(--text-primary);">${esc(email)}</span>
              </div>
              <button data-remove-email="${i}" title="Remove"
                style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(239,68,68,0.1);color:#ef4444;cursor:pointer;font-size:11px;transition:all 0.2s;">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- SMS Toggle -->
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:20px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(16,185,129,0.12);color:#10b981;font-size:15px;">
              <i class="fas fa-mobile-alt"></i>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:13px;font-weight:600;color:var(--text-primary);">SMS Notifications</span>
                <span style="padding:2px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;background:rgba(245,158,11,0.12);color:#f59e0b;">Coming Soon</span>
              </div>
              <div style="font-size:11px;color:var(--text-muted);">Receive critical alerts via text message</div>
            </div>
          </div>
          <label style="position:relative;width:44px;height:24px;cursor:not-allowed;opacity:0.5;">
            <input type="checkbox" disabled style="opacity:0;width:0;height:0;position:absolute;">
            <span style="position:absolute;top:0;left:0;right:0;bottom:0;border-radius:12px;background:rgba(255,255,255,0.1);"></span>
            <span style="position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
          </label>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────
     SECTION: INTEGRATIONS
  ──────────────────────────────────────────── */
  function renderIntegrations() {
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;">
        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Integrations</h3>
          <p style="font-size:12px;color:var(--text-muted);">Connected services and API status</p>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          ${integrations.map(intg => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);transition:all 0.2s;">
              <div style="display:flex;align-items:center;gap:16px;">
                <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);color:var(--text-secondary);font-size:18px;">
                  <i class="fas ${intg.icon}"></i>
                </div>
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--text-primary);">${esc(intg.name)}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
                    Last sync: ${esc(intg.lastSync)}
                  </div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(34,197,94,0.1);color:#22c55e;">
                  <span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;"></span>
                  Connected
                </span>
                <button data-sync-intg="${intg.id}" title="Sync Now"
                  style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:8px;background:rgba(255,255,255,0.04);color:var(--text-secondary);font-size:12px;font-weight:500;border:1px solid var(--border-card);cursor:pointer;font-family:inherit;transition:all 0.2s;">
                  <i class="fas fa-sync-alt" style="font-size:11px;"></i> Sync Now
                </button>
                <button data-config-intg="${intg.id}" title="Configure"
                  style="width:32px;height:32px;border-radius:8px;border:1px solid var(--border-card);background:rgba(255,255,255,0.04);color:var(--text-muted);cursor:pointer;font-size:12px;transition:all 0.2s;">
                  <i class="fas fa-cog"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────
     SECTION: USER MANAGEMENT
  ──────────────────────────────────────────── */
  function renderUserManagement() {
    const roleColors = {
      'Admin': { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
      'Picker': { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
      'Sales': { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
      'Support': { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' }
    };

    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">User Management</h3>
            <p style="font-size:12px;color:var(--text-muted);">Manage team access and permissions</p>
          </div>
          <button id="inviteUserBtn"
            style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;background:linear-gradient(135deg,#0b85f3,#36a5ff);color:white;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all 0.2s ease;box-shadow:0 4px 12px rgba(11,133,243,0.25);">
            <i class="fas fa-user-plus"></i> Invite User
          </button>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-card);">
                <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">User</th>
                <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Email</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Role</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Last Login</th>
                <th style="text-align:center;padding:10px 14px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => {
                const rc = roleColors[u.role] || { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8' };
                const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                    <td style="padding:14px;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0;">
                          ${initials}
                        </div>
                        <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${esc(u.name)}</span>
                      </div>
                    </td>
                    <td style="padding:14px;">
                      <span style="font-size:12px;color:var(--text-secondary);">${esc(u.email)}</span>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <span style="padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;background:${rc.bg};color:${rc.text};">${esc(u.role)}</span>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <span style="font-size:12px;color:var(--text-muted);">${esc(u.lastLogin)}</span>
                    </td>
                    <td style="text-align:center;padding:14px;">
                      <label style="position:relative;width:40px;height:22px;cursor:pointer;display:inline-block;">
                        <input type="checkbox" data-user-active="${u.id}" ${u.active ? 'checked' : ''}
                          style="opacity:0;width:0;height:0;position:absolute;">
                        <span style="position:absolute;top:0;left:0;right:0;bottom:0;border-radius:11px;transition:all 0.3s ease;
                          background:${u.active ? '#22c55e' : 'rgba(255,255,255,0.1)'};"></span>
                        <span style="position:absolute;top:2px;left:${u.active ? '20px' : '2px'};width:18px;height:18px;border-radius:50%;background:white;transition:all 0.3s ease;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
                      </label>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────
     SECTION: SHIPPING CONFIGURATION
  ──────────────────────────────────────────── */
  function renderShippingConfig() {
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;margin-bottom:16px;">
        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Shipping Configuration</h3>
          <p style="font-size:12px;color:var(--text-muted);">Default shipping settings and carrier preferences</p>
        </div>

        <!-- Default Carrier -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Default Carrier</div>
          <div style="display:flex;gap:12px;">
            <label style="flex:1;display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:12px;cursor:pointer;transition:all 0.2s;
              border:1px solid ${shippingConfig.defaultCarrier === 'ups' ? 'rgba(11,133,243,0.4)' : 'var(--border-card)'};
              background:${shippingConfig.defaultCarrier === 'ups' ? 'rgba(11,133,243,0.08)' : 'rgba(255,255,255,0.02)'};">
              <input type="radio" name="defaultCarrier" value="ups" ${shippingConfig.defaultCarrier === 'ups' ? 'checked' : ''}
                style="width:16px;height:16px;accent-color:#0b85f3;">
              <div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);">UPS</div>
                <div style="font-size:11px;color:var(--text-muted);">United Parcel Service</div>
              </div>
            </label>
            <label style="flex:1;display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:12px;cursor:pointer;transition:all 0.2s;
              border:1px solid ${shippingConfig.defaultCarrier === 'fedex' ? 'rgba(11,133,243,0.4)' : 'var(--border-card)'};
              background:${shippingConfig.defaultCarrier === 'fedex' ? 'rgba(11,133,243,0.08)' : 'rgba(255,255,255,0.02)'};">
              <input type="radio" name="defaultCarrier" value="fedex" ${shippingConfig.defaultCarrier === 'fedex' ? 'checked' : ''}
                style="width:16px;height:16px;accent-color:#0b85f3;">
              <div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);">FedEx</div>
                <div style="font-size:11px;color:var(--text-muted);">Federal Express</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Warehouse Address -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Warehouse Address</div>
          <input type="text" id="warehouseAddr" value="${esc(shippingConfig.warehouseAddress)}"
            style="width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:10px;padding:0 14px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;">
        </div>

        <!-- Cutoff Time & Markup -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Same-Day Shipping Cutoff</div>
            <input type="time" id="cutoffTime" value="${shippingConfig.cutoffTime}"
              style="width:100%;height:40px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:10px;padding:0 14px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s;">
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Rate Markup %</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <input type="number" id="rateMarkup" value="${shippingConfig.rateMarkup}" min="0" max="50"
                style="width:80px;height:40px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);border-radius:10px;padding:0 14px;color:var(--text-primary);font-size:14px;font-family:inherit;outline:none;text-align:center;">
              <span style="font-size:14px;color:var(--text-muted);">%</span>
            </div>
          </div>
        </div>

        <!-- Shipping Methods -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Available Shipping Methods</div>
          <div style="display:flex;gap:12px;">
            ${[
              { key: 'ground', label: 'Ground', icon: 'fa-truck', desc: '5-7 business days' },
              { key: 'express', label: 'Express', icon: 'fa-bolt', desc: '2-3 business days' },
              { key: 'freight', label: 'Freight', icon: 'fa-dolly', desc: 'LTL/Pallet shipments' }
            ].map(m => `
              <label style="flex:1;display:flex;align-items:center;gap:10px;padding:14px 16px;border-radius:12px;cursor:pointer;transition:all 0.2s;
                border:1px solid ${shippingConfig.methods[m.key] ? 'rgba(34,197,94,0.3)' : 'var(--border-card)'};
                background:${shippingConfig.methods[m.key] ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)'};">
                <input type="checkbox" data-ship-method="${m.key}" ${shippingConfig.methods[m.key] ? 'checked' : ''}
                  style="width:16px;height:16px;accent-color:#22c55e;flex-shrink:0;">
                <div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <i class="fas ${m.icon}" style="font-size:12px;color:${shippingConfig.methods[m.key] ? '#22c55e' : 'var(--text-muted)'};"></i>
                    <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${m.label}</span>
                  </div>
                  <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${m.desc}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Save -->
        <div style="display:flex;justify-content:flex-end;">
          <button id="saveShippingBtn"
            style="display:flex;align-items:center;gap:8px;padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#0b85f3,#36a5ff);color:white;font-size:13px;font-weight:600;border:none;cursor:pointer;font-family:inherit;transition:all 0.2s ease;box-shadow:0 4px 16px rgba(11,133,243,0.3);">
            <i class="fas fa-save"></i> Save Shipping
          </button>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────
     SECTION: DATA & EXPORT
  ──────────────────────────────────────────── */
  function renderDataExport() {
    return `
      <div style="background:var(--bg-card);border:1px solid var(--border-card);border-radius:16px;padding:24px;margin-bottom:16px;">
        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">Data & Export</h3>
          <p style="font-size:12px;color:var(--text-muted);">Export data as CSV or create database backups</p>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
          <button data-export="products"
            style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.2s;text-align:left;font-family:inherit;">
            <div style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,0.12);color:#3b82f6;font-size:16px;flex-shrink:0;">
              <i class="fas fa-tag"></i>
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">Export All Products</div>
              <div style="font-size:11px;color:var(--text-muted);">${PRODUCTS().length} products &middot; CSV format</div>
            </div>
            <i class="fas fa-download" style="margin-left:auto;color:var(--text-muted);font-size:14px;"></i>
          </button>

          <button data-export="customers"
            style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.2s;text-align:left;font-family:inherit;">
            <div style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(34,197,94,0.12);color:#22c55e;font-size:16px;flex-shrink:0;">
              <i class="fas fa-users"></i>
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">Export All Customers</div>
              <div style="font-size:11px;color:var(--text-muted);">${CUSTOMERS().length} customers &middot; CSV format</div>
            </div>
            <i class="fas fa-download" style="margin-left:auto;color:var(--text-muted);font-size:14px;"></i>
          </button>

          <button data-export="orders"
            style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.2s;text-align:left;font-family:inherit;">
            <div style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(245,158,11,0.12);color:#f59e0b;font-size:16px;flex-shrink:0;">
              <i class="fas fa-receipt"></i>
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">Export All Orders</div>
              <div style="font-size:11px;color:var(--text-muted);">${ORDERS().length} orders &middot; CSV format</div>
            </div>
            <i class="fas fa-download" style="margin-left:auto;color:var(--text-muted);font-size:14px;"></i>
          </button>

          <button id="backupDbBtn"
            style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-radius:14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:all 0.2s;text-align:left;font-family:inherit;">
            <div style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(168,85,247,0.12);color:#a855f7;font-size:16px;flex-shrink:0;">
              <i class="fas fa-hard-drive"></i>
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary);">Backup Database</div>
              <div style="font-size:11px;color:var(--text-muted);">Full system backup</div>
            </div>
            <i class="fas fa-shield-halved" style="margin-left:auto;color:var(--text-muted);font-size:14px;"></i>
          </button>
        </div>

        <!-- Last Backup Info -->
        <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.1);">
          <i class="fas fa-check-circle" style="color:#22c55e;font-size:14px;"></i>
          <span style="font-size:12px;color:var(--text-secondary);">Last backup: <strong style="color:var(--text-primary);">${esc(lastBackup)}</strong></span>
        </div>
      </div>
    `;
  }

  /* ────────────────────────────────────────────
     WIRE SETTINGS EVENTS
  ──────────────────────────────────────────── */
  function wireSettingsEvents() {
    const container = document.getElementById('view-settings');
    if (!container) return;

    // Nav section switching
    container.querySelectorAll('.settings-nav-item').forEach(el => {
      el.addEventListener('click', function () {
        settingsSection = this.dataset.section;
        renderSettings();
      });
    });

    // Company save
    const saveCompanyBtn = document.getElementById('saveCompanyBtn');
    if (saveCompanyBtn) {
      saveCompanyBtn.addEventListener('click', function () {
        companyProfile.name = (document.getElementById('companyName') || {}).value || companyProfile.name;
        companyProfile.address = (document.getElementById('companyAddress') || {}).value || companyProfile.address;
        companyProfile.phone = (document.getElementById('companyPhone') || {}).value || companyProfile.phone;
        companyProfile.email = (document.getElementById('companyEmail') || {}).value || companyProfile.email;
        window.showToast('Company profile saved successfully', 'success');
      });
    }

    // Logo upload hover
    const logoArea = document.getElementById('logoUploadArea');
    if (logoArea) {
      logoArea.addEventListener('mouseenter', function () {
        this.style.borderColor = 'rgba(11,133,243,0.4)';
        this.style.background = 'rgba(11,133,243,0.04)';
      });
      logoArea.addEventListener('mouseleave', function () {
        this.style.borderColor = 'rgba(255,255,255,0.1)';
        this.style.background = 'rgba(255,255,255,0.02)';
      });
      logoArea.addEventListener('click', function () {
        window.showToast('Logo upload — feature coming soon', 'info');
      });
    }

    // Pricing tier field changes
    container.querySelectorAll('[data-tier-field]').forEach(el => {
      el.addEventListener('change', function () {
        const id = parseInt(this.dataset.tierId);
        const field = this.dataset.tierField;
        const tier = pricingTiers.find(t => t.id === id);
        if (tier) {
          if (field === 'discount' || field === 'freeShipping' || field === 'minOrder') {
            tier[field] = parseFloat(this.value) || 0;
          } else {
            tier[field] = this.value;
          }
        }
      });
    });

    // Add tier
    const addTierBtn = document.getElementById('addTierBtn');
    if (addTierBtn) {
      addTierBtn.addEventListener('click', function () {
        const newId = Math.max(...pricingTiers.map(t => t.id)) + 1;
        pricingTiers.push({ id: newId, name: 'Bronze', discount: 5, terms: 'Net 15', freeShipping: 1500, minOrder: 100 });
        window.showToast('New pricing tier added', 'success');
        renderSettings();
      });
    }

    // Save tiers
    const saveTiersBtn = document.getElementById('saveTiersBtn');
    if (saveTiersBtn) {
      saveTiersBtn.addEventListener('click', function () {
        window.showToast('Pricing tiers saved successfully', 'success');
      });
    }

    // Notification toggles
    container.querySelectorAll('[data-notif-toggle]').forEach(el => {
      el.addEventListener('change', function () {
        const key = this.dataset.notifToggle;
        notifPrefs[key] = this.checked;
        renderSettings();
        window.showToast('Notification preference updated', 'info');
      });
    });

    // Add email
    const addEmailBtn = document.getElementById('addEmailBtn');
    if (addEmailBtn) {
      addEmailBtn.addEventListener('click', function () {
        const email = prompt('Enter email address:');
        if (email && email.includes('@')) {
          emailRecipients.push(email.trim());
          renderSettings();
          window.showToast('Email recipient added', 'success');
        } else if (email) {
          window.showToast('Invalid email address', 'error');
        }
      });
    }

    // Remove email
    container.querySelectorAll('[data-remove-email]').forEach(el => {
      el.addEventListener('click', function () {
        const idx = parseInt(this.dataset.removeEmail);
        const removed = emailRecipients.splice(idx, 1);
        renderSettings();
        window.showToast('Removed ' + removed[0], 'warning');
      });
    });

    // Integration sync
    container.querySelectorAll('[data-sync-intg]').forEach(el => {
      el.addEventListener('click', function () {
        const id = this.dataset.syncIntg;
        const intg = integrations.find(i => i.id === id);
        const icon = this.querySelector('i');
        if (icon) {
          icon.classList.add('fa-spin');
        }
        this.style.opacity = '0.6';
        this.style.pointerEvents = 'none';
        setTimeout(() => {
          if (intg) {
            const now = new Date();
            intg.lastSync = now.getFullYear() + '-' +
              String(now.getMonth() + 1).padStart(2, '0') + '-' +
              String(now.getDate()).padStart(2, '0') + ' ' +
              String(now.getHours()).padStart(2, '0') + ':' +
              String(now.getMinutes()).padStart(2, '0');
          }
          window.showToast((intg ? intg.name : 'Integration') + ' synced successfully', 'success');
          renderSettings();
        }, 1500);
      });
    });

    // Integration configure
    container.querySelectorAll('[data-config-intg]').forEach(el => {
      el.addEventListener('click', function () {
        const id = this.dataset.configIntg;
        const intg = integrations.find(i => i.id === id);
        window.showToast((intg ? intg.name : 'Integration') + ' configuration — coming soon', 'info');
      });
    });

    // Invite user
    const inviteUserBtn = document.getElementById('inviteUserBtn');
    if (inviteUserBtn) {
      inviteUserBtn.addEventListener('click', function () {
        const name = prompt('User name:');
        if (!name) return;
        const email = prompt('Email address:');
        if (!email) return;
        const role = prompt('Role (Admin, Sales, Picker, Support):') || 'Sales';
        const newId = Math.max(...users.map(u => u.id)) + 1;
        users.push({ id: newId, name: name, email: email, role: role, lastLogin: 'Never', active: true });
        window.showToast('Invitation sent to ' + name, 'success');
        renderSettings();
      });
    }

    // User active toggle
    container.querySelectorAll('[data-user-active]').forEach(el => {
      el.addEventListener('change', function () {
        const uid = parseInt(this.dataset.userActive);
        const user = users.find(u => u.id === uid);
        if (user) {
          user.active = this.checked;
          window.showToast(user.name + ' ' + (user.active ? 'activated' : 'deactivated'), user.active ? 'success' : 'warning');
          renderSettings();
        }
      });
    });

    // Shipping carrier radio
    container.querySelectorAll('input[name="defaultCarrier"]').forEach(el => {
      el.addEventListener('change', function () {
        shippingConfig.defaultCarrier = this.value;
        renderSettings();
      });
    });

    // Shipping methods
    container.querySelectorAll('[data-ship-method]').forEach(el => {
      el.addEventListener('change', function () {
        shippingConfig.methods[this.dataset.shipMethod] = this.checked;
        renderSettings();
      });
    });

    // Save shipping
    const saveShippingBtn = document.getElementById('saveShippingBtn');
    if (saveShippingBtn) {
      saveShippingBtn.addEventListener('click', function () {
        shippingConfig.warehouseAddress = (document.getElementById('warehouseAddr') || {}).value || shippingConfig.warehouseAddress;
        shippingConfig.cutoffTime = (document.getElementById('cutoffTime') || {}).value || shippingConfig.cutoffTime;
        shippingConfig.rateMarkup = parseFloat((document.getElementById('rateMarkup') || {}).value) || 0;
        window.showToast('Shipping configuration saved', 'success');
      });
    }

    // Export buttons
    container.querySelectorAll('[data-export]').forEach(el => {
      el.addEventListener('click', function () {
        const type = this.dataset.export;
        exportCSV(type);
      });
    });

    // Backup
    const backupDbBtn = document.getElementById('backupDbBtn');
    if (backupDbBtn) {
      backupDbBtn.addEventListener('click', function () {
        window.showToast('Creating database backup...', 'info', 2000);
        setTimeout(() => {
          const now = new Date();
          lastBackup = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
            now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          window.showToast('Backup completed successfully', 'success');
          renderSettings();
        }, 2500);
      });
    }

    // Input focus styles
    container.querySelectorAll('input[type="text"], input[type="number"], input[type="time"]').forEach(el => {
      el.addEventListener('focus', function () {
        this.style.borderColor = 'rgba(11,133,243,0.4)';
        this.style.boxShadow = '0 0 0 3px rgba(11,133,243,0.08)';
      });
      el.addEventListener('blur', function () {
        this.style.borderColor = 'var(--border-card)';
        this.style.boxShadow = 'none';
      });
    });

    // Export button hover
    container.querySelectorAll('[data-export], #backupDbBtn').forEach(el => {
      el.addEventListener('mouseenter', function () {
        this.style.borderColor = 'rgba(255,255,255,0.12)';
        this.style.background = 'rgba(255,255,255,0.04)';
      });
      el.addEventListener('mouseleave', function () {
        this.style.borderColor = 'rgba(255,255,255,0.06)';
        this.style.background = 'rgba(255,255,255,0.02)';
      });
    });
  }

  /* ────────────────────────────────────────────
     CSV EXPORT
  ──────────────────────────────────────────── */
  function exportCSV(type) {
    let csv = '';
    let filename = '';

    if (type === 'products') {
      const prods = PRODUCTS();
      csv = 'SKU,Name,Category,Sub-Category,Colors,Price,Stock\n';
      prods.forEach(p => {
        csv += `"${p.sku}","${p.name}","${p.category}","${p.sub}",${p.colors},${p.price},${p.stock}\n`;
      });
      filename = 'usapparel-products-' + new Date().toISOString().slice(0, 10) + '.csv';
    } else if (type === 'customers') {
      const custs = CUSTOMERS();
      csv = 'ID,Name,Tier,Location,Orders,LTV,Last Order,Contact,Email,Phone\n';
      custs.forEach(c => {
        csv += `${c.id},"${c.name}","${c.tier}","${c.location}",${c.orders},${c.ltv},"${c.lastOrder}","${c.contact}","${c.email}","${c.phone}"\n`;
      });
      filename = 'usapparel-customers-' + new Date().toISOString().slice(0, 10) + '.csv';
    } else if (type === 'orders') {
      const ords = ORDERS();
      csv = 'Order ID,Customer ID,Total,Status,Date,Ship Method,Tracking\n';
      ords.forEach(o => {
        csv += `"${o.id}",${o.customerId},${o.total},"${o.status}","${o.date}","${o.shipMethod || ''}","${o.tracking || ''}"\n`;
      });
      filename = 'usapparel-orders-' + new Date().toISOString().slice(0, 10) + '.csv';
    }

    if (csv) {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      window.showToast('Exported ' + type + ' as CSV', 'success');
    }
  }

  /* ════════════════════════════════════════════
     NOTIFICATION CENTER DROPDOWN
  ════════════════════════════════════════════ */
  function initNotificationCenter() {
    // Create notification dropdown panel
    const panel = document.createElement('div');
    panel.id = 'notifPanel';
    panel.style.cssText = `
      position: fixed;
      top: 56px;
      right: 80px;
      width: 400px;
      max-height: 520px;
      background: #111827;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02);
      z-index: 300;
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: notifSlideIn 0.2s ease;
    `;
    document.body.appendChild(panel);

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes notifSlideIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes toastSlideUp {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes toastSlideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
      }
      @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0%; }
      }
      @keyframes shortcutFadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }
      #notifPanel .notif-item:hover {
        background: rgba(255,255,255,0.04) !important;
      }
      .toast-item:hover {
        transform: translateX(-4px) !important;
      }
      .settings-nav-item:hover {
        background: rgba(255,255,255,0.04);
        color: var(--text-secondary) !important;
      }
    `;
    document.head.appendChild(style);

    // Override the existing notifBtn handler
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
      // Remove existing listeners by cloning
      const newBtn = notifBtn.cloneNode(true);
      notifBtn.parentNode.replaceChild(newBtn, notifBtn);

      newBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        notifPanelOpen = !notifPanelOpen;
        if (notifPanelOpen) {
          renderNotifPanel();
          panel.style.display = 'flex';
        } else {
          panel.style.display = 'none';
        }
      });
    }

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (notifPanelOpen && !panel.contains(e.target) && e.target.id !== 'notifBtn' && !e.target.closest('#notifBtn')) {
        notifPanelOpen = false;
        panel.style.display = 'none';
      }
    });
  }

  function renderNotifPanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;

    const unread = unreadCount();

    panel.innerHTML = `
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:8px;">
          <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);">Notifications</h3>
          ${unread > 0 ? `<span style="width:20px;height:20px;border-radius:50%;background:var(--danger);color:white;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;">${unread}</span>` : ''}
        </div>
        <button id="markAllReadBtn" style="background:none;border:none;color:#36a5ff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;padding:4px 8px;border-radius:6px;transition:background 0.2s;">
          Mark all read
        </button>
      </div>

      <!-- Notification List -->
      <div style="flex:1;overflow-y:auto;padding:8px;">
        ${notifications.map(n => {
          const nc = notifTypeColor(n.type);
          return `
            <div class="notif-item" data-notif-id="${n.id}" data-notif-view="${n.view}"
              style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;transition:background 0.15s;position:relative;margin-bottom:2px;">
              ${!n.read ? `<div style="position:absolute;top:14px;left:6px;width:6px;height:6px;border-radius:50%;background:#3b82f6;"></div>` : ''}
              <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${nc.bg};color:${nc.text};font-size:14px;flex-shrink:0;margin-left:${!n.read ? '8px' : '0'};">
                <i class="fas ${n.icon}"></i>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:${n.read ? '500' : '600'};color:${n.read ? 'var(--text-secondary)' : 'var(--text-primary)'};margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(n.title)}</div>
                <div style="font-size:12px;color:var(--text-muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(n.desc)}</div>
              </div>
              <div style="font-size:10px;color:var(--text-muted);white-space:nowrap;flex-shrink:0;margin-top:2px;">${esc(n.time)}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Footer -->
      <div style="padding:12px 20px;border-top:1px solid rgba(255,255,255,0.06);flex-shrink:0;">
        <button id="viewAllNotifsBtn" style="width:100%;padding:8px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border-card);color:var(--text-secondary);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.2s;">
          View All Notifications
        </button>
      </div>
    `;

    wireNotifPanelEvents();
    updateNotifBadge();
  }

  function wireNotifPanelEvents() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;

    // Mark all read
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        notifications.forEach(n => n.read = true);
        renderNotifPanel();
        window.showToast('All notifications marked as read', 'info');
      });
      markAllBtn.addEventListener('mouseenter', function () { this.style.background = 'rgba(54,165,255,0.1)'; });
      markAllBtn.addEventListener('mouseleave', function () { this.style.background = 'none'; });
    }

    // Notification items — click to navigate
    panel.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', function () {
        const id = parseInt(this.dataset.notifId);
        const view = this.dataset.notifView;
        const notif = notifications.find(n => n.id === id);
        if (notif) notif.read = true;
        notifPanelOpen = false;
        panel.style.display = 'none';
        updateNotifBadge();
        if (view && typeof window.showView === 'function') {
          window.showView(view);
        }
      });
    });

    // View all
    const viewAllBtn = document.getElementById('viewAllNotifsBtn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', function () {
        notifPanelOpen = false;
        panel.style.display = 'none';
        settingsSection = 'notifications';
        window.showView('settings');
        renderSettings();
      });
    }
  }

  function updateNotifBadge() {
    const badge = document.getElementById('notifCount');
    if (!badge) return;
    const count = unreadCount();
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ════════════════════════════════════════════
     TOAST NOTIFICATION SYSTEM
  ════════════════════════════════════════════ */
  let toastContainer = null;
  let toastIdCounter = 0;

  function initToastSystem() {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  window.showToast = function (message, type, duration) {
    type = type || 'success';
    duration = duration || 4000;

    if (!toastContainer) initToastSystem();

    const id = ++toastIdCounter;

    const typeConfig = {
      success: { icon: 'fa-check-circle', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', color: '#22c55e', barColor: '#22c55e' },
      error: { icon: 'fa-times-circle', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#ef4444', barColor: '#ef4444' },
      warning: { icon: 'fa-exclamation-triangle', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b', barColor: '#f59e0b' },
      info: { icon: 'fa-info-circle', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: '#3b82f6', barColor: '#3b82f6' }
    };

    const cfg = typeConfig[type] || typeConfig.info;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.dataset.toastId = id;
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      min-width: 320px;
      max-width: 420px;
      background: #111827;
      border: 1px solid ${cfg.border};
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      pointer-events: auto;
      animation: toastSlideUp 0.3s ease;
      position: relative;
      overflow: hidden;
      transition: transform 0.2s ease;
    `;

    toast.innerHTML = `
      <div style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${cfg.bg};color:${cfg.color};font-size:14px;flex-shrink:0;">
        <i class="fas ${cfg.icon}"></i>
      </div>
      <div style="flex:1;font-size:13px;font-weight:500;color:var(--text-primary);line-height:1.4;">${esc(message)}</div>
      <button data-close-toast="${id}" style="width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,255,255,0.06);color:var(--text-muted);cursor:pointer;font-size:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
        <i class="fas fa-times"></i>
      </button>
      <div style="position:absolute;bottom:0;left:0;height:3px;background:${cfg.barColor};border-radius:0 0 0 12px;animation:toastProgress ${duration}ms linear forwards;"></div>
    `;

    toastContainer.appendChild(toast);

    // Close button
    toast.querySelector(`[data-close-toast="${id}"]`).addEventListener('click', function () {
      dismissToast(toast);
    });

    // Auto dismiss
    const timer = setTimeout(() => {
      dismissToast(toast);
    }, duration);

    // Pause on hover
    toast.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      const bar = this.querySelector('div[style*="toastProgress"]');
      if (bar) bar.style.animationPlayState = 'paused';
    });

    toast.addEventListener('mouseleave', function () {
      const bar = this.querySelector('div[style*="toastProgress"]');
      if (bar) bar.style.animationPlayState = 'running';
      setTimeout(() => dismissToast(toast), 2000);
    });
  };

  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.animation = 'toastSlideOut 0.25s ease forwards';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }

  /* ════════════════════════════════════════════
     KEYBOARD SHORTCUTS
  ════════════════════════════════════════════ */
  let shortcutsModalOpen = false;

  function initKeyboardShortcuts() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? 'metaKey' : 'ctrlKey';
    const modLabel = isMac ? 'Cmd' : 'Ctrl';

    const viewMap = {
      '1': 'dashboard',
      '2': 'catalog',
      '3': 'orders',
      '4': 'inventory',
      '5': 'reorder',
      '6': 'customers',
      '7': 'portal',
      '8': 'settings'
    };

    document.addEventListener('keydown', function (e) {
      // Don't capture when typing in inputs
      const tag = (e.target.tagName || '').toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

      // Ctrl/Cmd + K => Focus search
      if (e[modKey] && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Ctrl/Cmd + 1-8 => Switch views
      if (e[modKey] && viewMap[e.key]) {
        e.preventDefault();
        const viewName = viewMap[e.key];
        if (typeof window.showView === 'function') {
          window.showView(viewName);
          if (viewName === 'settings') renderSettings();
        }
        return;
      }

      // Escape => Close modals/panels
      if (e.key === 'Escape') {
        let closed = false;

        // Close shortcuts modal
        if (shortcutsModalOpen) {
          closeShortcutsModal();
          closed = true;
        }

        // Close notification panel
        if (notifPanelOpen) {
          notifPanelOpen = false;
          const panel = document.getElementById('notifPanel');
          if (panel) panel.style.display = 'none';
          closed = true;
        }

        // Close search overlay
        const searchOverlay = document.getElementById('searchResults');
        if (searchOverlay && searchOverlay.classList.contains('visible')) {
          searchOverlay.classList.remove('visible');
          closed = true;
        }

        if (closed) {
          e.preventDefault();
          return;
        }
      }

      // ? => Show keyboard shortcuts
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        toggleShortcutsModal();
        return;
      }
    });
  }

  function toggleShortcutsModal() {
    if (shortcutsModalOpen) {
      closeShortcutsModal();
    } else {
      openShortcutsModal();
    }
  }

  function openShortcutsModal() {
    shortcutsModalOpen = true;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? '\u2318' : 'Ctrl';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'shortcutsOverlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: shortcutFadeIn 0.2s ease;
    `;

    const shortcuts = [
      { keys: [mod, 'K'], desc: 'Focus search bar' },
      { keys: [mod, '1'], desc: 'Dashboard' },
      { keys: [mod, '2'], desc: 'Product Catalog' },
      { keys: [mod, '3'], desc: 'Order Management' },
      { keys: [mod, '4'], desc: 'Inventory Tracker' },
      { keys: [mod, '5'], desc: 'AI Smart Reorder' },
      { keys: [mod, '6'], desc: 'Customer CRM' },
      { keys: [mod, '7'], desc: 'Customer Portal' },
      { keys: [mod, '8'], desc: 'Settings' },
      { keys: ['Esc'], desc: 'Close any open modal or panel' },
      { keys: ['?'], desc: 'Show this shortcuts help' }
    ];

    overlay.innerHTML = `
      <div style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px 32px;width:480px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:shortcutFadeIn 0.25s ease;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">Keyboard Shortcuts</h2>
            <p style="font-size:12px;color:var(--text-muted);">Navigate faster with keyboard shortcuts</p>
          </div>
          <button id="closeShortcutsBtn"
            style="width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,0.06);color:var(--text-muted);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="display:flex;flex-direction:column;gap:2px;">
          ${shortcuts.map(s => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:8px;transition:background 0.15s;">
              <span style="font-size:13px;color:var(--text-secondary);">${s.desc}</span>
              <div style="display:flex;gap:4px;">
                ${s.keys.map(k => `
                  <kbd style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:26px;padding:0 8px;border-radius:6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);font-size:11px;font-weight:600;color:var(--text-primary);font-family:inherit;box-shadow:0 2px 0 rgba(0,0,0,0.2);">${k}</kbd>
                `).join('<span style="color:var(--text-muted);font-size:11px;display:flex;align-items:center;">+</span>')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close on click outside
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeShortcutsModal();
    });

    // Close button
    document.getElementById('closeShortcutsBtn').addEventListener('click', closeShortcutsModal);
  }

  function closeShortcutsModal() {
    shortcutsModalOpen = false;
    const overlay = document.getElementById('shortcutsOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.15s ease';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 150);
    }
  }

  /* ════════════════════════════════════════════
     OBSERVE SETTINGS VIEW ACTIVATION
  ════════════════════════════════════════════ */
  function observeSettingsView() {
    // Re-render settings whenever the settings view becomes active
    const originalShowView = window.showView;
    window.showView = function (viewName) {
      originalShowView(viewName);
      if (viewName === 'settings') {
        renderSettings();
      }
    };
  }

  /* ════════════════════════════════════════════
     INITIALIZATION
  ════════════════════════════════════════════ */
  function init() {
    // Toast system first (other modules depend on it)
    initToastSystem();

    // Render settings view
    renderSettings();

    // Notification center dropdown
    initNotificationCenter();
    updateNotifBadge();

    // Keyboard shortcuts
    initKeyboardShortcuts();

    // Re-render settings when navigated to
    observeSettingsView();
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
