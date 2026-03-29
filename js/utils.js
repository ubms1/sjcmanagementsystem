/* ========================================
   SJC UBMS - Utilities
   Format, helpers, and common functions
   ======================================== */

const Utils = {
    formatCurrency(amount, compact = false) {
        if (amount === null || amount === undefined) return '₱0.00';
        if (compact && Math.abs(amount) >= 1e6) return '₱' + (amount / 1e6).toFixed(1) + 'M';
        if (compact && Math.abs(amount) >= 1e3) return '₱' + (amount / 1e3).toFixed(1) + 'K';
        return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toLocaleString('en-PH');
    },

    formatPercent(num) { return (num || 0).toFixed(1) + '%'; },

    formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    formatTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    },

    formatRelative(dateStr) {
        if (!dateStr) return '-';
        const diff = new Date() - new Date(dateStr);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return Utils.formatDate(dateStr);
    },

    generateId(prefix = 'ID') {
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
    },

    escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    getStatusClass(status) {
        const map = {
            'active': 'badge-success', 'completed': 'badge-success', 'paid': 'badge-success', 'passed': 'badge-success',
            'in-progress': 'badge-info', 'ongoing': 'badge-info', 'enrolled': 'badge-info', 'occupied': 'badge-info',
            'pending': 'badge-warning', 'partial': 'badge-warning', 'scheduled': 'badge-warning',
            'overdue': 'badge-danger', 'failed': 'badge-danger', 'cancelled': 'badge-danger', 'expired': 'badge-danger', 'vacant': 'badge-neutral',
            'available': 'badge-success', 'rented': 'badge-info', 'maintenance': 'badge-warning'
        };
        return map[status] || 'badge-neutral';
    },

    getCompanyName(id) {
        return DataStore.companies[id]?.name || id;
    },

    getCompanyColor(id) {
        return DataStore.companies[id]?.color || '#64748b';
    },

    storage: {
        get(key, fallback = null) {
            try { const v = localStorage.getItem('sjc_' + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
        },
        set(key, value) {
            try { localStorage.setItem('sjc_' + key, JSON.stringify(value)); } catch { }
        }
    },

    buildTable(columns, rows, options = {}) {
        if (rows.length === 0) {
            return '<div class="empty-state"><i class="fas fa-inbox"></i><h3>No Records</h3><p>No data to display.</p></div>';
        }
        let html = '<div class="table-wrapper"><table class="data-table"><thead><tr>';
        columns.forEach(c => { html += `<th>${c.label}</th>`; });
        if (options.actions) html += '<th class="col-action">Actions</th>';
        html += '</tr></thead><tbody>';
        rows.forEach(r => {
            html += '<tr>';
            columns.forEach(c => { html += `<td>${c.render(r)}</td>`; });
            if (options.actions) html += `<td>${options.actions(r)}</td>`;
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        return html;
    },

    today() { return new Date().toISOString().split('T')[0]; },

    randomFromArray(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    debounce(fn, ms = 300) {
        let timer;
        return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
    },

    loadFromStorage(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },

    saveToStorage(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
    },

    // ── Universal print / preview ───────────────────────────────────
    printPreview(html, title = 'SJC UBMS', landscape = false) {
        const w = window.open('', '_blank', 'width=900,height=700');
        w.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><title>${Utils.escapeHtml(title)}</title>
<style>
  @page { size: ${landscape ? 'A4 landscape' : 'A4 portrait'}; margin: 15mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #222; margin: 0; padding: 20px; }
  h1, h2, h3 { margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f4ff; font-weight: 700; }
  tfoot tr { font-weight: 700; background: #f8f8f8; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 16px; }
  .header-title { font-size: 18px; font-weight: 700; }
  .header-sub { font-size: 12px; color: #555; margin-top: 4px; }
  .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; }
  @media print { body { padding: 0; } }
</style>
</head><body>${html}<script>window.onload=function(){window.print();}<\/script></body></html>`);
        w.document.close();
    },

    // ── Print a DataStore array as a formatted table ────────────────
    printTable(data, columns, title, subtitle = '') {
        if (!data || data.length === 0) { App.showToast('No data to print.', 'info'); return; }
        const headerHtml = `
            <div class="header">
                <div>
                    <div class="header-title">${Utils.escapeHtml(title)}</div>
                    <div class="header-sub">${Utils.escapeHtml(subtitle)}</div>
                </div>
                <div style="text-align:right;font-size:11px;color:#555">
                    Printed: ${new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}<br>
                    By: ${Auth.getName()}
                </div>
            </div>`;
        const isWide = columns.length > 8;
        const thead = columns.map(c => `<th>${Utils.escapeHtml(c.label)}</th>`).join('');
        const tbody = data.map(r => `<tr>${columns.map(c => `<td>${c.print ? c.print(r) : Utils.escapeHtml(String(r[c.key] || ''))}</td>`).join('')}</tr>`).join('');
        const html = `${headerHtml}<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
            <div class="footer"><span>SJC Unified Business Management System</span><span>Page 1</span></div>`;
        this.printPreview(html, title, isWide);
    }
};
