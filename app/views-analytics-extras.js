/**
 * US Apparel LLC — Analytics Deep Dive, Live Dashboard, Search Enhancements,
 * Breadcrumbs, Loading States, Empty States, Export, Print, Onboarding Tour
 * Loaded by index.html after the main script block and other view JS files.
 */
(function () {
  'use strict';

  const PRODUCTS = () => (window.APP_DATA || {}).PRODUCTS || [];
  const CUSTOMERS = () => (window.APP_DATA || {}).CUSTOMERS || [];
  const ORDERS = () => (window.APP_DATA || {}).ORDERS || [];

  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  function fmtDec(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtNum(n) {
    return Number(n).toLocaleString('en-US');
  }
  function pct(n) {
    return Number(n).toFixed(1) + '%';
  }
  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ================================================================
     INJECT STYLES
     ================================================================ */
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `

/* ── Analytics Deep Dive ── */
.analytics-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
.analytics-header h2 {
  font-size: 22px; font-weight: 800; color: var(--text-primary);
}
.analytics-tabs {
  display: flex; gap: 4px;
}
.analytics-tab {
  padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 600;
  background: transparent; color: var(--text-muted); border: 1px solid var(--border-card);
  cursor: pointer; transition: all 0.2s ease; font-family: inherit;
}
.analytics-tab.active {
  background: var(--primary-glow); color: var(--primary-light);
  border-color: rgba(11,133,243,0.3);
}
.analytics-tab:hover:not(.active) {
  color: var(--text-secondary); border-color: var(--border-card-hover);
}
.analytics-panel { display: none; }
.analytics-panel.active { display: block; }
.analytics-grid-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
}
.analytics-grid-3 {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;
}
@media (max-width: 1100px) {
  .analytics-grid-2, .analytics-grid-3 { grid-template-columns: 1fr; }
}
.analytics-card {
  background: var(--bg-card); backdrop-filter: blur(20px);
  border: 1px solid var(--border-card); border-radius: 16px; padding: 20px;
}
.analytics-card h4 {
  font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}
.analytics-card h4 i { color: var(--primary-light); font-size: 14px; }
.analytics-chart-wrap { position: relative; width: 100%; height: 260px; }
.analytics-chart-wrap.tall { height: 320px; }
.analytics-chart-wrap.short { height: 200px; }
.analytics-list { max-height: 280px; overflow-y: auto; }
.analytics-list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
}
.analytics-list-item:last-child { border-bottom: none; }
.analytics-rank {
  width: 22px; height: 22px; border-radius: 6px; display: flex;
  align-items: center; justify-content: center; font-size: 10px;
  font-weight: 700; background: rgba(255,255,255,0.05); color: var(--text-muted);
  flex-shrink: 0;
}
.analytics-rank.gold { background: linear-gradient(135deg,#f59e0b,#d97706); color: #1a1a1a; }
.analytics-rank.silver { background: linear-gradient(135deg,#94a3b8,#64748b); color: #1a1a1a; }
.analytics-rank.bronze { background: linear-gradient(135deg,#cd7c2f,#a05a2c); color: #1a1a1a; }
.analytics-item-info { flex: 1; min-width: 0; }
.analytics-item-name {
  font-size: 12px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.analytics-item-sub { font-size: 10px; color: var(--text-muted); }
.analytics-item-value {
  font-size: 12px; font-weight: 700; color: var(--text-primary); white-space: nowrap;
}
.analytics-item-bar {
  width: 60px; height: 4px; background: rgba(255,255,255,0.05);
  border-radius: 2px; overflow: hidden; flex-shrink: 0;
}
.analytics-item-bar-fill {
  height: 100%; border-radius: 2px;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
}

/* Gauge Chart */
.gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 0; }
.gauge-svg { width: 160px; height: 90px; }
.gauge-label { font-size: 28px; font-weight: 800; color: var(--success); }
.gauge-sub { font-size: 11px; color: var(--text-muted); }

/* Churn risk */
.churn-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
}
.churn-item:last-child { border-bottom: none; }
.churn-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.churn-dot.high { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
.churn-dot.medium { background: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.5); }
.churn-info { flex: 1; }
.churn-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.churn-detail { font-size: 10px; color: var(--text-muted); }
.churn-days { font-size: 12px; font-weight: 700; color: var(--danger); white-space: nowrap; }

/* Slow movers badge */
.slow-badge {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-size: 10px; font-weight: 600;
  background: rgba(239,68,68,0.12); color: #ef4444;
}

/* ── Dashboard open-analytics button ── */
.open-analytics-btn {
  padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 600;
  background: var(--primary-glow); color: var(--primary-light);
  border: 1px solid rgba(11,133,243,0.3); cursor: pointer; transition: all 0.2s ease;
  font-family: inherit;
}
.open-analytics-btn:hover { background: rgba(11,133,243,0.25); }

/* ── Live Clock ── */
#liveClockDisplay {
  font-size: 12px; color: var(--text-muted); font-weight: 500;
  white-space: nowrap; font-variant-numeric: tabular-nums;
}

/* ── Value Pulse animation ── */
@keyframes valuePulse {
  0% { box-shadow: 0 0 0 0 rgba(11,133,243,0.4); }
  70% { box-shadow: 0 0 0 8px rgba(11,133,243,0); }
  100% { box-shadow: 0 0 0 0 rgba(11,133,243,0); }
}
.value-pulse { animation: valuePulse 0.8s ease-out; }

/* ── Command Palette ── */
.cmd-palette-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  z-index: 9999; display: none; align-items: flex-start; justify-content: center;
  padding-top: 12vh;
}
.cmd-palette-overlay.visible { display: flex; }
.cmd-palette {
  width: 580px; max-height: 520px; background: #111827;
  border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6); overflow: hidden;
  display: flex; flex-direction: column;
}
.cmd-palette-input-wrap {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.cmd-palette-input-wrap i { color: var(--text-muted); font-size: 16px; }
.cmd-palette-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: var(--text-primary); font-size: 16px; font-family: inherit;
}
.cmd-palette-input::placeholder { color: var(--text-muted); }
.cmd-palette-kbd {
  font-size: 10px; color: var(--text-muted); background: rgba(255,255,255,0.06);
  padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono','Fira Code',monospace;
}
.cmd-palette-results {
  flex: 1; overflow-y: auto; padding: 8px;
}
.cmd-palette-section-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; color: var(--text-muted); padding: 8px 12px 4px 12px;
}
.cmd-palette-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px; cursor: pointer;
  transition: background 0.12s ease;
}
.cmd-palette-item:hover, .cmd-palette-item.selected {
  background: rgba(11,133,243,0.12);
}
.cmd-palette-item-icon {
  width: 30px; height: 30px; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;
}
.cmd-palette-item-icon.product { background: var(--primary-glow); color: var(--primary-light); }
.cmd-palette-item-icon.customer { background: var(--success-glow); color: var(--success); }
.cmd-palette-item-icon.order { background: var(--accent-glow); color: var(--accent); }
.cmd-palette-item-icon.action { background: rgba(139,92,246,0.15); color: #a78bfa; }
.cmd-palette-item-text { flex: 1; }
.cmd-palette-item-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.cmd-palette-item-sub { font-size: 11px; color: var(--text-muted); }
.cmd-palette-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; border-top: 1px solid rgba(255,255,255,0.06);
  font-size: 11px; color: var(--text-muted);
}
.cmd-palette-footer-keys {
  display: flex; gap: 12px;
}
.cmd-palette-footer-keys span {
  display: flex; align-items: center; gap: 4px;
}
.cmd-palette-footer-keys kbd {
  background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px;
  font-family: 'SF Mono','Fira Code',monospace; font-size: 10px;
}

/* ── Breadcrumbs ── */
.breadcrumb-bar {
  display: none; align-items: center; gap: 6px;
  padding: 8px 0; margin-bottom: 16px;
  font-size: 12px; color: var(--text-muted);
}
.breadcrumb-bar.visible { display: flex; }
.breadcrumb-bar a {
  color: var(--text-muted); text-decoration: none; cursor: pointer;
  transition: color 0.15s ease;
}
.breadcrumb-bar a:hover { color: var(--primary-light); }
.breadcrumb-sep { color: rgba(255,255,255,0.15); }
.breadcrumb-current { color: var(--text-secondary); font-weight: 600; }

/* ── Shimmer Loading ── */
.shimmer-container { position: relative; }
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.shimmer-block {
  border-radius: 8px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.03) 0%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.03) 100%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
.shimmer-row { display: flex; gap: 16px; margin-bottom: 12px; }
.shimmer-card {
  flex: 1; height: 120px; border-radius: 16px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.03) 0%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.03) 100%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
.shimmer-table-row {
  height: 40px; margin-bottom: 8px; border-radius: 6px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.03) 0%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.03) 100%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* ── Empty State ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 20px; text-align: center;
}
.empty-state-icon {
  width: 80px; height: 80px; border-radius: 20px;
  background: rgba(255,255,255,0.03); display: flex;
  align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.empty-state-icon i { font-size: 32px; color: var(--text-muted); opacity: 0.4; }
.empty-state h3 {
  font-size: 18px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;
}
.empty-state p { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; max-width: 320px; }
.empty-state-btn {
  padding: 8px 20px; border-radius: 8px; font-size: 12px; font-weight: 600;
  background: var(--primary-glow); color: var(--primary-light);
  border: 1px solid rgba(11,133,243,0.3); cursor: pointer;
  font-family: inherit; transition: all 0.2s ease;
}
.empty-state-btn:hover { background: rgba(11,133,243,0.25); }

/* ── Tour / Onboarding ── */
.tour-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.65); z-index: 10000; display: none;
}
.tour-overlay.visible { display: block; }
.tour-highlight-ring {
  position: fixed; border: 2px solid var(--primary-light);
  border-radius: 12px; z-index: 10001; pointer-events: none;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(11,133,243,0.4);
  transition: all 0.4s ease;
}
.tour-tooltip {
  position: fixed; z-index: 10002; width: 340px;
  background: #1e293b; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 20px; box-shadow: 0 16px 48px rgba(0,0,0,0.5);
  transition: all 0.4s ease;
}
.tour-tooltip h4 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.tour-tooltip p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; }
.tour-tooltip-footer {
  display: flex; align-items: center; justify-content: space-between;
}
.tour-dots { display: flex; gap: 6px; }
.tour-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.15); transition: all 0.2s ease;
}
.tour-dot.active { background: var(--primary-light); width: 20px; border-radius: 4px; }
.tour-btns { display: flex; gap: 8px; }
.tour-btn {
  padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
  border: none; cursor: pointer; font-family: inherit; transition: all 0.2s ease;
}
.tour-btn.skip { background: transparent; color: var(--text-muted); }
.tour-btn.skip:hover { color: var(--text-secondary); }
.tour-btn.next { background: var(--primary); color: white; }
.tour-btn.next:hover { background: var(--primary-light); }
.tour-step-counter {
  font-size: 11px; color: var(--text-muted); font-weight: 500;
}

/* ── Print Styles ── */
@media print {
  body { background: white !important; color: black !important; }
  .sidebar, .topbar, .breadcrumb-bar, .tour-overlay, .cmd-palette-overlay,
  .search-results-overlay, .notif-btn, .sync-indicator, button, .nav-item,
  .open-analytics-btn, .analytics-tabs, .chart-toggle-btn { display: none !important; }
  .main-content {
    margin-left: 0 !important; margin-top: 0 !important;
    padding: 20px !important;
  }
  .view-container { display: none !important; }
  .view-container.active { display: block !important; }
  .glass-card, .kpi-card, .analytics-card {
    background: white !important; border: 1px solid #ddd !important;
    box-shadow: none !important; backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    break-inside: avoid; page-break-inside: avoid;
  }
  .kpi-value, .card-title h3, .analytics-card h4 {
    color: black !important;
  }
  .kpi-label, .analytics-item-sub, .churn-detail {
    color: #666 !important;
  }
  canvas { max-width: 100% !important; height: auto !important; }
  .print-header {
    display: block !important; text-align: center;
    margin-bottom: 20px; padding-bottom: 12px;
    border-bottom: 2px solid #333;
  }
  .print-header h1 { font-size: 20px; color: black; }
  .print-header p { font-size: 12px; color: #666; }
  .print-footer {
    display: block !important; text-align: center;
    margin-top: 20px; padding-top: 12px;
    border-top: 1px solid #999; font-size: 10px; color: #999;
  }
  @page { margin: 1cm; }
}
.print-header, .print-footer { display: none; }

  `;
  document.head.appendChild(styleSheet);


  /* ================================================================
     1. ANALYTICS DEEP DIVE VIEW
     ================================================================ */

  // Inject analytics view container into the DOM
  function injectAnalyticsView() {
    const main = document.getElementById('mainContent');
    if (!main || document.getElementById('view-analytics')) return;

    const div = document.createElement('div');
    div.className = 'view-container';
    div.id = 'view-analytics';
    div.innerHTML = buildAnalyticsHTML();
    main.appendChild(div);

    // Also add a nav item for analytics
    const nav = document.querySelector('.sidebar-nav');
    if (nav && !document.querySelector('.nav-item[data-view="analytics"]')) {
      const settingsItem = document.querySelector('.nav-item[data-view="settings"]');
      const item = document.createElement('div');
      item.className = 'nav-item';
      item.setAttribute('data-view', 'analytics');
      item.setAttribute('onclick', "showView('analytics')");
      item.innerHTML = '<i class="fas fa-chart-line"></i><span class="nav-tooltip">Analytics</span>';
      if (settingsItem) {
        nav.insertBefore(item, settingsItem);
      } else {
        nav.appendChild(item);
      }
    }

    // Add "Deep Dive Analytics" button to dashboard
    const dashView = document.getElementById('view-dashboard');
    if (dashView) {
      const kpiGrid = dashView.querySelector('.kpi-grid');
      if (kpiGrid) {
        const btnWrap = document.createElement('div');
        btnWrap.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:16px;gap:8px;';
        btnWrap.innerHTML = `
          <button class="open-analytics-btn" onclick="showView('analytics')">
            <i class="fas fa-chart-line" style="margin-right:6px;"></i>Deep Dive Analytics
          </button>
          <button class="open-analytics-btn" onclick="window.startTour()">
            <i class="fas fa-graduation-cap" style="margin-right:6px;"></i>Take Tour
          </button>
        `;
        kpiGrid.parentNode.insertBefore(btnWrap, kpiGrid);
      }
    }
  }

  function buildAnalyticsHTML() {
    return `
    <div class="analytics-header">
      <h2><i class="fas fa-chart-line" style="color:var(--primary-light);margin-right:10px;"></i>Analytics Deep Dive</h2>
      <div class="analytics-tabs">
        <button class="analytics-tab active" onclick="window._analyticsTab('revenue')">Revenue</button>
        <button class="analytics-tab" onclick="window._analyticsTab('customer')">Customers</button>
        <button class="analytics-tab" onclick="window._analyticsTab('product')">Products</button>
      </div>
    </div>

    <!-- Revenue Panel -->
    <div class="analytics-panel active" id="analytics-revenue">
      <div class="analytics-grid-2">
        <div class="analytics-card">
          <h4><i class="fas fa-chart-bar"></i>Revenue by Month (Last 12 Months)</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsRevenueMonthly"></canvas></div>
        </div>
        <div class="analytics-card">
          <h4><i class="fas fa-chart-pie"></i>Revenue by Customer Tier</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsTierPie"></canvas></div>
        </div>
      </div>
      <div class="analytics-grid-2">
        <div class="analytics-card">
          <h4><i class="fas fa-layer-group"></i>Revenue by Product Category</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsCategoryBar"></canvas></div>
        </div>
        <div class="analytics-card">
          <h4><i class="fas fa-ranking-star"></i>Top 10 Revenue Customers</h4>
          <div class="analytics-chart-wrap tall"><canvas id="analyticsTopCustomers"></canvas></div>
        </div>
      </div>
      <div class="analytics-grid-2" style="grid-template-columns:1fr;">
        <div class="analytics-card">
          <h4><i class="fas fa-chart-line"></i>Revenue Forecast (Next 3 Months)</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsForecast"></canvas></div>
        </div>
      </div>
    </div>

    <!-- Customer Panel -->
    <div class="analytics-panel" id="analytics-customer">
      <div class="analytics-grid-2">
        <div class="analytics-card">
          <h4><i class="fas fa-user-plus"></i>New Customers per Month</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsNewCustomers"></canvas></div>
        </div>
        <div class="analytics-card">
          <h4><i class="fas fa-gauge-high"></i>Customer Retention Rate</h4>
          <div class="gauge-wrap">
            <svg class="gauge-svg" viewBox="0 0 160 90">
              <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" stroke-linecap="round"/>
              <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="url(#gaugeGrad)" stroke-width="12" stroke-linecap="round"
                stroke-dasharray="204" stroke-dashoffset="26.5" id="gaugeArc"/>
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#10b981"/>
                  <stop offset="100%" stop-color="#34d399"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="gauge-label">87%</div>
            <div class="gauge-sub">Customer Retention Rate (rolling 12 months)</div>
          </div>
        </div>
      </div>
      <div class="analytics-grid-2">
        <div class="analytics-card">
          <h4><i class="fas fa-chart-line"></i>Average Order Value Trend</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsAOV"></canvas></div>
        </div>
        <div class="analytics-card">
          <h4><i class="fas fa-chart-bar"></i>Customer Lifetime Value Distribution</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsLTVHist"></canvas></div>
        </div>
      </div>
      <div class="analytics-grid-2" style="grid-template-columns:1fr;">
        <div class="analytics-card">
          <h4><i class="fas fa-triangle-exclamation" style="color:#ef4444;"></i>Churn Risk Analysis</h4>
          <div id="churnRiskList" class="analytics-list"></div>
        </div>
      </div>
    </div>

    <!-- Product Panel -->
    <div class="analytics-panel" id="analytics-product">
      <div class="analytics-grid-2">
        <div class="analytics-card">
          <h4><i class="fas fa-fire" style="color:#f59e0b;"></i>Best Sellers by Units (Top 10)</h4>
          <div id="bestByUnits" class="analytics-list"></div>
        </div>
        <div class="analytics-card">
          <h4><i class="fas fa-dollar-sign" style="color:#10b981;"></i>Best Sellers by Revenue (Top 10)</h4>
          <div id="bestByRevenue" class="analytics-list"></div>
        </div>
      </div>
      <div class="analytics-grid-2">
        <div class="analytics-card">
          <h4><i class="fas fa-snail" style="color:#ef4444;"></i>Slow Movers (Bottom 10 by Velocity)</h4>
          <div id="slowMovers" class="analytics-list"></div>
        </div>
        <div class="analytics-card">
          <h4><i class="fas fa-rotate"></i>Stock Turnover Rate by Category</h4>
          <div class="analytics-chart-wrap short"><canvas id="analyticsTurnover"></canvas></div>
        </div>
      </div>
      <div class="analytics-grid-2" style="grid-template-columns:1fr;">
        <div class="analytics-card">
          <h4><i class="fas fa-percent"></i>Margin Analysis by Product Line</h4>
          <div class="analytics-chart-wrap"><canvas id="analyticsMargin"></canvas></div>
        </div>
      </div>
    </div>
    `;
  }

  // Analytics tab switcher
  window._analyticsTab = function (tab) {
    document.querySelectorAll('.analytics-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.analytics-panel').forEach(p => p.classList.remove('active'));

    const tabs = document.querySelectorAll('.analytics-tab');
    const panels = { revenue: 0, customer: 1, product: 2 };
    if (tabs[panels[tab]]) tabs[panels[tab]].classList.add('active');

    const panel = document.getElementById('analytics-' + tab);
    if (panel) panel.classList.add('active');

    // Init charts on first show
    if (tab === 'revenue' && !window._analyticsRevenueInit) initRevenueAnalytics();
    if (tab === 'customer' && !window._analyticsCustomerInit) initCustomerAnalytics();
    if (tab === 'product' && !window._analyticsProductInit) initProductAnalytics();
  };

  // Shared chart defaults
  const chartColors = {
    blue: 'rgba(11,133,243,0.85)',
    green: 'rgba(16,185,129,0.85)',
    amber: 'rgba(245,158,11,0.85)',
    slate: 'rgba(100,116,139,0.85)',
    purple: 'rgba(139,92,246,0.85)',
    pink: 'rgba(236,72,153,0.85)',
    cyan: 'rgba(6,182,212,0.85)',
    red: 'rgba(239,68,68,0.85)',
    lime: 'rgba(132,204,22,0.85)',
    orange: 'rgba(249,115,22,0.85)',
  };
  const colorArr = Object.values(chartColors);

  function initRevenueAnalytics() {
    window._analyticsRevenueInit = true;

    // Revenue by month (last 12)
    const months12 = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const rev12 = [248000,292000,315000,342000,287000,310000,327000,326000,292000,350000,446000,847210];
    new Chart(document.getElementById('analyticsRevenueMonthly').getContext('2d'), {
      type: 'bar',
      data: {
        labels: months12,
        datasets: [{
          label: 'Revenue',
          data: rev12,
          backgroundColor: rev12.map((v, i) => i === 11 ? 'rgba(11,133,243,0.9)' : 'rgba(11,133,243,0.5)'),
          borderColor: 'rgba(11,133,243,1)',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => 'Revenue: ' + fmt(ctx.parsed.y) } }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'K' }
          }
        }
      }
    });

    // Revenue by tier pie
    const tierRev = { platinum: 0, gold: 0, silver: 0 };
    ORDERS().forEach(o => {
      const c = CUSTOMERS().find(cc => cc.id === o.customerId);
      if (c) {
        const t = (c.tier || 'silver').toLowerCase();
        tierRev[t] = (tierRev[t] || 0) + o.total;
      }
    });
    new Chart(document.getElementById('analyticsTierPie').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Platinum', 'Gold', 'Silver'],
        datasets: [{
          data: [tierRev.platinum, tierRev.gold, tierRev.silver],
          backgroundColor: [chartColors.purple, chartColors.amber, chartColors.slate],
          borderWidth: 2, hoverOffset: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ctx.label + ': ' + fmt(ctx.parsed) } }
        }
      }
    });

    // Revenue by category
    const catRev = {};
    ORDERS().forEach(o => {
      o.items.forEach(it => {
        const p = PRODUCTS().find(pp => pp.sku === it.sku);
        const cat = p ? p.category : 'other';
        catRev[cat] = (catRev[cat] || 0) + it.qty * it.price;
      });
    });
    const catLabels = Object.keys(catRev).map(c => c.charAt(0).toUpperCase() + c.slice(1));
    const catValues = Object.values(catRev);
    new Chart(document.getElementById('analyticsCategoryBar').getContext('2d'), {
      type: 'bar',
      data: {
        labels: catLabels,
        datasets: [{
          label: 'Revenue',
          data: catValues,
          backgroundColor: [chartColors.blue, chartColors.green, chartColors.amber, chartColors.slate],
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.x) } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'K' } },
          y: { grid: { display: false } }
        }
      }
    });

    // Top 10 revenue customers
    const custRev = {};
    ORDERS().forEach(o => {
      const c = CUSTOMERS().find(cc => cc.id === o.customerId);
      if (c) {
        custRev[c.name] = (custRev[c.name] || 0) + o.total;
      }
    });
    const topCusts = Object.entries(custRev).sort((a,b) => b[1]-a[1]).slice(0,10);
    new Chart(document.getElementById('analyticsTopCustomers').getContext('2d'), {
      type: 'bar',
      data: {
        labels: topCusts.map(c => c[0]),
        datasets: [{
          label: 'Revenue',
          data: topCusts.map(c => c[1]),
          backgroundColor: topCusts.map((_, i) => i < 3 ? chartColors.blue : 'rgba(11,133,243,0.4)'),
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.x) } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'K' } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });

    // Forecast: historical + 3 month forecast
    const histMonths = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    const histRev = [327000, 326000, 292000, 350000, 446000, 847210];
    const forecastMonths = ['Apr','May','Jun'];
    // Simple linear forecast from last 6 months
    const avgGrowth = (histRev[5] - histRev[0]) / 5;
    const forecastRev = [
      Math.round(histRev[5] + avgGrowth * 0.7),
      Math.round(histRev[5] + avgGrowth * 1.2),
      Math.round(histRev[5] + avgGrowth * 1.6),
    ];

    const allLabels = [...histMonths, ...forecastMonths];
    const histData = [...histRev, null, null, null];
    const foreData = [null, null, null, null, null, histRev[5], ...forecastRev];

    const fCtx = document.getElementById('analyticsForecast').getContext('2d');
    const fGrad = fCtx.createLinearGradient(0, 0, 0, 260);
    fGrad.addColorStop(0, 'rgba(11,133,243,0.2)');
    fGrad.addColorStop(1, 'rgba(11,133,243,0)');
    const fGrad2 = fCtx.createLinearGradient(0, 0, 0, 260);
    fGrad2.addColorStop(0, 'rgba(16,185,129,0.15)');
    fGrad2.addColorStop(1, 'rgba(16,185,129,0)');

    new Chart(fCtx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Actual Revenue',
            data: histData,
            borderColor: '#0b85f3',
            backgroundColor: fGrad,
            borderWidth: 2.5, fill: true, tension: 0.4,
            pointRadius: 4, pointBackgroundColor: '#0b85f3',
            pointHoverRadius: 6,
          },
          {
            label: 'Forecast',
            data: foreData,
            borderColor: '#10b981',
            backgroundColor: fGrad2,
            borderWidth: 2.5, borderDash: [6, 4], fill: true, tension: 0.4,
            pointRadius: 4, pointBackgroundColor: '#10b981', pointStyle: 'triangle',
            pointHoverRadius: 6,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + fmt(ctx.parsed.y) } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'K' } }
        }
      }
    });
  }

  function initCustomerAnalytics() {
    window._analyticsCustomerInit = true;

    // New customers per month
    const ncMonths = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const ncData = [2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1, 2];
    new Chart(document.getElementById('analyticsNewCustomers').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ncMonths,
        datasets: [{
          label: 'New Customers',
          data: ncData,
          backgroundColor: chartColors.green,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // AOV trend
    const aovMonths = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    const aovData = [4200, 4580, 3920, 4800, 5100, 5350];
    const aCtx = document.getElementById('analyticsAOV').getContext('2d');
    const aGrad = aCtx.createLinearGradient(0, 0, 0, 260);
    aGrad.addColorStop(0, 'rgba(245,158,11,0.2)');
    aGrad.addColorStop(1, 'rgba(245,158,11,0)');
    new Chart(aCtx, {
      type: 'line',
      data: {
        labels: aovMonths,
        datasets: [{
          label: 'Avg Order Value',
          data: aovData,
          borderColor: '#f59e0b',
          backgroundColor: aGrad,
          borderWidth: 2.5, fill: true, tension: 0.4,
          pointRadius: 4, pointBackgroundColor: '#f59e0b',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => 'AOV: ' + fmt(ctx.parsed.y) } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: v => fmt(v) } }
        }
      }
    });

    // LTV histogram
    const custs = CUSTOMERS();
    const ranges = ['$0-$20K','$20K-$50K','$50K-$100K','$100K-$150K','$150K+'];
    const bins = [0, 0, 0, 0, 0];
    custs.forEach(c => {
      const ltv = c.ltv || 0;
      if (ltv < 20000) bins[0]++;
      else if (ltv < 50000) bins[1]++;
      else if (ltv < 100000) bins[2]++;
      else if (ltv < 150000) bins[3]++;
      else bins[4]++;
    });
    new Chart(document.getElementById('analyticsLTVHist').getContext('2d'), {
      type: 'bar',
      data: {
        labels: ranges,
        datasets: [{
          label: 'Customers',
          data: bins,
          backgroundColor: [chartColors.slate, chartColors.cyan, chartColors.green, chartColors.amber, chartColors.purple],
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // Churn risk list
    const now = new Date('2026-03-21');
    const atRisk = custs.map(c => {
      const lastDate = new Date(c.lastOrder + 'T00:00:00');
      const daysSince = Math.round((now - lastDate) / 86400000);
      return { ...c, daysSince };
    }).filter(c => c.daysSince > 14).sort((a, b) => b.daysSince - a.daysSince);

    const churnList = document.getElementById('churnRiskList');
    if (churnList) {
      churnList.innerHTML = atRisk.map(c => {
        const risk = c.daysSince > 30 ? 'high' : 'medium';
        return `
          <div class="churn-item">
            <div class="churn-dot ${risk}"></div>
            <div class="churn-info">
              <div class="churn-name">${escHtml(c.name)}</div>
              <div class="churn-detail">${c.tier} tier &middot; ${c.location} &middot; Last order: ${c.lastOrder}</div>
            </div>
            <div class="churn-days">${c.daysSince} days ago</div>
          </div>
        `;
      }).join('') || '<div style="padding:20px;text-align:center;color:var(--text-muted);">No at-risk customers found.</div>';
    }
  }

  function initProductAnalytics() {
    window._analyticsProductInit = true;

    // Calculate units & revenue per product from orders
    const unitMap = {};
    const revMap = {};
    ORDERS().forEach(o => {
      o.items.forEach(it => {
        unitMap[it.sku] = (unitMap[it.sku] || 0) + it.qty;
        revMap[it.sku] = (revMap[it.sku] || 0) + it.qty * it.price;
      });
    });

    // Best by units
    const byUnits = Object.entries(unitMap)
      .map(([sku, qty]) => {
        const p = PRODUCTS().find(pp => pp.sku === sku);
        return { sku, name: p ? p.name : sku, qty, category: p ? p.category : '' };
      })
      .sort((a, b) => b.qty - a.qty).slice(0, 10);
    const maxUnits = byUnits[0] ? byUnits[0].qty : 1;

    const buContainer = document.getElementById('bestByUnits');
    if (buContainer) {
      buContainer.innerHTML = byUnits.map((p, i) => {
        const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return `
          <div class="analytics-list-item">
            <div class="analytics-rank ${rankCls}">${i + 1}</div>
            <div class="analytics-item-info">
              <div class="analytics-item-name">${escHtml(p.name)}</div>
              <div class="analytics-item-sub">${p.sku} &middot; ${p.category}</div>
            </div>
            <div class="analytics-item-value">${fmtNum(p.qty)} units</div>
            <div class="analytics-item-bar"><div class="analytics-item-bar-fill" style="width:${Math.round(p.qty/maxUnits*100)}%"></div></div>
          </div>
        `;
      }).join('');
    }

    // Best by revenue
    const byRev = Object.entries(revMap)
      .map(([sku, rev]) => {
        const p = PRODUCTS().find(pp => pp.sku === sku);
        return { sku, name: p ? p.name : sku, rev, category: p ? p.category : '' };
      })
      .sort((a, b) => b.rev - a.rev).slice(0, 10);
    const maxRev = byRev[0] ? byRev[0].rev : 1;

    const brContainer = document.getElementById('bestByRevenue');
    if (brContainer) {
      brContainer.innerHTML = byRev.map((p, i) => {
        const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        return `
          <div class="analytics-list-item">
            <div class="analytics-rank ${rankCls}">${i + 1}</div>
            <div class="analytics-item-info">
              <div class="analytics-item-name">${escHtml(p.name)}</div>
              <div class="analytics-item-sub">${p.sku} &middot; ${p.category}</div>
            </div>
            <div class="analytics-item-value">${fmt(p.rev)}</div>
            <div class="analytics-item-bar"><div class="analytics-item-bar-fill" style="width:${Math.round(p.rev/maxRev*100)}%"></div></div>
          </div>
        `;
      }).join('');
    }

    // Slow movers: products NOT appearing much in orders (lowest velocity = units / stock ratio)
    const allProds = PRODUCTS().map(p => {
      const sold = unitMap[p.sku] || 0;
      const velocity = p.stock > 0 ? sold / p.stock : 0;
      return { ...p, sold, velocity };
    }).sort((a, b) => a.velocity - b.velocity).slice(0, 10);

    const smContainer = document.getElementById('slowMovers');
    if (smContainer) {
      smContainer.innerHTML = allProds.map((p, i) => `
        <div class="analytics-list-item">
          <div class="analytics-rank">${i + 1}</div>
          <div class="analytics-item-info">
            <div class="analytics-item-name">${escHtml(p.name)}</div>
            <div class="analytics-item-sub">${p.sku} &middot; Stock: ${fmtNum(p.stock)} &middot; Sold: ${fmtNum(p.sold)}</div>
          </div>
          <div class="slow-badge">Velocity: ${p.velocity.toFixed(2)}</div>
        </div>
      `).join('');
    }

    // Stock turnover by category
    const catStock = {};
    const catSold = {};
    PRODUCTS().forEach(p => {
      const cat = p.category || 'other';
      catStock[cat] = (catStock[cat] || 0) + p.stock;
    });
    ORDERS().forEach(o => {
      o.items.forEach(it => {
        const p = PRODUCTS().find(pp => pp.sku === it.sku);
        const cat = p ? p.category : 'other';
        catSold[cat] = (catSold[cat] || 0) + it.qty;
      });
    });
    const cats = Object.keys(catStock);
    const turnoverRates = cats.map(c => catStock[c] > 0 ? +(catSold[c] || 0) / catStock[c] : 0);

    new Chart(document.getElementById('analyticsTurnover').getContext('2d'), {
      type: 'bar',
      data: {
        labels: cats.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        datasets: [{
          label: 'Turnover Rate',
          data: turnoverRates.map(r => +r.toFixed(2)),
          backgroundColor: [chartColors.blue, chartColors.green, chartColors.amber, chartColors.slate],
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => 'Turnover: ' + ctx.parsed.y + 'x' } } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true }
        }
      }
    });

    // Margin analysis by product line (simulated margins)
    const productLines = ['Mens Shorts','Women Tees','Women Tanks','Mens Tanks','Unisex','Boys','Girls Shorts','Women Shorts','Women Hoodies','Unisex Hoodies'];
    const margins = [62, 58, 64, 55, 60, 68, 65, 59, 52, 54];
    const costs = margins.map(m => 100 - m);

    new Chart(document.getElementById('analyticsMargin').getContext('2d'), {
      type: 'bar',
      data: {
        labels: productLines,
        datasets: [
          {
            label: 'Margin %',
            data: margins,
            backgroundColor: chartColors.green,
            borderRadius: 4,
          },
          {
            label: 'COGS %',
            data: costs,
            backgroundColor: 'rgba(239,68,68,0.5)',
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
          tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y + '%' } }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,0.04)' }, max: 100, ticks: { callback: v => v + '%' } }
        }
      }
    });
  }


  /* ================================================================
     2. LIVE DASHBOARD FEATURES
     ================================================================ */

  // 2a. Live Clock
  function initLiveClock() {
    const dateEl = document.getElementById('currentDate');
    if (!dateEl) return;
    dateEl.id = 'liveClockDisplay';

    function tick() {
      const now = new Date();
      const opts = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
      const datePart = now.toLocaleDateString('en-US', opts);
      const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      dateEl.textContent = datePart + ' \u2014 ' + timePart;
    }
    tick();
    setInterval(tick, 1000);
  }

  // 2b. Auto-Refresh Simulation
  let autoRefreshInterval = null;
  function initAutoRefresh() {
    autoRefreshInterval = setInterval(() => {
      const prods = PRODUCTS();
      const orders = ORDERS();
      if (!prods.length) return;

      // Randomly decrease stock
      const randProd = prods[Math.floor(Math.random() * prods.length)];
      const decrease = Math.floor(Math.random() * 5) + 1;
      randProd.stock = Math.max(0, randProd.stock - decrease);

      // Add activity
      const feedEl = document.getElementById('activityFeed');
      if (feedEl) {
        const activities = [
          { type: 'order', icon: 'fa-shopping-cart', text: `<strong>${randomCustomerName()}</strong> browsed <span class="highlight">${escHtml(randProd.name)}</span>` },
          { type: 'view', icon: 'fa-eye', text: `Stock update: <span class="highlight">${escHtml(randProd.name)}</span> now at ${randProd.stock} units` },
          { type: 'reorder', icon: 'fa-rotate', text: `<strong>${randomCustomerName()}</strong> added items to cart` },
        ];
        const act = activities[Math.floor(Math.random() * activities.length)];
        const newItem = document.createElement('div');
        newItem.className = 'activity-item';
        newItem.style.opacity = '0';
        newItem.style.transition = 'opacity 0.5s ease';
        newItem.innerHTML = `
          <div class="activity-icon-wrap ${act.type}"><i class="fas ${act.icon}"></i></div>
          <div class="activity-text">${act.text}</div>
          <div class="activity-time">just now</div>
        `;
        feedEl.insertBefore(newItem, feedEl.firstChild);
        requestAnimationFrame(() => { newItem.style.opacity = '1'; });

        // Remove last item if too many
        if (feedEl.children.length > 12) {
          feedEl.removeChild(feedEl.lastChild);
        }
      }

      // Randomly update an order status
      if (orders.length) {
        const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
        if (pendingOrders.length) {
          const order = pendingOrders[Math.floor(Math.random() * pendingOrders.length)];
          if (order.status === 'pending') order.status = 'processing';
          else if (order.status === 'processing') order.status = 'shipped';
        }
      }

      // Pulse effect on KPI cards
      document.querySelectorAll('.kpi-card').forEach(card => {
        if (Math.random() > 0.7) {
          card.classList.add('value-pulse');
          setTimeout(() => card.classList.remove('value-pulse'), 800);
        }
      });

    }, 30000);
  }

  function randomCustomerName() {
    const custs = CUSTOMERS();
    if (!custs.length) return 'Unknown';
    return custs[Math.floor(Math.random() * custs.length)].name;
  }

  // 2c. Dashboard Number Animations
  function animateDashboardNumbers() {
    const kpiCards = document.querySelectorAll('#view-dashboard .kpi-value');
    kpiCards.forEach(el => {
      const text = el.textContent.trim();
      const isCurrency = text.startsWith('$');
      const hasPercent = text.includes('%');
      const cleanText = text.replace(/[$,%]/g, '').replace(/,/g, '');
      const targetValue = parseFloat(cleanText);

      if (isNaN(targetValue)) return;

      const duration = 1500;
      const startTime = performance.now();

      function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      }

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const current = targetValue * eased;

        if (isCurrency) {
          el.textContent = '$' + Math.round(current).toLocaleString('en-US');
        } else if (hasPercent) {
          el.textContent = current.toFixed(1) + '%';
        } else {
          el.textContent = Math.round(current).toLocaleString('en-US');
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = text; // restore exact original text
        }
      }

      el.textContent = isCurrency ? '$0' : '0';
      requestAnimationFrame(animate);
    });
  }

  // Hook into showView to trigger animations when switching to dashboard
  const originalShowView = window.showView;
  window.showView = function (viewName) {
    originalShowView(viewName);

    // Trigger number animation when navigating to dashboard
    if (viewName === 'dashboard') {
      animateDashboardNumbers();
    }

    // Init analytics charts on first view
    if (viewName === 'analytics' && !window._analyticsRevenueInit) {
      initRevenueAnalytics();
    }

    // Update breadcrumbs
    updateBreadcrumbs(viewName);
  };


  /* ================================================================
     3. COMMAND PALETTE (Cmd+K)
     ================================================================ */

  let cmdPaletteEl = null;
  let cmdSelectedIndex = 0;
  let cmdResults = [];
  let recentSearches = JSON.parse(localStorage.getItem('usa_recent_searches') || '[]');

  function initCommandPalette() {
    // Create overlay
    cmdPaletteEl = document.createElement('div');
    cmdPaletteEl.className = 'cmd-palette-overlay';
    cmdPaletteEl.innerHTML = `
      <div class="cmd-palette">
        <div class="cmd-palette-input-wrap">
          <i class="fas fa-search"></i>
          <input type="text" class="cmd-palette-input" id="cmdPaletteInput"
            placeholder="Search products, customers, orders, or type a command..."
            autocomplete="off">
          <span class="cmd-palette-kbd">ESC</span>
        </div>
        <div class="cmd-palette-results" id="cmdPaletteResults"></div>
        <div class="cmd-palette-footer">
          <div class="cmd-palette-footer-keys">
            <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
          <div>U.S. Apparel Command Center</div>
        </div>
      </div>
    `;
    document.body.appendChild(cmdPaletteEl);

    // Close on overlay click
    cmdPaletteEl.addEventListener('click', function (e) {
      if (e.target === cmdPaletteEl) closeCmdPalette();
    });

    const input = document.getElementById('cmdPaletteInput');
    input.addEventListener('input', function () {
      renderCmdResults(this.value.trim());
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeCmdPalette(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cmdSelectedIndex = Math.min(cmdSelectedIndex + 1, cmdResults.length - 1);
        highlightCmdItem();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        cmdSelectedIndex = Math.max(cmdSelectedIndex - 1, 0);
        highlightCmdItem();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (cmdResults[cmdSelectedIndex]) {
          executeCmdItem(cmdResults[cmdSelectedIndex]);
        }
      }
    });

    // Keyboard shortcut
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (cmdPaletteEl.classList.contains('visible')) {
          closeCmdPalette();
        } else {
          openCmdPalette();
        }
      }
    });
  }

  function openCmdPalette() {
    cmdPaletteEl.classList.add('visible');
    const input = document.getElementById('cmdPaletteInput');
    input.value = '';
    cmdSelectedIndex = 0;
    renderCmdResults('');
    setTimeout(() => input.focus(), 50);
  }

  function closeCmdPalette() {
    cmdPaletteEl.classList.remove('visible');
  }

  function renderCmdResults(query) {
    const container = document.getElementById('cmdPaletteResults');
    cmdResults = [];
    let html = '';

    const actions = [
      { type: 'action', icon: 'fa-plus', title: 'Create New Order', sub: 'Navigate to order creation', view: 'orders' },
      { type: 'action', icon: 'fa-chart-line', title: 'View Reports', sub: 'Open Analytics Deep Dive', view: 'analytics' },
      { type: 'action', icon: 'fa-download', title: 'Export Data', sub: 'Export current view as CSV', action: 'export' },
      { type: 'action', icon: 'fa-gear', title: 'Settings', sub: 'Open system settings', view: 'settings' },
      { type: 'action', icon: 'fa-graduation-cap', title: 'Start Tour', sub: 'Take a guided tour of the app', action: 'tour' },
      { type: 'action', icon: 'fa-print', title: 'Print Current View', sub: 'Print the current view', action: 'print' },
    ];

    if (!query) {
      // Show recent searches + actions
      if (recentSearches.length > 0) {
        html += '<div class="cmd-palette-section-label">Recent Searches</div>';
        recentSearches.slice(0, 5).forEach(s => {
          cmdResults.push({ type: 'search', query: s });
          html += `
            <div class="cmd-palette-item" data-idx="${cmdResults.length - 1}">
              <div class="cmd-palette-item-icon action" style="background:rgba(255,255,255,0.05);color:var(--text-muted);">
                <i class="fas fa-clock-rotate-left"></i>
              </div>
              <div class="cmd-palette-item-text">
                <div class="cmd-palette-item-title">${escHtml(s)}</div>
              </div>
            </div>
          `;
        });
      }
      html += '<div class="cmd-palette-section-label">Actions</div>';
      actions.forEach(a => {
        cmdResults.push(a);
        html += buildCmdItem(a, cmdResults.length - 1);
      });
    } else {
      const q = query.toLowerCase();

      // Search products
      const matchedProds = PRODUCTS().filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      ).slice(0, 5);

      if (matchedProds.length) {
        html += '<div class="cmd-palette-section-label">Products</div>';
        matchedProds.forEach(p => {
          const item = { type: 'product', data: p, title: p.name, sub: p.sku + ' \u00b7 ' + p.category + ' \u00b7 ' + fmtDec(p.price), view: 'catalog' };
          cmdResults.push(item);
          html += buildCmdItem(item, cmdResults.length - 1);
        });
      }

      // Search customers
      const matchedCusts = CUSTOMERS().filter(c =>
        c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q)
      ).slice(0, 5);

      if (matchedCusts.length) {
        html += '<div class="cmd-palette-section-label">Customers</div>';
        matchedCusts.forEach(c => {
          const item = { type: 'customer', data: c, title: c.name, sub: c.tier + ' \u00b7 ' + c.location, view: 'customers' };
          cmdResults.push(item);
          html += buildCmdItem(item, cmdResults.length - 1);
        });
      }

      // Search orders
      const matchedOrders = ORDERS().filter(o => {
        const cust = CUSTOMERS().find(cc => cc.id === o.customerId);
        const custName = cust ? cust.name.toLowerCase() : '';
        return o.id.toLowerCase().includes(q) || custName.includes(q);
      }).slice(0, 5);

      if (matchedOrders.length) {
        html += '<div class="cmd-palette-section-label">Orders</div>';
        matchedOrders.forEach(o => {
          const cust = CUSTOMERS().find(cc => cc.id === o.customerId);
          const item = { type: 'order', data: o, title: '#' + o.id, sub: (cust ? cust.name : 'Unknown') + ' \u00b7 ' + fmt(o.total) + ' \u00b7 ' + o.status, view: 'orders' };
          cmdResults.push(item);
          html += buildCmdItem(item, cmdResults.length - 1);
        });
      }

      // Filtered actions
      const matchedActions = actions.filter(a => a.title.toLowerCase().includes(q));
      if (matchedActions.length) {
        html += '<div class="cmd-palette-section-label">Actions</div>';
        matchedActions.forEach(a => {
          cmdResults.push(a);
          html += buildCmdItem(a, cmdResults.length - 1);
        });
      }

      if (cmdResults.length === 0) {
        html = '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:13px;">No results found for "' + escHtml(query) + '"</div>';
      }
    }

    container.innerHTML = html;
    cmdSelectedIndex = 0;
    highlightCmdItem();

    // Bind click handlers
    container.querySelectorAll('.cmd-palette-item').forEach(el => {
      el.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        if (cmdResults[idx]) executeCmdItem(cmdResults[idx]);
      });
    });
  }

  function buildCmdItem(item, idx) {
    const iconClass = item.type === 'product' ? 'product' :
                      item.type === 'customer' ? 'customer' :
                      item.type === 'order' ? 'order' : 'action';
    const icon = item.icon || (item.type === 'product' ? 'fa-tag' :
                 item.type === 'customer' ? 'fa-building' :
                 item.type === 'order' ? 'fa-receipt' : 'fa-bolt');
    return `
      <div class="cmd-palette-item" data-idx="${idx}">
        <div class="cmd-palette-item-icon ${iconClass}"><i class="fas ${icon}"></i></div>
        <div class="cmd-palette-item-text">
          <div class="cmd-palette-item-title">${escHtml(item.title || '')}</div>
          ${item.sub ? '<div class="cmd-palette-item-sub">' + escHtml(item.sub) + '</div>' : ''}
        </div>
      </div>
    `;
  }

  function highlightCmdItem() {
    const items = document.querySelectorAll('#cmdPaletteResults .cmd-palette-item');
    items.forEach((el, i) => {
      el.classList.toggle('selected', i === cmdSelectedIndex);
    });
    // Scroll selected into view
    if (items[cmdSelectedIndex]) {
      items[cmdSelectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function executeCmdItem(item) {
    closeCmdPalette();

    // Save to recent searches
    if (item.title && item.type !== 'search') {
      recentSearches = recentSearches.filter(s => s !== item.title);
      recentSearches.unshift(item.title);
      recentSearches = recentSearches.slice(0, 10);
      localStorage.setItem('usa_recent_searches', JSON.stringify(recentSearches));
    }

    if (item.type === 'search') {
      openCmdPalette();
      const input = document.getElementById('cmdPaletteInput');
      input.value = item.query;
      renderCmdResults(item.query);
      return;
    }

    if (item.action === 'export') {
      // Export current active view
      const activeView = document.querySelector('.view-container.active');
      if (activeView) {
        const viewId = activeView.id.replace('view-', '');
        exportCurrentView(viewId);
      }
      return;
    }

    if (item.action === 'tour') {
      window.startTour();
      return;
    }

    if (item.action === 'print') {
      window.printView();
      return;
    }

    if (item.view) {
      window.showView(item.view);
    }
  }


  /* ================================================================
     4. BREADCRUMB NAVIGATION
     ================================================================ */

  let breadcrumbEl = null;

  function initBreadcrumbs() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    breadcrumbEl = document.createElement('div');
    breadcrumbEl.className = 'breadcrumb-bar';
    breadcrumbEl.id = 'breadcrumbBar';
    main.insertBefore(breadcrumbEl, main.firstChild);
  }

  function updateBreadcrumbs(viewName, detail) {
    if (!breadcrumbEl) return;

    const viewLabels = {
      dashboard: null,
      catalog: 'Catalog',
      orders: 'Orders',
      inventory: 'Inventory',
      reorder: 'AI Reorder',
      customers: 'Customers',
      portal: 'Customer Portal',
      analytics: 'Analytics',
      settings: 'Settings',
    };

    const label = viewLabels[viewName];
    if (!label) {
      breadcrumbEl.classList.remove('visible');
      return;
    }

    let html = '<a onclick="showView(\'dashboard\')"><i class="fas fa-home" style="font-size:11px;"></i></a>';
    html += '<span class="breadcrumb-sep"><i class="fas fa-chevron-right" style="font-size:8px;"></i></span>';

    if (detail) {
      html += `<a onclick="showView('${viewName}')">${escHtml(label)}</a>`;
      html += '<span class="breadcrumb-sep"><i class="fas fa-chevron-right" style="font-size:8px;"></i></span>';
      html += `<span class="breadcrumb-current">${escHtml(detail)}</span>`;
    } else {
      html += `<span class="breadcrumb-current">${escHtml(label)}</span>`;
    }

    breadcrumbEl.innerHTML = html;
    breadcrumbEl.classList.add('visible');
  }

  // Expose breadcrumb detail setter for other views
  window.setBreadcrumbDetail = function (viewName, detail) {
    updateBreadcrumbs(viewName, detail);
  };


  /* ================================================================
     5. LOADING STATES (Shimmer Skeletons)
     ================================================================ */

  window.showLoading = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Store original content
    container.setAttribute('data-original-content', container.innerHTML);
    container.classList.add('shimmer-container');

    let shimmerHTML = '<div style="padding:12px;">';

    // Generate shimmer for cards
    shimmerHTML += '<div class="shimmer-row">';
    for (let i = 0; i < 3; i++) {
      shimmerHTML += '<div class="shimmer-card" style="animation-delay:' + (i * 0.15) + 's;"></div>';
    }
    shimmerHTML += '</div>';

    // Generate shimmer for table rows
    for (let i = 0; i < 6; i++) {
      shimmerHTML += '<div class="shimmer-table-row" style="animation-delay:' + (i * 0.1) + 's;width:' + (85 + Math.random() * 15) + '%;"></div>';
    }

    shimmerHTML += '</div>';
    container.innerHTML = shimmerHTML;
  };

  window.hideLoading = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const original = container.getAttribute('data-original-content');
    if (original !== null) {
      container.innerHTML = original;
      container.removeAttribute('data-original-content');
    }
    container.classList.remove('shimmer-container');
  };

  // Apply shimmer to dashboard on initial load
  function applyInitialLoading() {
    const dashView = document.getElementById('view-dashboard');
    if (!dashView) return;

    const kpiGrid = dashView.querySelector('.kpi-grid');
    if (kpiGrid) {
      const cards = kpiGrid.querySelectorAll('.kpi-card');
      cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transition = 'opacity 0.4s ease';
      });

      setTimeout(() => {
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.style.opacity = '1';
          }, i * 80);
        });
        animateDashboardNumbers();
      }, 500);
    }
  }


  /* ================================================================
     6. EMPTY STATES
     ================================================================ */

  window.showEmptyState = function (containerId, options) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const opts = Object.assign({
      icon: 'fa-inbox',
      title: 'No results found',
      message: 'Try adjusting your filters or search terms.',
      buttonText: 'Clear Filters',
      onButtonClick: null,
    }, options || {});

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fas ${escHtml(opts.icon)}"></i>
        </div>
        <h3>${escHtml(opts.title)}</h3>
        <p>${escHtml(opts.message)}</p>
        ${opts.buttonText ? '<button class="empty-state-btn" id="emptyStateBtn_' + containerId + '">' + escHtml(opts.buttonText) + '</button>' : ''}
      </div>
    `;

    if (opts.onButtonClick) {
      const btn = document.getElementById('emptyStateBtn_' + containerId);
      if (btn) btn.addEventListener('click', opts.onButtonClick);
    }
  };


  /* ================================================================
     7. EXPORT FUNCTIONALITY (CSV)
     ================================================================ */

  window.exportCSV = function (data, filename) {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);

    function escapeCSV(val) {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    const csvRows = [headers.map(escapeCSV).join(',')];
    data.forEach(row => {
      csvRows.push(headers.map(h => escapeCSV(row[h])).join(','));
    });

    const csvString = csvRows.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'export.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  function exportCurrentView(viewId) {
    switch (viewId) {
      case 'catalog':
        window.exportCSV(
          PRODUCTS().map(p => ({
            SKU: p.sku, Name: p.name, Category: p.category, SubCategory: p.sub,
            Colors: p.colors, Price: p.price, Stock: p.stock
          })),
          'us-apparel-products-' + todayStr() + '.csv'
        );
        break;
      case 'customers':
        window.exportCSV(
          CUSTOMERS().map(c => ({
            ID: c.id, Name: c.name, Tier: c.tier, Location: c.location,
            Orders: c.orders, LTV: c.ltv, LastOrder: c.lastOrder,
            Contact: c.contact, Email: c.email, Phone: c.phone
          })),
          'us-apparel-customers-' + todayStr() + '.csv'
        );
        break;
      case 'orders':
        window.exportCSV(
          ORDERS().map(o => {
            const c = CUSTOMERS().find(cc => cc.id === o.customerId);
            return {
              OrderID: o.id, Customer: c ? c.name : 'Unknown', Total: o.total,
              Status: o.status, Date: o.date, ShipMethod: o.shipMethod,
              Tracking: o.tracking || '',
              Items: o.items.map(it => it.name + ' x' + it.qty).join('; ')
            };
          }),
          'us-apparel-orders-' + todayStr() + '.csv'
        );
        break;
      case 'inventory':
        window.exportCSV(
          PRODUCTS().map(p => ({
            SKU: p.sku, Name: p.name, Category: p.category, Stock: p.stock,
            Price: p.price, StockValue: (p.stock * p.price).toFixed(2),
            Status: p.stock < 30 ? 'Critical' : p.stock < 100 ? 'Low' : 'Normal'
          })),
          'us-apparel-inventory-' + todayStr() + '.csv'
        );
        break;
      default:
        // Export whatever makes sense from the dashboard
        window.exportCSV(
          PRODUCTS().map(p => ({
            SKU: p.sku, Name: p.name, Category: p.category,
            Price: p.price, Stock: p.stock
          })),
          'us-apparel-data-' + todayStr() + '.csv'
        );
    }
  }

  // Expose export for current view
  window.exportCurrentView = exportCurrentView;

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }


  /* ================================================================
     8. PRINT FUNCTIONALITY
     ================================================================ */

  window.printView = function (viewId) {
    // Add print header/footer
    let header = document.querySelector('.print-header');
    let footer = document.querySelector('.print-footer');

    if (!header) {
      header = document.createElement('div');
      header.className = 'print-header';
      header.innerHTML = '<h1>U.S. Apparel LLC</h1><p>Command Center Report</p>';
      const main = document.getElementById('mainContent');
      if (main) main.insertBefore(header, main.firstChild);
    }

    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'print-footer';
      const main = document.getElementById('mainContent');
      if (main) main.appendChild(footer);
    }

    const now = new Date();
    footer.textContent = 'Generated: ' + now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) + ' | U.S. Apparel LLC - Confidential';

    window.print();
  };


  /* ================================================================
     9. WELCOME TOUR / ONBOARDING
     ================================================================ */

  const tourSteps = [
    {
      target: '#view-dashboard .kpi-grid',
      title: 'Dashboard Overview',
      text: 'Your command center at a glance. Key metrics like revenue, orders, and inventory levels are displayed here with real-time updates every 30 seconds.',
      position: 'bottom',
    },
    {
      target: '.nav-item[data-view="catalog"]',
      title: 'Product Catalog',
      text: 'Browse your complete B2B product catalog with grid and list views. Filter by category, sort by price or stock, and manage your inventory.',
      position: 'right',
    },
    {
      target: '.nav-item[data-view="orders"]',
      title: 'Order Management',
      text: 'Track all orders from pending to delivered. View order details, update statuses, and manage your fulfillment pipeline.',
      position: 'right',
    },
    {
      target: '.nav-item[data-view="inventory"]',
      title: 'Inventory Alerts',
      text: 'Monitor critical and low stock items in real-time. Get alerts before you run out and adjust stock levels quickly.',
      position: 'right',
    },
    {
      target: '.nav-item[data-view="reorder"]',
      title: 'AI Smart Reorder',
      text: 'AI-powered reorder predictions analyze customer patterns to forecast when they will order next. Send proactive reminders to boost sales.',
      position: 'right',
    },
    {
      target: '.nav-item[data-view="portal"]',
      title: 'Customer Portal',
      text: 'A self-service portal where your B2B customers can browse products, place orders, track shipments, and manage their account.',
      position: 'right',
    },
  ];

  let tourCurrentStep = 0;
  let tourOverlay = null;
  let tourHighlight = null;
  let tourTooltip = null;

  window.startTour = function () {
    tourCurrentStep = 0;

    // Create elements if not exists
    if (!tourOverlay) {
      tourOverlay = document.createElement('div');
      tourOverlay.className = 'tour-overlay';
      document.body.appendChild(tourOverlay);

      tourHighlight = document.createElement('div');
      tourHighlight.className = 'tour-highlight-ring';
      document.body.appendChild(tourHighlight);

      tourTooltip = document.createElement('div');
      tourTooltip.className = 'tour-tooltip';
      document.body.appendChild(tourTooltip);
    }

    tourOverlay.classList.add('visible');
    tourHighlight.style.display = 'block';
    tourTooltip.style.display = 'block';

    // Make sure we're on dashboard
    window.showView('dashboard');

    setTimeout(() => showTourStep(0), 300);

    localStorage.setItem('usa_tour_completed', 'true');
  };

  function showTourStep(step) {
    if (step < 0 || step >= tourSteps.length) {
      endTour();
      return;
    }

    tourCurrentStep = step;
    const s = tourSteps[step];
    const targetEl = document.querySelector(s.target);

    if (!targetEl) {
      // Skip if target not found
      if (step < tourSteps.length - 1) showTourStep(step + 1);
      else endTour();
      return;
    }

    // Position highlight ring
    const rect = targetEl.getBoundingClientRect();
    const pad = 8;
    tourHighlight.style.left = (rect.left - pad) + 'px';
    tourHighlight.style.top = (rect.top - pad) + 'px';
    tourHighlight.style.width = (rect.width + pad * 2) + 'px';
    tourHighlight.style.height = (rect.height + pad * 2) + 'px';

    // Build dots
    let dotsHTML = '';
    for (let i = 0; i < tourSteps.length; i++) {
      dotsHTML += '<div class="tour-dot ' + (i === step ? 'active' : '') + '"></div>';
    }

    // Build tooltip content
    tourTooltip.innerHTML = `
      <h4>${escHtml(s.title)}</h4>
      <p>${escHtml(s.text)}</p>
      <div class="tour-tooltip-footer">
        <div class="tour-dots">${dotsHTML}</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="tour-step-counter">${step + 1} of ${tourSteps.length}</span>
          <div class="tour-btns">
            <button class="tour-btn skip" onclick="window._tourAction('skip')">Skip</button>
            <button class="tour-btn next" onclick="window._tourAction('next')">
              ${step === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Position tooltip
    const ttWidth = 340;
    const ttHeight = tourTooltip.offsetHeight || 200;

    let ttLeft, ttTop;
    switch (s.position) {
      case 'right':
        ttLeft = rect.right + 20;
        ttTop = rect.top + (rect.height / 2) - (ttHeight / 2);
        break;
      case 'bottom':
        ttLeft = rect.left + (rect.width / 2) - (ttWidth / 2);
        ttTop = rect.bottom + 16;
        break;
      case 'left':
        ttLeft = rect.left - ttWidth - 20;
        ttTop = rect.top + (rect.height / 2) - (ttHeight / 2);
        break;
      case 'top':
        ttLeft = rect.left + (rect.width / 2) - (ttWidth / 2);
        ttTop = rect.top - ttHeight - 16;
        break;
      default:
        ttLeft = rect.right + 20;
        ttTop = rect.top;
    }

    // Keep within viewport
    ttLeft = Math.max(12, Math.min(ttLeft, window.innerWidth - ttWidth - 12));
    ttTop = Math.max(12, Math.min(ttTop, window.innerHeight - ttHeight - 12));

    tourTooltip.style.left = ttLeft + 'px';
    tourTooltip.style.top = ttTop + 'px';
    tourTooltip.style.width = ttWidth + 'px';
  }

  window._tourAction = function (action) {
    if (action === 'skip') {
      endTour();
    } else if (action === 'next') {
      if (tourCurrentStep < tourSteps.length - 1) {
        showTourStep(tourCurrentStep + 1);
      } else {
        endTour();
      }
    }
  };

  function endTour() {
    if (tourOverlay) tourOverlay.classList.remove('visible');
    if (tourHighlight) tourHighlight.style.display = 'none';
    if (tourTooltip) tourTooltip.style.display = 'none';
  }

  // Auto-show tour on first visit
  function checkFirstVisit() {
    if (!localStorage.getItem('usa_tour_completed')) {
      setTimeout(() => window.startTour(), 1500);
    }
  }


  /* ================================================================
     INITIALIZATION
     ================================================================ */

  function init() {
    injectAnalyticsView();
    initLiveClock();
    initAutoRefresh();
    initCommandPalette();
    initBreadcrumbs();
    applyInitialLoading();
    checkFirstVisit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
