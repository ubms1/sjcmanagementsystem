/* ========================================
   SJC UBMS - Financial Analysis Module
   Advanced financial analysis with charts
   ======================================== */

const FinancialAnalysis = {
    render(container) {
        const companies = Object.values(DataStore.companies);
        const invoices = DataStore.invoices || [];
        const expenses = DataStore.expenses || [];
        const company = App.currentCompany;
        const filtInv = company ? invoices.filter(i => (i.companyId || i.company) === company) : invoices;
        const filtExp = company ? expenses.filter(e => (e.companyId || e.company) === company) : expenses;
        const totalRev = filtInv.reduce((s,i) => s + (i.amount||0), 0);
        const totalExp = filtExp.reduce((s,e) => s + (e.amount||0), 0);
        const margin = totalRev > 0 ? ((totalRev - totalExp) / totalRev * 100).toFixed(1) : 0;
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        container.innerHTML = `
        <div class="section-header"><div><h2>Financial Analysis</h2><p>Advanced analytics, trends, and projections</p></div></div>

        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-hand-holding-usd"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalRev)}</div><div class="stat-label">Total Revenue</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-credit-card"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalExp)}</div><div class="stat-label">Total Expenses</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-chart-line"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalRev - totalExp)}</div><div class="stat-label">Net Profit</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-percentage"></i></div></div><div class="stat-value">${margin}%</div><div class="stat-label">Profit Margin</div></div>
        </div>

        <div class="grid-2 mb-3">
            <div class="card"><div class="card-body"><h3 class="mb-2">Profit & Loss Trend</h3><div class="chart-container"><canvas id="plChart"></canvas></div></div></div>
            <div class="card"><div class="card-body"><h3 class="mb-2">Revenue by Company</h3><div class="chart-container"><canvas id="revByCoChart"></canvas></div></div></div>
        </div>

        <div class="grid-2 mb-3">
            <div class="card"><div class="card-body"><h3 class="mb-2">Cash Flow Projection</h3><div class="chart-container"><canvas id="cashFlowChart"></canvas></div></div></div>
            <div class="card"><div class="card-body"><h3 class="mb-2">Expense Trend</h3><div class="chart-container"><canvas id="expTrendChart"></canvas></div></div></div>
        </div>

        <div class="card mb-3"><div class="card-body">
            <h3 class="mb-2">Profitability by Company</h3>
            <div class="card-body no-padding">
                <div class="table-wrapper"><table class="table"><thead><tr><th>Company</th><th>Revenue</th><th>Expenses</th><th>Profit</th><th>Margin</th><th>Trend</th></tr></thead><tbody>
                ${companies.map(co => {
                    const coRev = invoices.filter(i=>(i.companyId||i.company)===co.id).reduce((s,i)=>s+(i.amount||0),0);
                    const coExp = expenses.filter(e=>(e.companyId||e.company)===co.id).reduce((s,e)=>s+(e.amount||0),0);
                    const profit = coRev - coExp;
                    const mg = coRev > 0 ? (profit/coRev*100).toFixed(1) : 0;
                    return `<tr>
                        <td><span class="color-dot" style="background:${co.color}"></span><strong>${Utils.escapeHtml(co.name)}</strong></td>
                        <td class="text-success">${Utils.formatCurrency(coRev)}</td>
                        <td class="text-danger">${Utils.formatCurrency(coExp)}</td>
                        <td class="fw-bold ${profit>=0?'text-success':'text-danger'}">${Utils.formatCurrency(profit)}</td>
                        <td>${mg}%</td>
                        <td><div class="mini-bar"><div class="mini-bar-fill" style="width:${Math.min(100,Math.max(0,mg))}%;background:${profit>=0?'var(--success)':'var(--danger)'}"></div></div></td>
                    </tr>`;
                }).join('')}
                </tbody></table></div>
            </div>
        </div></div>`;

        this.initCharts(companies, invoices, expenses, months);
    },

    initCharts(companies, invoices, expenses, months) {
        if (typeof Chart === 'undefined') return;
        const monthlyInc = new Array(12).fill(0);
        const monthlyExp = new Array(12).fill(0);
        invoices.forEach(i => { const m = new Date(i.date).getMonth(); if (!isNaN(m)) monthlyInc[m] += i.amount||0; });
        expenses.forEach(e => { const m = new Date(e.date).getMonth(); if (!isNaN(m)) monthlyExp[m] += e.amount||0; });
        const profit = monthlyInc.map((v,i) => v - monthlyExp[i]);

        const plCtx = document.getElementById('plChart');
        if (plCtx) new Chart(plCtx, { type: 'bar', data: { labels: months, datasets: [
            { label: 'Revenue', data: monthlyInc, backgroundColor: '#10b98180' },
            { label: 'Expenses', data: monthlyExp, backgroundColor: '#ef444480' },
            { type: 'line', label: 'Profit', data: profit, borderColor: '#3b82f6', backgroundColor: '#3b82f620', tension: .3, fill: false }
        ]}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }}}});

        const coData = companies.map(co => ((DataStore.monthlyRevenue||{})[co.id]||[]).reduce((a,b)=>a+b,0));
        const revCtx = document.getElementById('revByCoChart');
        if (revCtx) new Chart(revCtx, { type: 'doughnut', data: { labels: companies.map(c=>c.name), datasets: [{ data: coData, backgroundColor: companies.map(c=>c.color) }]}, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' }}}});

        const cumulative = []; let running = 0;
        monthlyInc.forEach((v,i) => { running += v - monthlyExp[i]; cumulative.push(running); });
        const cfCtx = document.getElementById('cashFlowChart');
        if (cfCtx) new Chart(cfCtx, { type: 'line', data: { labels: months, datasets: [{ label: 'Cumulative Cash Flow', data: cumulative, borderColor: '#8b5cf6', backgroundColor: '#8b5cf620', tension: .4, fill: true }]}, options: { responsive: true, maintainAspectRatio: false }});

        const etCtx = document.getElementById('expTrendChart');
        if (etCtx) new Chart(etCtx, { type: 'line', data: { labels: months, datasets: [{ label: 'Monthly Expenses', data: monthlyExp, borderColor: '#ef4444', backgroundColor: '#ef444420', tension: .3, fill: true }]}, options: { responsive: true, maintainAspectRatio: false }});
    }
};
