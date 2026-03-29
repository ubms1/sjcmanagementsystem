/* ========================================
   SJC UBMS — Notifications System
   Real-time via StorageEvent + polling
   ======================================== */

const Notifications = {
    STORE_KEY: 'sjc_ubms_notifications',
    panelOpen: false,
    _pollTimer: null,
    _lastChecked: Date.now(),

    /* ── Bootstrap ───────────────────────────────── */
    init() {
        this._loadFromStorage();
        this._updateBadge();
        // Real-time cross-tab: fires whenever another tab writes to localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORE_KEY || e.key === 'sjc_ubms_database') {
                this._loadFromStorage();
                this._updateBadge();
                if (this.panelOpen) this._renderList();
                // If DB changed in another tab, check for new alerts
                if (e.key === 'sjc_ubms_database') this._checkAlerts();
            }
        });
        // Same-tab polling — check for new alerts every 30 s
        this._pollTimer = setInterval(() => this._checkAlerts(), 30000);
        // Initial alert check after a short delay (lets DB.init() finish)
        setTimeout(() => this._checkAlerts(), 2000);
    },

    /* ── Internal storage ───────────────────────── */
    _data: [],   // { id, title, desc, icon, color, time, read, module }

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.STORE_KEY);
            this._data = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(this._data)) this._data = [];
        } catch { this._data = []; }
    },

    _saveToStorage() {
        try { localStorage.setItem(this.STORE_KEY, JSON.stringify(this._data)); } catch {}
    },

    /* ── Public API ──────────────────────────────── */
    /**
     * Push a new notification. Deduplicates by id.
     * @param {object} n  { id?, title, desc, icon?, color?, module? }
     */
    push(n) {
        if (!n || !n.title) return;
        const id = n.id || `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2,4)}`;
        // Avoid duplicate system alerts within an hour
        if (n.id && this._data.find(x => x.id === n.id && Date.now() - new Date(x.time).getTime() < 3600000)) return;
        const item = {
            id,
            title: n.title,
            desc: n.desc || '',
            icon: n.icon || 'fa-info-circle',
            color: n.color || 'blue',
            time: new Date().toISOString(),
            read: false,
            module: n.module || ''
        };
        this._data.unshift(item);
        // Keep last 80 notifications max
        if (this._data.length > 80) this._data = this._data.slice(0, 80);
        this._saveToStorage();
        this._updateBadge();
        if (this.panelOpen) this._renderList();
        // Also show a toast for high-priority (color = red / orange)
        if (n.color === 'red') App?.showToast(n.title, 'error');
        else if (n.color === 'orange') App?.showToast(n.title, 'warning');
    },

    markAllRead() {
        this._data.forEach(n => n.read = true);
        this._saveToStorage();
        this._updateBadge();
        this._renderList();
    },

    markRead(id) {
        const n = this._data.find(x => x.id === id);
        if (n) { n.read = true; this._saveToStorage(); this._updateBadge(); }
    },

    /* ── Panel UI ──────────────────────────────── */
    togglePanel() {
        this.panelOpen ? this.closePanel() : this.openPanel();
    },

    openPanel() {
        this.panelOpen = true;
        this._renderList();
        document.getElementById('notificationPanel')?.classList.add('open');
        document.getElementById('notifOverlay')?.classList.add('show');
    },

    closePanel() {
        this.panelOpen = false;
        document.getElementById('notificationPanel')?.classList.remove('open');
        document.getElementById('notifOverlay')?.classList.remove('show');
    },

    _renderList() {
        const list = document.getElementById('notifList');
        if (!list) return;
        if (this._data.length === 0) {
            list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
            return;
        }
        list.innerHTML = this._data.slice(0, 60).map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Notifications._onClickItem('${n.id}')">
                <div class="notif-icon ${n.color}"><i class="fas ${n.icon}"></i></div>
                <div class="notif-content">
                    <div class="notif-title">${_escHtml(n.title)}</div>
                    ${n.desc ? `<div class="notif-desc">${_escHtml(n.desc)}</div>` : ''}
                    <div class="notif-time">${_relTime(n.time)}</div>
                </div>
            </div>`).join('');
    },

    _onClickItem(id) {
        this.markRead(id);
        const n = this._data.find(x => x.id === id);
        if (n?.module) { App?.navigate(n.module); this.closePanel(); }
        else { this._renderList(); }
    },

    _updateBadge() {
        const unread = this._data.filter(n => !n.read).length;
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = unread > 99 ? '99+' : String(unread);
            badge.classList.toggle('hidden', unread === 0);
        }
    },

    /* ── Auto alert generation ─────────────────── */
    _checkAlerts() {
        if (typeof DataStore === 'undefined') return;
        const now = new Date();

        // 1 — Overdue invoices
        (DataStore.invoices || []).forEach(inv => {
            if (inv.status === 'unpaid' && inv.dueDate && new Date(inv.dueDate) < now) {
                this.push({
                    id: `overdue-inv-${inv.id}`,
                    title: 'Overdue Invoice',
                    desc: `${inv.id} — ${inv.client || inv.customer || ''} — ₱${(inv.amount||0).toLocaleString()}`,
                    icon: 'fa-file-invoice-dollar', color: 'red', module: 'invoicing'
                });
            }
        });

        // 2 — Low aggregate stock
        (DataStore.aggregateProducts || []).forEach(p => {
            if ((p.stock || 0) < 50) {
                this.push({
                    id: `low-stock-${p.id}`,
                    title: 'Low Stock Alert',
                    desc: `${p.name} — ${(p.stock||0)} ${p.unit} remaining`,
                    icon: 'fa-mountain', color: 'orange', module: 'quarry-products'
                });
            }
        });

        // 3 — Test orders in-progress > 7 days
        (DataStore.testOrders || []).forEach(o => {
            if (['in-progress','pending'].includes(o.status) && o.createdAt) {
                const days = (now - new Date(o.createdAt)) / 86400000;
                if (days > 7) {
                    this.push({
                        id: `test-delay-${o.id}`,
                        title: 'Test Order Delayed',
                        desc: `Order ${o.id} has been pending for ${Math.floor(days)} days`,
                        icon: 'fa-flask', color: 'orange', module: 'test-orders'
                    });
                }
            }
        });

        // 4 — Lease expiry within 30 days
        (DataStore.leaseContracts || []).forEach(l => {
            if (l.endDate && l.status !== 'expired') {
                const daysLeft = (new Date(l.endDate) - now) / 86400000;
                if (daysLeft >= 0 && daysLeft <= 30) {
                    this.push({
                        id: `lease-exp-${l.id}`,
                        title: 'Lease Expiring Soon',
                        desc: `Lease ${l.id} expires in ${Math.ceil(daysLeft)} day(s)`,
                        icon: 'fa-file-contract', color: 'orange', module: 'leases'
                    });
                }
            }
        });

        // 5 — Project overdue (endDate passed, status not completed)
        (DataStore.projects || []).forEach(p => {
            if (p.endDate && p.status !== 'completed' && new Date(p.endDate) < now) {
                this.push({
                    id: `proj-overdue-${p.id}`,
                    title: 'Project Overdue',
                    desc: `${p.name} was due ${Utils?.formatDate(p.endDate) || p.endDate}`,
                    icon: 'fa-hard-hat', color: 'red', module: 'project-monitoring'
                });
            }
        });

        // 6 — Payroll not yet run this month
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        const hasPayslipThisMonth = (DataStore.payslips || []).some(ps => (ps.period || ps.month || '').startsWith(thisMonth));
        if (!hasPayslipThisMonth && now.getDate() >= 20) {
            this.push({
                id: `payroll-${thisMonth}`,
                title: 'Payroll Reminder',
                desc: `Payroll for ${thisMonth} has not been processed yet`,
                icon: 'fa-wallet', color: 'blue', module: 'payroll'
            });
        }

        this._updateBadge();
        if (this.panelOpen) this._renderList();
    }
};

/* ── Local helpers (not polluting global scope) ── */
function _escHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _relTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}
