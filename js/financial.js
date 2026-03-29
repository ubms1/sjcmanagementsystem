/* ========================================
   SJC UBMS - Financial Module
   Financial overview, income/expense tracking
   ======================================== */

const Financial = {
    render(container) {
        const company = App.currentCompany;
        const invoices = (DataStore.invoices || []).filter(i => !company || (i.companyId || i.company) === company);
        const expenses = (DataStore.expenses || []).filter(e => !company || (e.companyId || e.company) === company);
        const totalIncome = invoices.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const netIncome = totalIncome - totalExpenses;
        const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
        const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.amount || 0), 0);

        container.innerHTML = `
        <div class="section-header"><div><h2>Financial Overview</h2><p>Income, expenses, and cash flow tracking</p></div>
            <div class="btn-group">
                <button class="btn btn-secondary" onclick="Excel.openExportDialog(['invoices','expenses'],'Export Financial Data')"><i class="fas fa-file-excel"></i> Export</button>
                <button class="btn btn-secondary" onclick="Financial.printSummary()"><i class="fas fa-print"></i> Print Summary</button>
            </div>
        </div>

        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-arrow-up"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalIncome)}</div><div class="stat-label">Total Income</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-arrow-down"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalExpenses)}</div><div class="stat-label">Total Expenses</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon ${netIncome>=0?'blue':'red'}"><i class="fas fa-balance-scale"></i></div></div><div class="stat-value">${Utils.formatCurrency(netIncome)}</div><div class="stat-label">Net Income</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-clock"></i></div></div><div class="stat-value">${Utils.formatCurrency(unpaid)}</div><div class="stat-label">Receivables</div></div>
        </div>

        <div class="grid-2 mb-3">
            <div class="card"><div class="card-body"><h3 class="mb-2"><i class="fas fa-chart-line text-primary"></i> Revenue Trend</h3><div class="chart-container"><canvas id="revenueChart"></canvas></div></div></div>
            <div class="card"><div class="card-body"><h3 class="mb-2"><i class="fas fa-chart-pie text-primary"></i> Income vs Expenses</h3><div class="chart-container"><canvas id="incExpChart"></canvas></div></div></div>
        </div>

        <div class="tabs mb-3">
            <button class="tab-btn active" onclick="Financial.switchTab(this,'incomeTab')">Income</button>
            <button class="tab-btn" onclick="Financial.switchTab(this,'expenseTab')">Expenses</button>
        </div>

        <div id="incomeTab">
            <div class="card"><div class="card-body no-padding">
                ${Utils.buildTable([
                    { label: 'Invoice', render: r => `<strong>${r.id}</strong>` },
                    { label: 'Client', render: r => Utils.escapeHtml(r.client || '-') },
                    { label: 'Description', render: r => Utils.escapeHtml(r.description || '-') },
                    { label: 'Amount', render: r => `<span class="text-success">${Utils.formatCurrency(r.amount)}</span>` },
                    { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                    { label: 'Date', render: r => Utils.formatDate(r.date) }
                ], invoices)}
            </div></div>
        </div>

        <div id="expenseTab" class="hidden">
            <div class="section-header mb-2"><div></div><button class="btn btn-primary" onclick="Financial.addExpense()"><i class="fas fa-plus"></i> Add Expense</button></div>
            <div class="card"><div class="card-body no-padding">
                ${expenses.length === 0 ? '<div class="empty-state"><i class="fas fa-receipt"></i><h3>No Expenses</h3></div>' :
                Utils.buildTable([
                    { label: 'ID', render: r => `<strong>${r.id}</strong>` },
                    { label: 'Category', render: r => `<span class="badge-tag badge-neutral">${r.category||'-'}</span>` },
                    { label: 'Description', render: r => Utils.escapeHtml(r.description || '-') },
                    { label: 'Amount', render: r => `<span class="text-danger">${Utils.formatCurrency(r.amount)}</span>` },
                    { label: 'Vendor', render: r => Utils.escapeHtml(r.vendor || '-') },
                    { label: 'Date', render: r => Utils.formatDate(r.date) }
                ], expenses)}
            </div></div>
        </div>`;

        this.initCharts(invoices, expenses);
    },

    switchTab(btn, tabId) {
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['incomeTab','expenseTab'].forEach(t => { const el = document.getElementById(t); if (el) el.classList.toggle('hidden', t !== tabId); });
    },

    initCharts(invoices, expenses) {
        if (typeof Chart === 'undefined') return;
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthly = new Array(12).fill(0);
        const monthlyExp = new Array(12).fill(0);
        invoices.forEach(i => { const m = new Date(i.date).getMonth(); if (!isNaN(m)) monthly[m] += i.amount || 0; });
        expenses.forEach(e => { const m = new Date(e.date).getMonth(); if (!isNaN(m)) monthlyExp[m] += e.amount || 0; });

        const revCtx = document.getElementById('revenueChart');
        if (revCtx) new Chart(revCtx, { type: 'line', data: { labels: months, datasets: [
            { label: 'Income', data: monthly, borderColor: '#10b981', backgroundColor: '#10b98120', tension: .3, fill: true },
            { label: 'Expenses', data: monthlyExp, borderColor: '#ef4444', backgroundColor: '#ef444420', tension: .3, fill: true }
        ]}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }}}});

        const pieCtx = document.getElementById('incExpChart');
        const totInc = invoices.reduce((s,i)=>s+(i.amount||0),0);
        const totExp = expenses.reduce((s,e)=>s+(e.amount||0),0);
        if (pieCtx) new Chart(pieCtx, { type: 'doughnut', data: { labels: ['Income','Expenses'], datasets: [{ data: [totInc, totExp], backgroundColor: ['#10b981','#ef4444'] }]}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }}}});
    },

    addExpense() {
        App.showModal('Add Expense', `
            <div class="grid-2">
                <div class="form-group"><label>Category</label><select class="form-input" id="expCat"><option>Materials</option><option>Labor</option><option>Equipment</option><option>Fuel</option><option>Utilities</option><option>Rent</option><option>Office Supplies</option><option>Professional Fees</option><option>Other</option></select></div>
                <div class="form-group"><label>Amount (₱)</label><input type="number" class="form-input" id="expAmt" min="0" step="0.01" required></div>
                <div class="form-group"><label>Vendor/Payee</label><input type="text" class="form-input" id="expVendor"></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="expDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="expDesc" rows="2"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Financial.saveExpense()">Save</button>`
        );
    },

    saveExpense() {
        const amt = parseFloat(document.getElementById('expAmt')?.value);
        if (!amt || amt <= 0) { App.showToast('Valid amount required', 'error'); return; }
        DataStore.expenses.push({
            id: Utils.generateId('EXP'),
            companyId: App.currentCompany || 'sjc',
            category: document.getElementById('expCat')?.value || 'Other',
            amount: amt,
            vendor: document.getElementById('expVendor')?.value?.trim() || '',
            date: document.getElementById('expDate')?.value || new Date().toISOString().split('T')[0],
            description: document.getElementById('expDesc')?.value?.trim() || ''
        });
        Database.save(); App.closeModal(); App.showToast('Expense recorded');
        this.render(document.getElementById('mainContent'));
    },

    printSummary() {
        const company = App.currentCompany;
        const invoices = (DataStore.invoices || []).filter(i => !company || (i.companyId || i.company) === company);
        const expenses = (DataStore.expenses || []).filter(e => !company || (e.companyId || e.company) === company);
        const totalIncome = invoices.reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const html = `
<style>body{font-family:Arial,sans-serif;padding:30px} h2{color:#1a3a6b} table{width:100%;border-collapse:collapse;margin:16px 0} th{background:#1a3a6b;color:#fff;padding:8px 10px;text-align:left} td{padding:7px 10px;border-bottom:1px solid #eee} .summary{display:flex;gap:24px;margin-bottom:20px} .box{flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center} .box .val{font-size:22px;font-weight:700} .green{color:#059669} .red{color:#dc2626}</style>
<h2>Financial Summary</h2><p>As of ${new Date().toLocaleDateString('en-PH')}</p>
<div class="summary">
  <div class="box"><div class="val green">${Utils.formatCurrency(totalIncome)}</div><div>Total Income</div></div>
  <div class="box"><div class="val red">${Utils.formatCurrency(totalExpenses)}</div><div>Total Expenses</div></div>
  <div class="box"><div class="val ${totalIncome-totalExpenses>=0?'green':'red'}">${Utils.formatCurrency(totalIncome-totalExpenses)}</div><div>Net</div></div>
</div>
<h3>Invoices</h3>
<table><thead><tr><th>#</th><th>Client</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>
  ${invoices.map(r=>`<tr><td>${r.id}</td><td>${Utils.escapeHtml(r.client||'-')}</td><td>${Utils.formatCurrency(r.amount)}</td><td>${r.status}</td><td>${Utils.formatDate(r.date)}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center">No invoices</td></tr>'}
</tbody></table>
<h3>Expenses</h3>
<table><thead><tr><th>#</th><th>Category</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead><tbody>
  ${expenses.map(r=>`<tr><td>${r.id}</td><td>${Utils.escapeHtml(r.category||'-')}</td><td>${Utils.escapeHtml(r.description||'-')}</td><td>${Utils.formatCurrency(r.amount)}</td><td>${Utils.formatDate(r.date)}</td></tr>`).join('')||'<tr><td colspan="5" style="text-align:center">No expenses</td></tr>'}
</tbody></table>`;
        Utils.printPreview(html, 'Financial Summary');
    }
};
