/* ========================================
   SJC UBMS - Reports Module
   Report generation: revenue, sales, collections
   ======================================== */

const Reports = {
    render(container) {
        container.innerHTML = `
        <div class="section-header"><div><h2>Reports</h2><p>Generate and view business reports</p></div></div>

        <div class="tabs mb-3">
            <button class="tab-btn active" onclick="Reports.showReport('revenue')">Revenue Report</button>
            <button class="tab-btn" onclick="Reports.showReport('collections')">Collections</button>
            <button class="tab-btn" onclick="Reports.showReport('expenses')">Expense Report</button>
            <button class="tab-btn" onclick="Reports.showReport('company')">Company Summary</button>
        </div>

        <div id="reportContent"></div>`;
        this.showReport('revenue');
    },

    showReport(type) {
        const c = document.getElementById('reportContent');
        if (!c) return;
        document.querySelectorAll('.tabs .tab-btn').forEach((b, i) => {
            b.classList.toggle('active', ['revenue','collections','expenses','company'][i] === type);
        });
        switch (type) {
            case 'revenue': this.renderRevenue(c); break;
            case 'collections': this.renderCollections(c); break;
            case 'expenses': this.renderExpenses(c); break;
            case 'company': this.renderCompanySummary(c); break;
        }
    },

    renderRevenue(c) {
        const companies = Object.values(DataStore.companies);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        c.innerHTML = `
        <div class="card mb-3"><div class="card-body"><h3 class="mb-2">Monthly Revenue by Company</h3><div class="chart-container"><canvas id="revReportChart"></canvas></div></div></div>
        <div class="card"><div class="card-body no-padding">
            <div class="table-wrapper"><table class="table"><thead><tr><th>Company</th>${months.map(m=>`<th>${m}</th>`).join('')}<th>Total</th></tr></thead><tbody>
            ${companies.map(co => {
                const rev = (DataStore.monthlyRevenue || {})[co.id] || new Array(12).fill(0);
                const total = rev.reduce((a,b)=>a+b,0);
                return `<tr><td><strong>${Utils.escapeHtml(co.name)}</strong></td>${rev.map(v=>`<td>${Utils.formatNumber(v)}</td>`).join('')}<td><strong>${Utils.formatCurrency(total)}</strong></td></tr>`;
            }).join('')}
            </tbody></table></div>
        </div></div>`;

        if (typeof Chart !== 'undefined') {
            const ctx = document.getElementById('revReportChart');
            if (ctx) new Chart(ctx, { type: 'bar', data: { labels: months, datasets: companies.map(co => ({
                label: co.name, data: (DataStore.monthlyRevenue || {})[co.id] || new Array(12).fill(0),
                backgroundColor: co.color + '90', borderColor: co.color, borderWidth: 1
            }))}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }}, scales: { y: { beginAtZero: true }}}});
        }
    },

    renderCollections(c) {
        const invoices = DataStore.invoices || [];
        const company = App.currentCompany;
        const filtered = company ? invoices.filter(i => (i.companyId || i.company) === company) : invoices;
        const paid = filtered.filter(i => i.status === 'paid');
        const unpaid = filtered.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
        c.innerHTML = `
        <div class="grid-3 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div><div class="stat-value">${Utils.formatCurrency(paid.reduce((s,i)=>s+(i.amount||0),0))}</div><div class="stat-label">Collected (${paid.length})</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-clock"></i></div></div><div class="stat-value">${Utils.formatCurrency(unpaid.reduce((s,i)=>s+(i.amount||0),0))}</div><div class="stat-label">Outstanding (${unpaid.length})</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-percent"></i></div></div><div class="stat-value">${filtered.length>0?Math.round(paid.length/filtered.length*100):0}%</div><div class="stat-label">Collection Rate</div></div>
        </div>
        <div class="card"><div class="card-body no-padding">
            <h3 class="mb-2 card-section-title">Outstanding Invoices</h3>
            ${unpaid.length === 0 ? '<div class="empty-state"><i class="fas fa-check-double"></i><h3>All Collected</h3></div>' :
            Utils.buildTable([
                { label: 'Invoice', render: r => `<strong>${r.id}</strong>` },
                { label: 'Client', render: r => Utils.escapeHtml(r.client || '-') },
                { label: 'Amount', render: r => Utils.formatCurrency(r.amount) },
                { label: 'Due Date', render: r => Utils.formatDate(r.dueDate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], unpaid)}
        </div></div>`;
    },

    renderExpenses(c) {
        const expenses = DataStore.expenses || [];
        const company = App.currentCompany;
        const filtered = company ? expenses.filter(e => (e.companyId || e.company) === company) : expenses;
        const byCategory = {};
        filtered.forEach(e => { byCategory[e.category || 'Other'] = (byCategory[e.category || 'Other'] || 0) + (e.amount || 0); });
        const categories = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]);
        c.innerHTML = `
        <div class="grid-2 mb-3">
            <div class="card"><div class="card-body"><h3 class="mb-2">Expense Breakdown</h3><div class="chart-container"><canvas id="expPieChart"></canvas></div></div></div>
            <div class="card"><div class="card-body no-padding">
                <h3 class="mb-2 card-section-title">By Category</h3>
                <div class="table-wrapper"><table class="table"><thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead><tbody>
                ${categories.map(cat => {
                    const total = filtered.reduce((s,e)=>s+(e.amount||0),0);
                    return `<tr><td>${cat}</td><td>${Utils.formatCurrency(byCategory[cat])}</td><td>${total>0?Math.round(byCategory[cat]/total*100):0}%</td></tr>`;
                }).join('')}
                </tbody></table></div>
            </div></div>
        </div>`;

        if (typeof Chart !== 'undefined' && categories.length > 0) {
            const colors = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316'];
            const ctx = document.getElementById('expPieChart');
            if (ctx) new Chart(ctx, { type: 'doughnut', data: { labels: categories, datasets: [{ data: categories.map(c => byCategory[c]), backgroundColor: colors.slice(0, categories.length) }]}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }}}});
        }
    },

    renderCompanySummary(c) {
        const companies = Object.values(DataStore.companies);
        c.innerHTML = `
        <div class="grid-3">
            ${companies.map(co => {
                const summary = DataStore.getCompanySummary(co.id);
                const rev = ((DataStore.monthlyRevenue || {})[co.id] || []).reduce((a,b) => a+b, 0);
                return `
                <div class="card" data-company="${co.id}"><div class="card-body">
                    <div class="co-summary-header">
                        <div class="co-summary-icon" style="background:${co.color}"><i class="fas fa-${co.icon}"></i></div>
                        <div><h4 class="co-summary-name">${Utils.escapeHtml(co.name)}</h4><span class="co-summary-type">${co.type}</span></div>
                    </div>
                    <div class="co-summary-revenue">${Utils.formatCurrency(rev)}</div>
                    <div class="co-summary-label">Annual Revenue</div>
                    ${summary ? `<div class="co-summary-details">${Object.entries(summary).map(([k,v])=>`<div>${k}: <strong>${v}</strong></div>`).join('')}</div>` : ''}
                </div></div>`;
            }).join('')}
        </div>`;
    }
};
