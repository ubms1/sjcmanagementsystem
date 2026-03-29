/* ========================================
   SJC UBMS - Dashboard Module
   Group overview with per-company KPIs
   ======================================== */

const Dashboard = {
    render(container) {
        const company = App.activeCompany;
        const isAll = company === 'all';

        let html = '';
        if (isAll) {
            html = this.renderGroupDashboard();
        } else {
            const type = DataStore.companies[company]?.type;
            switch (type) {
                case 'construction': html = this.renderConstructionDashboard(company); break;
                case 'subdivision': html = this.renderSubdivisionDashboard(); break;
                case 'commercial': html = this.renderCommercialDashboard(); break;
                case 'quarry': html = this.renderQuarryDashboard(); break;
                case 'driving_school': html = this.renderDrivingSchoolDashboard(); break;
                case 'testing_lab': html = this.renderTestingLabDashboard(); break;
                default: html = this.renderGroupDashboard();
            }
        }

        container.innerHTML = html;
        this.initCharts();
    },

    renderGroupDashboard() {
        const summary = DataStore.getFinancialSummary('all');
        const companies = Object.keys(DataStore.companies);

        return `
        <div class="welcome-card mb-3">
            <div class="welcome-card-body">
                <div>
                    <h2 class="welcome-title">Welcome back, ${Auth.getName()}</h2>
                    <p class="welcome-subtitle">Consolidated business overview — ${new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div class="welcome-income">
                    <div class="welcome-income-label">Group Net Income</div>
                    <div class="welcome-income-value">${Utils.formatCurrency(summary.netIncome, true)}</div>
                </div>
            </div>
        </div>

        <div class="grid-3 mb-3">
            ${companies.map(id => this.renderCompanyCard(id)).join('')}
        </div>

        <div class="grid-2 mb-3">
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-chart-line text-teal"></i>Revenue Trend (12 Months)</h3></div>
                <div class="card-body"><div class="chart-container"><canvas id="revenueChart"></canvas></div></div>
            </div>
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-chart-pie text-teal"></i>Revenue by Business</h3></div>
                <div class="card-body"><div class="chart-container"><canvas id="companyPieChart"></canvas></div></div>
            </div>
        </div>

        <div class="grid-4 mb-3">
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon teal"><i class="fas fa-peso-sign"></i></div></div>
                <div class="stat-value">${Utils.formatCurrency(summary.totalRevenue, true)}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon orange"><i class="fas fa-clock"></i></div></div>
                <div class="stat-value">${Utils.formatCurrency(summary.totalReceivable, true)}</div>
                <div class="stat-label">Accounts Receivable</div>
            </div>
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon red"><i class="fas fa-file-invoice-dollar"></i></div></div>
                <div class="stat-value">${Utils.formatCurrency(summary.totalExpenses, true)}</div>
                <div class="stat-label">Total Expenses</div>
            </div>
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon blue"><i class="fas fa-file-alt"></i></div></div>
                <div class="stat-value">${summary.invoiceCount}</div>
                <div class="stat-label">Invoices (${summary.paidInvoices} Paid)</div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-stream text-teal"></i>Recent Activity</h3></div>
                <div class="card-body">
                    <ul class="activity-feed">
                        ${DataStore.activityLog.slice(0, 8).map(a => `
                            <li class="activity-item">
                                <div class="activity-dot ${a.type === 'success' ? 'green' : a.type === 'warning' ? 'orange' : a.type === 'danger' ? 'red' : 'blue'}"></div>
                                <div class="activity-text">${a.message} <span class="badge-tag badge-neutral">${Utils.getCompanyName(a.company).split(' ')[0]}</span></div>
                                <span class="activity-time">${Utils.formatRelative(a.time)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-exclamation-circle text-danger"></i>Items Needing Attention</h3></div>
                <div class="card-body">${this.renderAlerts()}</div>
            </div>
        </div>`;
    },

    renderCompanyCard(companyId) {
        const summary = DataStore.getCompanySummary(companyId);
        const co = summary.company;
        return `
        <div class="stat-card clickable" data-company="${companyId}" onclick="App.switchCompany('${companyId}');document.getElementById('activeCompany').value='${companyId}'">
            <div class="stat-header">
                <div class="flex-gap">
                    <img src="${co.logo}" alt="${co.name}" class="logo-round-sm" onerror="this.style.display='none'">
                    <span class="badge-tag" style="background:${co.color}15;color:${co.color}">${co.type.replace('_',' ')}</span>
                </div>
            </div>
            <h4 class="company-card-name">${co.name}</h4>
            <div class="company-card-metrics">
                <div>
                    <div class="company-card-metric-label">Revenue</div>
                    <div class="company-card-metric-value">${Utils.formatCurrency(summary.totalRevenue, true)}</div>
                </div>
                <div>
                    <div class="company-card-metric-label">${summary.metricLabel || 'Metric'}</div>
                    <div class="company-card-metric-value">${summary.metricValue || 0}</div>
                </div>
            </div>
        </div>`;
    },

    renderConstructionDashboard(company) {
        const projs = DataStore.projects.filter(p => p.company === company);
        const active = projs.filter(p => p.status === 'in-progress');
        const summary = DataStore.getFinancialSummary(company);
        return `
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-hard-hat"></i></div></div><div class="stat-value">${projs.length}</div><div class="stat-label">Total Projects</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-spinner"></i></div></div><div class="stat-value">${active.length}</div><div class="stat-label">Active Projects</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(summary.totalRevenue, true)}</div><div class="stat-label">Revenue</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-chart-line"></i></div></div><div class="stat-value">${Utils.formatCurrency(summary.netIncome, true)}</div><div class="stat-label">Net Income</div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Active Projects</h3></div><div class="card-body">
            ${active.length === 0 ? '<div class="empty-state"><i class="fas fa-hard-hat"></i><h3>No Active Projects</h3></div>' :
            active.map(p => `<div class="project-progress-row">
                <div class="project-progress-info"><strong>${p.name}</strong><div class="text-muted text-sm">${p.location || ''}</div></div>
                <div class="project-progress-bar"><div class="progress-track"><div class="progress-bar"><div class="progress-fill ${p.progress > 50 ? 'blue' : 'orange'}" style="width:${p.progress}%"></div></div></div><span class="project-progress-pct">${p.progress}%</span></div>
            </div>`).join('')}
        </div></div>`;
    },

    renderSubdivisionDashboard() {
        const lots = DataStore.lots;
        const sold = lots.filter(l => l.status === 'sold');
        const available = lots.filter(l => l.status === 'available');
        const reserved = lots.filter(l => l.status === 'reserved');
        return `
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-map"></i></div></div><div class="stat-value">${lots.length}</div><div class="stat-label">Total Lots</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div><div class="stat-value">${sold.length}</div><div class="stat-label">Sold</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-clock"></i></div></div><div class="stat-value">${reserved.length}</div><div class="stat-label">Reserved</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-tag"></i></div></div><div class="stat-value">${available.length}</div><div class="stat-label">Available</div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Lot Inventory</h3></div><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'Lot ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Block/Lot', render: r => `Block ${r.block}, Lot ${r.lot}` },
                { label: 'Type', render: r => r.type },
                { label: 'Area', render: r => `${r.area} sqm` },
                { label: 'Price', render: r => Utils.formatCurrency(r.totalPrice) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Buyer', render: r => r.buyer || '-' }
            ], lots)}
        </div></div>`;
    },

    renderCommercialDashboard() {
        const spaces = DataStore.commercialSpaces;
        const occupied = spaces.filter(s => s.status === 'occupied');
        const vacant = spaces.filter(s => s.status === 'vacant');
        const monthlyIncome = occupied.reduce((s, sp) => s + sp.monthlyRate, 0);
        return `
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-store"></i></div></div><div class="stat-value">${spaces.length}</div><div class="stat-label">Total Spaces</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div><div class="stat-value">${occupied.length}</div><div class="stat-label">Occupied</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-door-open"></i></div></div><div class="stat-value">${vacant.length}</div><div class="stat-label">Vacant</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(monthlyIncome)}</div><div class="stat-label">Monthly Income</div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Commercial Spaces</h3></div><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'Unit', render: r => `<strong>${r.name}</strong>` },
                { label: 'Floor', render: r => r.floor },
                { label: 'Type', render: r => r.type },
                { label: 'Area', render: r => `${r.area} sqm` },
                { label: 'Rate/mo', render: r => Utils.formatCurrency(r.monthlyRate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Tenant', render: r => r.tenant || '-' }
            ], spaces)}
        </div></div>`;
    },

    renderQuarryDashboard() {
        const products = DataStore.aggregateProducts;
        const orders = DataStore.crushingOrders;
        const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
        return `
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-mountain"></i></div></div><div class="stat-value">${products.length}</div><div class="stat-label">Product Types</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-cubes"></i></div></div><div class="stat-value">${Utils.formatNumber(totalStock)}</div><div class="stat-label">Total Stock (cu.m)</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-truck"></i></div></div><div class="stat-value">${orders.length}</div><div class="stat-label">Orders</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(DataStore.getFinancialSummary('crushing').totalRevenue, true)}</div><div class="stat-label">Revenue</div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Aggregate Products Stock</h3></div><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'Product', render: r => `<strong>${r.name}</strong>` },
                { label: 'Category', render: r => `<span class="badge-tag badge-neutral">${r.category}</span>` },
                { label: 'Unit', render: r => r.unit },
                { label: 'Price/Unit', render: r => Utils.formatCurrency(r.price) },
                { label: 'Stock', render: r => `<span style="font-weight:700;color:${r.stock < 100 ? 'var(--danger)' : 'var(--success)'}">${Utils.formatNumber(r.stock)}</span>` }
            ], products)}
        </div></div>`;
    },

    renderDrivingSchoolDashboard() {
        const students = DataStore.students;
        const enrollments = DataStore.enrollments;
        const active = enrollments.filter(e => e.status === 'enrolled');
        const completed = enrollments.filter(e => e.status === 'completed');
        return `
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-user-graduate"></i></div></div><div class="stat-value">${students.length}</div><div class="stat-label">Registered Students</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-book-open"></i></div></div><div class="stat-value">${active.length}</div><div class="stat-label">Active Enrollments</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-certificate"></i></div></div><div class="stat-value">${completed.length}</div><div class="stat-label">Completed</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-chalkboard-teacher"></i></div></div><div class="stat-value">${DataStore.instructors.length}</div><div class="stat-label">Instructors</div></div>
        </div>
        <div class="grid-2 mb-3">
            <div class="card"><div class="card-header"><h3>Recent Enrollments</h3></div><div class="card-body no-padding">
                ${Utils.buildTable([
                    { label: 'Student', render: r => { const s = DataStore.students.find(st => st.id === r.studentId); return s ? s.name : r.studentId; }},
                    { label: 'Course', render: r => { const c = DataStore.drivingCourses.find(co => co.id === r.courseId); return c ? c.name : r.courseId; }},
                    { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                    { label: 'Date', render: r => Utils.formatDate(r.dateEnrolled) }
                ], enrollments.slice(0, 10))}
            </div></div>
            <div class="card"><div class="card-header"><h3>Courses Offered</h3></div><div class="card-body no-padding">
                ${Utils.buildTable([
                    { label: 'Course', render: r => r.name },
                    { label: 'Category', render: r => `<span class="badge-tag badge-neutral">${r.category}</span>` },
                    { label: 'Duration', render: r => r.duration },
                    { label: 'Fee', render: r => Utils.formatCurrency(r.price) }
                ], DataStore.drivingCourses.slice(0, 8))}
            </div></div>
        </div>`;
    },

    renderTestingLabDashboard() {
        const orders = DataStore.testOrders;
        const pending = orders.filter(o => o.status === 'pending' || o.status === 'in-progress');
        const completed = orders.filter(o => o.status === 'completed');
        const totalRevenue = orders.reduce((s, o) => s + (o.totalCost || 0), 0);
        return `
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-flask"></i></div></div><div class="stat-value">${orders.length}</div><div class="stat-label">Total Test Orders</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-hourglass-half"></i></div></div><div class="stat-value">${pending.length}</div><div class="stat-label">Pending/In-Progress</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-double"></i></div></div><div class="stat-value">${completed.length}</div><div class="stat-label">Completed</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalRevenue, true)}</div><div class="stat-label">Revenue</div></div>
        </div>
        <div class="grid-2 mb-3">
            <div class="card"><div class="card-header"><h3>Recent Test Orders</h3></div><div class="card-body no-padding">
                ${Utils.buildTable([
                    { label: 'Order ID', render: r => `<strong>${r.id}</strong>` },
                    { label: 'Client', render: r => r.client },
                    { label: 'Test', render: r => { const t = DataStore.testServices.find(ts => ts.id === r.testServiceId); return t ? t.name : r.testServiceId; }},
                    { label: 'Samples', render: r => r.sampleCount },
                    { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                    { label: 'Amount', render: r => Utils.formatCurrency(r.totalCost) }
                ], orders.slice(0, 10))}
            </div></div>
            <div class="card"><div class="card-header"><h3>Test Services Catalog</h3></div><div class="card-body no-padding">
                ${Utils.buildTable([
                    { label: 'Test', render: r => r.name },
                    { label: 'Category', render: r => `<span class="badge-tag badge-neutral">${r.category}</span>` },
                    { label: 'Standard', render: r => r.standard },
                    { label: 'Price', render: r => Utils.formatCurrency(r.price) },
                    { label: 'Turnaround', render: r => r.turnaround }
                ], DataStore.testServices.slice(0, 8))}
            </div></div>
        </div>`;
    },

    renderAlerts() {
        const alerts = [];
        const overdue = DataStore.invoices.filter(i => i.status === 'unpaid' && new Date(i.dueDate) < new Date());
        overdue.forEach(inv => {
            alerts.push({ icon: 'fa-exclamation-triangle', color: 'red', title: 'Overdue Invoice', desc: `${inv.id} — ${Utils.formatCurrency(inv.amount)}` });
        });
        const lowStock = DataStore.aggregateProducts.filter(p => (p.stock || 0) < 100);
        lowStock.forEach(p => {
            alerts.push({ icon: 'fa-box', color: 'orange', title: 'Low Stock', desc: `${p.name} — ${p.stock} ${p.unit} remaining` });
        });
        const pendingTests = DataStore.testOrders.filter(o => o.status === 'pending');
        pendingTests.forEach(t => {
            alerts.push({ icon: 'fa-flask', color: 'blue', title: 'Pending Test', desc: `${t.id} — ${t.client}` });
        });
        if (alerts.length === 0) return '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>All Clear</h3><p>No items needing attention.</p></div>';
        return alerts.map(a => `
            <div class="alert-row">
                <div class="stat-icon ${a.color} alert-icon"><i class="fas ${a.icon}"></i></div>
                <div><div class="fw-bold text-sm">${a.title}</div><div class="text-muted text-sm">${a.desc}</div></div>
            </div>
        `).join('');
    },

    initCharts() {
        // Destroy existing charts
        Object.values(App.charts || {}).forEach(c => { if (c && c.destroy) c.destroy(); });
        App.charts = {};

        const revenueCanvas = document.getElementById('revenueChart');
        const pieCanvas = document.getElementById('companyPieChart');

        if (revenueCanvas) {
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const datasets = Object.entries(DataStore.companies).map(([id, co]) => ({
                label: co.name.split(' ')[0],
                data: DataStore.monthlyRevenue[id] || new Array(12).fill(0),
                borderColor: co.color,
                backgroundColor: co.color + '20',
                tension: 0.4,
                fill: false,
                borderWidth: 2,
                pointRadius: 3
            }));
            App.charts.revenue = new Chart(revenueCanvas, {
                type: 'line',
                data: { labels: months, datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: v => '₱' + (v/1e6).toFixed(1) + 'M' } }
                    }
                }
            });
        }

        if (pieCanvas) {
            const companies = Object.entries(DataStore.companies);
            const data = companies.map(([id]) => {
                return (DataStore.monthlyRevenue[id] || []).reduce((s, v) => s + v, 0);
            });
            App.charts.pie = new Chart(pieCanvas, {
                type: 'doughnut',
                data: {
                    labels: companies.map(([, co]) => co.name.split(' - ')[0].split(' ').slice(0, 2).join(' ')),
                    datasets: [{
                        data,
                        backgroundColor: companies.map(([, co]) => co.color),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
                }
            });
        }
    }
};
