/* ========================================
   SJC UBMS - Payroll Module
   Employee payroll management
   DOLE / BIR / SSS / PhilHealth / Pag-IBIG
   ======================================== */

const Payroll = {
    activeTab: 'payslips',

    // ============================================================
    //  2024 SSS CONTRIBUTION TABLE (RA 11199)
    // ============================================================
    sssTable: [
        { min: 0,     max: 4249.99,  ee: 180,   er: 390 },
        { min: 4250,  max: 4749.99,  ee: 202.5, er: 437.5 },
        { min: 4750,  max: 5249.99,  ee: 225,   er: 485 },
        { min: 5250,  max: 5749.99,  ee: 247.5, er: 532.5 },
        { min: 5750,  max: 6249.99,  ee: 270,   er: 580 },
        { min: 6250,  max: 6749.99,  ee: 292.5, er: 627.5 },
        { min: 6750,  max: 7249.99,  ee: 315,   er: 675 },
        { min: 7250,  max: 7749.99,  ee: 337.5, er: 722.5 },
        { min: 7750,  max: 8249.99,  ee: 360,   er: 770 },
        { min: 8250,  max: 8749.99,  ee: 382.5, er: 817.5 },
        { min: 8750,  max: 9249.99,  ee: 405,   er: 865 },
        { min: 9250,  max: 9749.99,  ee: 427.5, er: 912.5 },
        { min: 9750,  max: 10249.99, ee: 450,   er: 960 },
        { min: 10250, max: 10749.99, ee: 472.5, er: 1007.5 },
        { min: 10750, max: 11249.99, ee: 495,   er: 1055 },
        { min: 11250, max: 11749.99, ee: 517.5, er: 1102.5 },
        { min: 11750, max: 12249.99, ee: 540,   er: 1150 },
        { min: 12250, max: 12749.99, ee: 562.5, er: 1197.5 },
        { min: 12750, max: 13249.99, ee: 585,   er: 1245 },
        { min: 13250, max: 13749.99, ee: 607.5, er: 1292.5 },
        { min: 13750, max: 14249.99, ee: 630,   er: 1340 },
        { min: 14250, max: 14749.99, ee: 652.5, er: 1387.5 },
        { min: 14750, max: 15249.99, ee: 675,   er: 1435 },
        { min: 15250, max: 15749.99, ee: 697.5, er: 1482.5 },
        { min: 15750, max: 16249.99, ee: 720,   er: 1530 },
        { min: 16250, max: 16749.99, ee: 742.5, er: 1577.5 },
        { min: 16750, max: 17249.99, ee: 765,   er: 1625 },
        { min: 17250, max: 17749.99, ee: 787.5, er: 1672.5 },
        { min: 17750, max: 18249.99, ee: 810,   er: 1720 },
        { min: 18250, max: 18749.99, ee: 832.5, er: 1767.5 },
        { min: 18750, max: 19249.99, ee: 855,   er: 1815 },
        { min: 19250, max: 19749.99, ee: 877.5, er: 1862.5 },
        { min: 19750, max: 20249.99, ee: 900,   er: 1900 },
        { min: 20250, max: 24749.99, ee: 1125,  er: 2375 },
        { min: 24750, max: 29249.99, ee: 1350,  er: 2850 },
        { min: 29250, max: Infinity, ee: 1350,  er: 2850 }
    ],

    getSSSContribution(monthlySalary) {
        const row = this.sssTable.find(r => monthlySalary >= r.min && monthlySalary <= r.max);
        return row ? { ee: row.ee, er: row.er } : { ee: 1350, er: 2850 };
    },

    getPhilHealthContribution(monthlySalary) {
        // 2024: 5% premium, 50/50 split, capped at 100k salary
        const premium = Math.min(monthlySalary, 100000) * 0.05;
        return { ee: premium / 2, er: premium / 2 };
    },

    getPagIBIGContribution(monthlySalary) {
        // Employee: 2% if > ₱1,500, else 1%; max ₱200
        // Employer: 2% always, max ₱200
        const eeRate = monthlySalary > 1500 ? 0.02 : 0.01;
        return {
            ee: Math.min(monthlySalary * eeRate, 200),
            er: Math.min(monthlySalary * 0.02, 200)
        };
    },

    getWithholdingTax(taxableIncome, period = 'monthly') {
        // 2024 BIR TRAIN Law
        const monthly = period === 'semi-monthly' ? taxableIncome * 2 : taxableIncome;
        let tax = 0;
        if (monthly <= 20833) tax = 0;
        else if (monthly <= 33333) tax = (monthly - 20833) * 0.15;
        else if (monthly <= 66667) tax = 1875 + (monthly - 33333) * 0.20;
        else if (monthly <= 166667) tax = 8541.80 + (monthly - 66667) * 0.25;
        else if (monthly <= 666667) tax = 33541.80 + (monthly - 166667) * 0.30;
        else tax = 183541.80 + (monthly - 666667) * 0.35;
        return period === 'semi-monthly' ? tax / 2 : tax;
    },

    render(container) {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => !company || e.companyId === company);
        const payslips = (DataStore.payslips || []).filter(p => !company || p.company === company);
        const totalPayout = payslips.reduce((sum, p) => sum + p.netPay, 0);
        const year = new Date().getFullYear();
        const total13th = employees.reduce((sum, e) => sum + this.compute13thMonth(e, year), 0);

        container.innerHTML = `
            <div class="section-header">
                <h2>Payroll Management</h2>
                <button class="btn btn-secondary" onclick="Excel.openExportDialog(['employees','payslips','attendanceRecords'],'Export Payroll Data')"><i class="fas fa-file-excel"></i> Export</button>
            </div>
            <div class="grid-4 mb-3">
                <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-users"></i></div></div><div class="stat-value">${employees.length}</div><div class="stat-label">Active Employees</div></div>
                <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-file-invoice-dollar"></i></div></div><div class="stat-value">${payslips.length}</div><div class="stat-label">Payslips Generated</div></div>
                <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-money-bill-wave"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalPayout)}</div><div class="stat-label">Total Payout</div></div>
                <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-gift"></i></div></div><div class="stat-value">${Utils.formatCurrency(total13th)}</div><div class="stat-label">Est. 13th Month Pay</div></div>
            </div>
            <div class="tabs mb-3">
                <button class="tab-btn ${this.activeTab === 'payslips' ? 'active' : ''}" onclick="Payroll.switchTab('payslips')">Payslips</button>
                <button class="tab-btn ${this.activeTab === 'employees' ? 'active' : ''}" onclick="Payroll.switchTab('employees')">Employees</button>
                <button class="tab-btn ${this.activeTab === 'attendance' ? 'active' : ''}" onclick="Payroll.switchTab('attendance')">Attendance</button>
                <button class="tab-btn ${this.activeTab === 'timesheets' ? 'active' : ''}" onclick="Payroll.switchTab('timesheets')">Timesheets</button>
                <button class="tab-btn ${this.activeTab === 'schedules' ? 'active' : ''}" onclick="Payroll.switchTab('schedules')">Schedules</button>
                <button class="tab-btn ${this.activeTab === '13thmonth' ? 'active' : ''}" onclick="Payroll.switchTab('13thmonth')">13th Month</button>
                <button class="tab-btn ${this.activeTab === 'performance' ? 'active' : ''}" onclick="Payroll.switchTab('performance')">Performance</button>
                <button class="tab-btn ${this.activeTab === 'incidents' ? 'active' : ''}" onclick="Payroll.switchTab('incidents')">Incidents</button>
                <button class="tab-btn ${this.activeTab === 'govreports' ? 'active' : ''}" onclick="Payroll.switchTab('govreports')">Gov. Reports</button>
            </div>
            <div id="payrollTabContent">
                ${this.renderTabContent()}
            </div>
        `;
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render(document.getElementById('mainContent'));
    },

    renderTabContent() {
        switch (this.activeTab) {
            case 'payslips': return this.renderPayslipsTab();
            case 'employees': return this.renderEmployeesTab();
            case 'attendance': return this.renderAttendanceTab();
            case 'timesheets': return this.renderTimesheetsTab();
            case 'schedules': return this.renderSchedulesTab();
            case '13thmonth': return this.render13thMonthTab();
            case 'performance': return this.renderPerformanceTab();
            case 'incidents': return this.renderIncidentsTab();
            case 'govreports': return this.renderGovReportsTab();
            default: return '<div>Tab not found</div>';
        }
    },

    // ============================================================
    //  EMPLOYEES TAB
    // ============================================================
    renderEmployeesTab() {
        const employees = this.getFilteredEmployees();
        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-users"></i> Employees</h3>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.openAddEmployee()"><i class="fas fa-plus"></i> Add Employee</button>
                </div>
                <div class="card-body no-padding">
                    ${this.buildEmployeeList(employees)}
                </div>
            </div>`;
    },

    buildEmployeeList(employees) {
        if (employees.length === 0) return '<div class="empty-state"><i class="fas fa-user-tie"></i><h3>No Employees</h3><p>Add employees to start processing payroll.</p></div>';
        return Utils.buildTable([
            { label: 'Employee', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong><br><small class="text-muted">${r.id}</small>` },
            { label: 'Position', render: r => Utils.escapeHtml(r.position || '-') },
            { label: 'Pay Rate', render: r => `${Utils.formatCurrency(r.monthlyRate || r.dailyRate || 0)}<br><span class="badge-tag badge-neutral">${r.payFrequency || 'monthly'}</span>` },
            { label: 'Contact', render: r => `${r.phone || ''}<br>${r.email || ''}` },
            { label: 'Status', render: r => `<span class="badge-tag ${r.status === 'active' ? 'badge-success' : 'badge-warning'}">${r.status}</span>` },
            {
                label: 'Actions', render: r => `
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="Payroll.openGeneratePayslip('${r.id}')" title="Generate Payslip"><i class="fas fa-money-check"></i></button>
                    <button class="btn btn-sm btn-secondary" onclick="Payroll.editEmployee('${r.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    ${Auth.canEditDelete() ? `<button class="btn btn-sm btn-danger" onclick="Payroll.deleteEmployee('${r.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                </div>`
            }
        ], employees);
    },

    openAddEmployee() {
        const company = App.currentCompany;
        const body = `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="empName" required></div>
                <div class="form-group"><label>Biometric/Kiosk User ID</label><input type="text" class="form-input" id="empUserId" placeholder="Optional, for attendance"></div>
                <div class="form-group"><label>Position</label><input type="text" class="form-input" id="empPosition"></div>
                <div class="form-group"><label>Department</label><select class="form-input" id="empDept"><option>Operations</option><option>Administration</option><option>Finance</option><option>Technical</option><option>Field</option><option>Laboratory</option><option>Training</option></select></div>
                <div class="form-group"><label>Pay Frequency</label><select class="form-input" id="empPayFreq"><option value="monthly">Monthly</option><option value="semi-monthly">Semi-monthly</option><option value="daily">Daily</option></select></div>
                <div class="form-group"><label>Monthly Rate (₱)</label><input type="number" class="form-input" id="empMonthlyRate" min="0" step="0.01"></div>
                <div class="form-group"><label>Daily Rate (₱)</label><input type="number" class="form-input" id="empDailyRate" min="0" step="0.01"></div>
                <div class="form-group"><label>Date Hired</label><input type="date" class="form-input" id="empHired" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="empPhone"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="empEmail"></div>
                <div class="form-group"><label>SSS No.</label><input type="text" class="form-input" id="empSssNo"></div>
                <div class="form-group"><label>PhilHealth No.</label><input type="text" class="form-input" id="empPhilhealthNo"></div>
                <div class="form-group"><label>Pag-IBIG No.</label><input type="text" class="form-input" id="empPagibigNo"></div>
                <div class="form-group"><label>TIN</label><input type="text" class="form-input" id="empTin"></div>
            </div>`;
        const footer = `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                         <button class="btn btn-primary" onclick="Payroll.saveEmployee()">Save Employee</button>`;
        App.showModal('Add New Employee', body, footer);
    },

    saveEmployee() {
        const name = document.getElementById('empName')?.value?.trim();
        if (!name) { App.showToast('Employee name is required.', 'error'); return; }

        const newEmployee = {
            id: Utils.generateId('EMP'),
            companyId: App.currentCompany || 'sjc',
            name,
            userId: document.getElementById('empUserId')?.value?.trim() || null,
            position: document.getElementById('empPosition')?.value?.trim() || '',
            department: document.getElementById('empDept')?.value || 'Operations',
            payFrequency: document.getElementById('empPayFreq')?.value || 'monthly',
            monthlyRate: parseFloat(document.getElementById('empMonthlyRate')?.value) || 0,
            dailyRate: parseFloat(document.getElementById('empDailyRate')?.value) || 0,
            dateHired: document.getElementById('empHired')?.value || '',
            phone: document.getElementById('empPhone')?.value?.trim() || '',
            email: document.getElementById('empEmail')?.value?.trim() || '',
            sssNo: document.getElementById('empSssNo')?.value?.trim() || '',
            philhealthNo: document.getElementById('empPhilhealthNo')?.value?.trim() || '',
            pagibigNo: document.getElementById('empPagibigNo')?.value?.trim() || '',
            tin: document.getElementById('empTin')?.value?.trim() || '',
            status: 'active',
            createdAt: new Date().toISOString()
        };

        if (!DataStore.employees) DataStore.employees = [];
        DataStore.employees.push(newEmployee);
        Database.save();
        App.closeModal();
        App.showToast('Employee added successfully.', 'success');
        this.renderTabContent();
        this.render(document.getElementById('mainContent'));
    },

    editEmployee(id) {
        const emp = DataStore.employees.find(e => e.id === id);
        if (!emp) return;
        const body = `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="empName" value="${Utils.escapeHtml(emp.name)}"></div>
                <div class="form-group"><label>Biometric/Kiosk User ID</label><input type="text" class="form-input" id="empUserId" value="${Utils.escapeHtml(emp.userId || '')}"></div>
                <div class="form-group"><label>Position</label><input type="text" class="form-input" id="empPosition" value="${Utils.escapeHtml(emp.position || '')}"></div>
                <div class="form-group"><label>Department</label>
                    <select class="form-input" id="empDept">
                        ${['Operations','Administration','Finance','Technical','Field','Laboratory','Training'].map(d => `<option ${emp.department===d?'selected':''}>${d}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Pay Frequency</label>
                    <select class="form-input" id="empPayFreq">
                        <option value="monthly" ${emp.payFrequency==='monthly'?'selected':''}>Monthly</option>
                        <option value="semi-monthly" ${emp.payFrequency==='semi-monthly'?'selected':''}>Semi-monthly</option>
                        <option value="daily" ${emp.payFrequency==='daily'?'selected':''}>Daily</option>
                    </select>
                </div>
                <div class="form-group"><label>Monthly Rate (₱)</label><input type="number" class="form-input" id="empMonthlyRate" value="${emp.monthlyRate || 0}" min="0" step="0.01"></div>
                <div class="form-group"><label>Daily Rate (₱)</label><input type="number" class="form-input" id="empDailyRate" value="${emp.dailyRate || 0}" min="0" step="0.01"></div>
                <div class="form-group"><label>Date Hired</label><input type="date" class="form-input" id="empHired" value="${emp.dateHired || ''}"></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="empPhone" value="${Utils.escapeHtml(emp.phone || '')}"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="empEmail" value="${Utils.escapeHtml(emp.email || '')}"></div>
                <div class="form-group"><label>SSS No.</label><input type="text" class="form-input" id="empSssNo" value="${Utils.escapeHtml(emp.sssNo || '')}"></div>
                <div class="form-group"><label>PhilHealth No.</label><input type="text" class="form-input" id="empPhilhealthNo" value="${Utils.escapeHtml(emp.philhealthNo || '')}"></div>
                <div class="form-group"><label>Pag-IBIG No.</label><input type="text" class="form-input" id="empPagibigNo" value="${Utils.escapeHtml(emp.pagibigNo || '')}"></div>
                <div class="form-group"><label>TIN</label><input type="text" class="form-input" id="empTin" value="${Utils.escapeHtml(emp.tin || '')}"></div>
                <div class="form-group"><label>Status</label>
                    <select class="form-input" id="empStatus">
                        <option value="active" ${emp.status==='active'?'selected':''}>Active</option>
                        <option value="inactive" ${emp.status==='inactive'?'selected':''}>Inactive</option>
                        <option value="terminated" ${emp.status==='terminated'?'selected':''}>Terminated</option>
                    </select>
                </div>
            </div>`;
        App.showModal('Edit Employee', body,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Payroll.updateEmployee('${id}')">Save Changes</button>`);
    },

    updateEmployee(id) {
        const emp = DataStore.employees.find(e => e.id === id);
        if (!emp) return;
        emp.name = document.getElementById('empName')?.value?.trim() || emp.name;
        emp.userId = document.getElementById('empUserId')?.value?.trim() || null;
        emp.position = document.getElementById('empPosition')?.value?.trim() || '';
        emp.department = document.getElementById('empDept')?.value || emp.department;
        emp.payFrequency = document.getElementById('empPayFreq')?.value || emp.payFrequency;
        emp.monthlyRate = parseFloat(document.getElementById('empMonthlyRate')?.value) || 0;
        emp.dailyRate = parseFloat(document.getElementById('empDailyRate')?.value) || 0;
        emp.dateHired = document.getElementById('empHired')?.value || emp.dateHired;
        emp.phone = document.getElementById('empPhone')?.value?.trim() || '';
        emp.email = document.getElementById('empEmail')?.value?.trim() || '';
        emp.sssNo = document.getElementById('empSssNo')?.value?.trim() || '';
        emp.philhealthNo = document.getElementById('empPhilhealthNo')?.value?.trim() || '';
        emp.pagibigNo = document.getElementById('empPagibigNo')?.value?.trim() || '';
        emp.tin = document.getElementById('empTin')?.value?.trim() || '';
        emp.status = document.getElementById('empStatus')?.value || emp.status;
        Database.save();
        App.closeModal();
        App.showToast('Employee updated.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    deleteEmployee(id) {
        if (!confirm('Are you sure you want to delete this employee? This cannot be undone.')) return;
        DataStore.employees = DataStore.employees.filter(e => e.id !== id);
        // Also delete related data
        DataStore.payslips = (DataStore.payslips || []).filter(p => p.employeeId !== id);
        DataStore.attendanceRecords = (DataStore.attendanceRecords || []).filter(a => a.employeeId !== id);
        DataStore.workSchedules = (DataStore.workSchedules || []).filter(w => w.employeeId !== id);
        Database.save();
        App.showToast('Employee deleted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    getFilteredEmployees() {
        const company = App.currentCompany;
        return (DataStore.employees || []).filter(e => !company || e.companyId === company);
    },
    
    // ============================================================
    //  PAYSLIPS TAB
    // ============================================================
    renderPayslipsTab() {
        const payslips = this.getFilteredPayslips().sort((a, b) => new Date(b.date) - new Date(a.date));
        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-file-invoice-dollar"></i> Payslips</h3>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.openBulkPayslip()"><i class="fas fa-plus"></i> Generate Payslip</button>
                </div>
                <div class="card-body no-padding">
                    ${payslips.length === 0
                        ? '<div class="empty-state"><i class="fas fa-receipt"></i><h3>No Payslips</h3><p>Generate payslips from the Employees tab.</p></div>'
                        : Utils.buildTable([
                            { label: 'ID', render: r => `<strong>${r.id}</strong>` },
                            { label: 'Employee', render: r => { const e = (DataStore.employees||[]).find(x=>x.id===r.employeeId); return e ? Utils.escapeHtml(e.name) : r.employeeId; }},
                            { label: 'Period', render: r => Utils.escapeHtml(r.period || '-') },
                            { label: 'Gross Pay', render: r => Utils.formatCurrency(r.grossPay || 0) },
                            { label: 'Deductions', render: r => Utils.formatCurrency(r.totalDeductions || 0) },
                            { label: 'Net Pay', render: r => `<strong class="text-success">${Utils.formatCurrency(r.netPay || 0)}</strong>` },
                            { label: 'Date', render: r => Utils.formatDate(r.date) },
                            { label: 'Actions', render: r => `
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-primary" onclick="Payroll.viewPayslip('${r.id}')" title="View"><i class="fas fa-eye"></i></button>
                                    <button class="btn btn-sm btn-secondary" onclick="Payroll.printPayslip('${r.id}')" title="Print"><i class="fas fa-print"></i></button>
                                    ${Auth.canEditDelete() ? `<button class="btn btn-sm btn-danger" onclick="Payroll.deletePayslip('${r.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                                </div>` }
                        ], payslips)
                    }
                </div>
            </div>`;
    },

    getFilteredPayslips() {
        const company = App.currentCompany;
        const empIds = (DataStore.employees || []).filter(e => !company || e.companyId === company).map(e => e.id);
        return (DataStore.payslips || []).filter(p => empIds.includes(p.employeeId));
    },

    openBulkPayslip() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        if (employees.length === 0) { App.showToast('No active employees.', 'error'); return; }
        this.openGeneratePayslip(employees[0].id);
    },

    openGeneratePayslip(empId) {
        const emp = (DataStore.employees || []).find(e => e.id === empId);
        if (!emp) return;
        const monthly = emp.monthlyRate || (emp.dailyRate * 26) || 0;
        const sss = this.getSSSContribution(monthly);
        const ph = this.getPhilHealthContribution(monthly);
        const pagibig = this.getPagIBIGContribution(monthly);
        const taxable = monthly - sss.ee - ph.ee - pagibig.ee;
        const tax = this.getWithholdingTax(taxable, emp.payFrequency === 'semi-monthly' ? 'semi-monthly' : 'monthly');
        const net = monthly - sss.ee - ph.ee - pagibig.ee - tax;
        const today = new Date();
        const defaultPeriod = `${today.toLocaleString('en-PH', { month: 'long' })} ${today.getFullYear()}`;

        App.showModal(`Generate Payslip — ${Utils.escapeHtml(emp.name)}`, `
            <div class="grid-2">
                <div class="form-group" style="grid-column:1/-1"><label>Pay Period</label><input type="text" class="form-input" id="psPeriod" value="${defaultPeriod}" placeholder="e.g. January 1-15, 2026"></div>
                <div class="form-group"><label>Basic Pay (₱)</label><input type="number" class="form-input" id="psBasic" value="${monthly.toFixed(2)}" min="0" oninput="Payroll.recalcPayslip()"></div>
                <div class="form-group"><label>Overtime / Holiday Pay (₱)</label><input type="number" class="form-input" id="psOT" value="0" min="0" oninput="Payroll.recalcPayslip()"></div>
                <div class="form-group"><label>Allowances (₱)</label><input type="number" class="form-input" id="psAllow" value="0" min="0" oninput="Payroll.recalcPayslip()"></div>
                <div class="form-group"><label>Absences / Late Deductions (₱)</label><input type="number" class="form-input" id="psAbsence" value="0" min="0" oninput="Payroll.recalcPayslip()"></div>
                <div class="form-group"><label>Loan/Cash Advance (₱)</label><input type="number" class="form-input" id="psLoan" value="0" min="0" oninput="Payroll.recalcPayslip()"></div>
                <div class="form-group"><label>Other Deductions (₱)</label><input type="number" class="form-input" id="psOther" value="0" min="0" oninput="Payroll.recalcPayslip()"></div>
            </div>
            <div class="card" style="background:var(--bg-secondary)"><div class="card-body">
                <strong>Government Contributions (Auto-computed)</strong>
                <div class="grid-4 mt-2">
                    <div class="form-group"><label>SSS (EE)</label><input type="number" class="form-input" id="psSSS" value="${sss.ee.toFixed(2)}" readonly></div>
                    <div class="form-group"><label>PhilHealth (EE)</label><input type="number" class="form-input" id="psPH" value="${ph.ee.toFixed(2)}" readonly></div>
                    <div class="form-group"><label>Pag-IBIG (EE)</label><input type="number" class="form-input" id="psPagibig" value="${pagibig.ee.toFixed(2)}" readonly></div>
                    <div class="form-group"><label>Withholding Tax</label><input type="number" class="form-input" id="psTax" value="${tax.toFixed(2)}" readonly></div>
                </div>
            </div></div>
            <div style="background:var(--primary);color:#fff;padding:14px 18px;border-radius:8px;font-size:1.25rem;font-weight:700;text-align:center;margin-top:12px">
                NET PAY: ₱<span id="psNet">${net.toFixed(2)}</span>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Payroll.savePayslip('${empId}')">Save Payslip</button>`
        );
    },

    recalcPayslip() {
        const basic = parseFloat(document.getElementById('psBasic')?.value) || 0;
        const ot = parseFloat(document.getElementById('psOT')?.value) || 0;
        const allow = parseFloat(document.getElementById('psAllow')?.value) || 0;
        const absence = parseFloat(document.getElementById('psAbsence')?.value) || 0;
        const loan = parseFloat(document.getElementById('psLoan')?.value) || 0;
        const other = parseFloat(document.getElementById('psOther')?.value) || 0;
        const grossBase = basic - absence;
        const sss = this.getSSSContribution(grossBase);
        const ph = this.getPhilHealthContribution(grossBase);
        const pagibig = this.getPagIBIGContribution(grossBase);
        const taxable = grossBase - sss.ee - ph.ee - pagibig.ee;
        const tax = this.getWithholdingTax(taxable);
        if (document.getElementById('psSSS')) document.getElementById('psSSS').value = sss.ee.toFixed(2);
        if (document.getElementById('psPH')) document.getElementById('psPH').value = ph.ee.toFixed(2);
        if (document.getElementById('psPagibig')) document.getElementById('psPagibig').value = pagibig.ee.toFixed(2);
        if (document.getElementById('psTax')) document.getElementById('psTax').value = tax.toFixed(2);
        const net = grossBase + ot + allow - sss.ee - ph.ee - pagibig.ee - tax - loan - other;
        const el = document.getElementById('psNet');
        if (el) el.textContent = net.toFixed(2);
    },

    savePayslip(empId) {
        const emp = (DataStore.employees || []).find(e => e.id === empId);
        if (!emp) return;
        const basic = parseFloat(document.getElementById('psBasic')?.value) || 0;
        const ot = parseFloat(document.getElementById('psOT')?.value) || 0;
        const allow = parseFloat(document.getElementById('psAllow')?.value) || 0;
        const absence = parseFloat(document.getElementById('psAbsence')?.value) || 0;
        const loan = parseFloat(document.getElementById('psLoan')?.value) || 0;
        const other = parseFloat(document.getElementById('psOther')?.value) || 0;
        const sss = parseFloat(document.getElementById('psSSS')?.value) || 0;
        const ph = parseFloat(document.getElementById('psPH')?.value) || 0;
        const pagibig = parseFloat(document.getElementById('psPagibig')?.value) || 0;
        const tax = parseFloat(document.getElementById('psTax')?.value) || 0;
        const grossPay = basic - absence + ot + allow;
        const totalDeductions = sss + ph + pagibig + tax + loan + other + absence;
        const netPay = grossPay - sss - ph - pagibig - tax - loan - other;
        const period = document.getElementById('psPeriod')?.value?.trim() || new Date().toLocaleString('en-PH', { month: 'long', year: 'numeric' });
        const payslipId = Utils.generateId('PS');
        if (!DataStore.payslips) DataStore.payslips = [];
        DataStore.payslips.push({
            id: payslipId,
            employeeId: empId,
            companyId: emp.companyId,
            period,
            basicPay: basic,
            overtime: ot,
            allowances: allow,
            absences: absence,
            loanDeduction: loan,
            otherDeductions: other,
            sss, philhealth: ph, pagibig, withholdingTax: tax,
            grossPay,
            totalDeductions,
            netPay,
            date: new Date().toISOString().split('T')[0]
        });
        // Also record as expense
        if (!DataStore.expenses) DataStore.expenses = [];
        DataStore.expenses.push({
            id: Utils.generateId('EXP'),
            companyId: emp.companyId || App.currentCompany || 'sjc',
            category: 'Salaries & Wages',
            amount: netPay,
            date: new Date().toISOString().split('T')[0],
            description: `Payroll: ${emp.name}`,
            reference: payslipId
        });
        Database.save();
        App.closeModal();
        App.showToast('Payslip saved successfully.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    viewPayslip(id) {
        const ps = (DataStore.payslips || []).find(p => p.id === id);
        if (!ps) return;
        const emp = (DataStore.employees || []).find(e => e.id === ps.employeeId);
        const company = DataStore.companies?.[emp?.companyId] || { name: 'SJC Group of Companies' };
        App.showModal('Payslip', `
            <div id="payslipPrintArea" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:12px;margin-bottom:16px">
                    <h2 style="margin:0">${Utils.escapeHtml(company.name || 'SJC Group')}</h2>
                    <p style="margin:4px 0;color:#555">PAYSLIP</p>
                    <p style="margin:0;font-size:0.9em">Period: ${Utils.escapeHtml(ps.period || '')}</p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
                    <div><strong>Employee:</strong> ${emp ? Utils.escapeHtml(emp.name) : ps.employeeId}</div>
                    <div><strong>ID No.:</strong> ${emp ? emp.id : '-'}</div>
                    <div><strong>Position:</strong> ${emp ? Utils.escapeHtml(emp.position || '') : '-'}</div>
                    <div><strong>Date:</strong> ${Utils.formatDate(ps.date)}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                    <tr style="background:#f0f4ff"><td colspan="2" style="padding:6px 10px;font-weight:700">EARNINGS</td></tr>
                    <tr><td style="padding:4px 10px">Basic Pay</td><td style="padding:4px 10px;text-align:right">${Utils.formatCurrency(ps.basicPay||0)}</td></tr>
                    ${ps.overtime>0?`<tr><td style="padding:4px 10px">Overtime/Holiday Pay</td><td style="padding:4px 10px;text-align:right">${Utils.formatCurrency(ps.overtime)}</td></tr>`:''}
                    ${ps.allowances>0?`<tr><td style="padding:4px 10px">Allowances</td><td style="padding:4px 10px;text-align:right">${Utils.formatCurrency(ps.allowances)}</td></tr>`:''}
                    <tr style="font-weight:700;border-top:1px solid #ccc"><td style="padding:6px 10px">GROSS PAY</td><td style="padding:6px 10px;text-align:right">${Utils.formatCurrency(ps.grossPay||0)}</td></tr>
                    <tr style="background:#fff0f0"><td colspan="2" style="padding:6px 10px;font-weight:700">DEDUCTIONS</td></tr>
                    ${ps.absences>0?`<tr><td style="padding:4px 10px">Absences/Late</td><td style="padding:4px 10px;text-align:right">(${Utils.formatCurrency(ps.absences)})</td></tr>`:''}
                    <tr><td style="padding:4px 10px">SSS Contribution</td><td style="padding:4px 10px;text-align:right">(${Utils.formatCurrency(ps.sss||0)})</td></tr>
                    <tr><td style="padding:4px 10px">PhilHealth</td><td style="padding:4px 10px;text-align:right">(${Utils.formatCurrency(ps.philhealth||0)})</td></tr>
                    <tr><td style="padding:4px 10px">Pag-IBIG</td><td style="padding:4px 10px;text-align:right">(${Utils.formatCurrency(ps.pagibig||0)})</td></tr>
                    <tr><td style="padding:4px 10px">Withholding Tax</td><td style="padding:4px 10px;text-align:right">(${Utils.formatCurrency(ps.withholdingTax||0)})</td></tr>
                    ${ps.loanDeduction>0?`<tr><td style="padding:4px 10px">Loan/Cash Advance</td><td style="padding:4px 10px;text-align:right">(${Utils.formatCurrency(ps.loanDeduction)})</td></tr>`:''}
                    ${ps.otherDeductions>0?`<tr><td style="padding:4px 10px">Other Deductions</td><td style="padding:4px 10px;text-align:right">(${Utils.formatCurrency(ps.otherDeductions)})</td></tr>`:''}
                    <tr style="background:#e8f5e9;font-weight:700;font-size:1.1em;border-top:2px solid #333"><td style="padding:8px 10px">NET PAY</td><td style="padding:8px 10px;text-align:right">${Utils.formatCurrency(ps.netPay||0)}</td></tr>
                </table>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:24px;padding-top:16px;border-top:1px solid #ccc;text-align:center;font-size:0.85em">
                    <div style="border-top:1px solid #333;padding-top:4px">Prepared by</div>
                    <div style="border-top:1px solid #333;padding-top:4px">Received by (Employee Signature)</div>
                </div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
             <button class="btn btn-primary" onclick="Payroll.printPayslip('${id}')"><i class="fas fa-print"></i> Print</button>`
        );
    },

    printPayslip(id) {
        let area = document.getElementById('payslipPrintArea');
        if (!area) { this.viewPayslip(id); setTimeout(() => this.printPayslip(id), 300); return; }
        const w = window.open('', '_blank', 'width=700,height=600');
        w.document.write(`<html><head><title>Payslip</title><style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}@media print{body{padding:0}}</style></head><body>${area.innerHTML}<script>window.print();<\/script></body></html>`);
        w.document.close();
    },

    deletePayslip(id) {
        if (!confirm('Delete this payslip? This cannot be undone.')) return;
        DataStore.payslips = (DataStore.payslips || []).filter(p => p.id !== id);
        Database.save();
        App.showToast('Payslip deleted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    // ============================================================
    //  ATTENDANCE TAB
    // ============================================================
    renderAttendanceTab() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        const records = (DataStore.attendanceRecords || []).filter(a => {
            const emp = employees.find(e => e.id === a.employeeId);
            return !!emp;
        }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 100);

        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-calendar-check"></i> Attendance</h3>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.openLogAttendance()"><i class="fas fa-plus"></i> Log Attendance</button>
                </div>
                <div class="card-body no-padding">
                    ${records.length === 0
                        ? '<div class="empty-state"><i class="fas fa-calendar-times"></i><h3>No Attendance Records</h3><p>Log daily attendance to track work hours.</p></div>'
                        : Utils.buildTable([
                            { label: 'Employee', render: r => { const e = (DataStore.employees||[]).find(x=>x.id===r.employeeId); return e ? Utils.escapeHtml(e.name) : r.employeeId; }},
                            { label: 'Date', render: r => Utils.formatDate(r.date) },
                            { label: 'Time In', render: r => r.timeIn || '-' },
                            { label: 'Time Out', render: r => r.timeOut || '-' },
                            { label: 'Hours', render: r => r.hoursWorked ? `${r.hoursWorked.toFixed(1)} hrs` : '-' },
                            { label: 'OT Hours', render: r => r.overtimeHours > 0 ? `<span class="badge-tag badge-warning">${r.overtimeHours.toFixed(1)} hrs</span>` : '-' },
                            { label: 'Status', render: r => `<span class="badge-tag ${r.status === 'present' ? 'badge-success' : r.status === 'absent' ? 'badge-danger' : 'badge-warning'}">${Utils.escapeHtml(r.status || 'present')}</span>` },
                            { label: 'Notes', render: r => Utils.escapeHtml(r.notes || '') },
                            { label: 'Actions', render: r => `
                                ${Auth.canEditDelete() ? `<button class="btn btn-sm btn-danger" onclick="Payroll.deleteAttendance('${r.id}')"><i class="fas fa-trash"></i></button>` : ''}
                            `}
                        ], records)
                    }
                </div>
            </div>`;
    },

    openLogAttendance() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        if (employees.length === 0) { App.showToast('No active employees found.', 'error'); return; }
        App.showModal('Log Attendance', `
            <div class="grid-2">
                <div class="form-group"><label>Employee</label>
                    <select class="form-input" id="attempId">
                        ${employees.map(e => `<option value="${e.id}">${Utils.escapeHtml(e.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="attDate" value="${Utils.today()}"></div>
                <div class="form-group"><label>Time In</label><input type="time" class="form-input" id="attTimeIn" value="08:00"></div>
                <div class="form-group"><label>Time Out</label><input type="time" class="form-input" id="attTimeOut" value="17:00"></div>
                <div class="form-group"><label>Status</label>
                    <select class="form-input" id="attStatus">
                        <option value="present">Present</option>
                        <option value="half-day">Half Day</option>
                        <option value="absent">Absent</option>
                        <option value="holiday">Holiday</option>
                        <option value="leave">On Leave</option>
                    </select>
                </div>
                <div class="form-group"><label>Notes</label><input type="text" class="form-input" id="attNotes" placeholder="e.g. overtime, late"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Payroll.saveAttendance()">Save</button>`
        );
    },

    saveAttendance() {
        const empId = document.getElementById('attempId')?.value;
        const date = document.getElementById('attDate')?.value;
        if (!empId || !date) { App.showToast('Employee and date are required.', 'error'); return; }
        const timeIn = document.getElementById('attTimeIn')?.value || '';
        const timeOut = document.getElementById('attTimeOut')?.value || '';
        let hoursWorked = 0, overtimeHours = 0;
        if (timeIn && timeOut) {
            const [ih, im] = timeIn.split(':').map(Number);
            const [oh, om] = timeOut.split(':').map(Number);
            hoursWorked = (oh * 60 + om - ih * 60 - im) / 60;
            if (hoursWorked > 8) { overtimeHours = hoursWorked - 8; hoursWorked = 8; }
        }
        if (!DataStore.attendanceRecords) DataStore.attendanceRecords = [];
        DataStore.attendanceRecords.push({
            id: Utils.generateId('ATT'),
            employeeId: empId,
            date,
            timeIn,
            timeOut,
            hoursWorked: Math.max(0, hoursWorked),
            overtimeHours: Math.max(0, overtimeHours),
            status: document.getElementById('attStatus')?.value || 'present',
            notes: document.getElementById('attNotes')?.value?.trim() || '',
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Attendance logged.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    deleteAttendance(id) {
        if (!confirm('Delete this attendance record?')) return;
        DataStore.attendanceRecords = (DataStore.attendanceRecords || []).filter(a => a.id !== id);
        Database.save();
        App.showToast('Deleted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    // ============================================================
    //  TIMESHEETS TAB
    // ============================================================
    renderTimesheetsTab() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => !company || e.companyId === company);
        const empIds = employees.map(e => e.id);
        const timesheets = (DataStore.timesheets || []).filter(t => empIds.includes(t.employeeId)).sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));

        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-clock"></i> Timesheets</h3>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.openAddTimesheet()"><i class="fas fa-plus"></i> Add Timesheet</button>
                </div>
                <div class="card-body no-padding">
                    ${timesheets.length === 0
                        ? '<div class="empty-state"><i class="fas fa-clock"></i><h3>No Timesheets</h3><p>Add weekly timesheets to track detailed work hours.</p></div>'
                        : Utils.buildTable([
                            { label: 'Employee', render: r => { const e = (DataStore.employees||[]).find(x=>x.id===r.employeeId); return e ? Utils.escapeHtml(e.name) : r.employeeId; }},
                            { label: 'Week Start', render: r => Utils.formatDate(r.weekStart) },
                            { label: 'Week End', render: r => Utils.formatDate(r.weekEnd) },
                            { label: 'Reg. Hours', render: r => `${r.regularHours || 0} hrs` },
                            { label: 'OT Hours', render: r => `${r.overtimeHours || 0} hrs` },
                            { label: 'Status', render: r => `<span class="badge-tag ${r.status==='approved'?'badge-success':r.status==='rejected'?'badge-danger':'badge-warning'}">${r.status||'pending'}</span>` },
                            { label: 'Actions', render: r => `
                                <div class="btn-group">
                                    ${Auth.isManager() && r.status==='pending' ? `<button class="btn btn-sm btn-success" onclick="Payroll.approveTimesheet('${r.id}')"><i class="fas fa-check"></i></button>` : ''}
                                    ${Auth.canEditDelete() ? `<button class="btn btn-sm btn-danger" onclick="Payroll.deleteTimesheet('${r.id}')"><i class="fas fa-trash"></i></button>` : ''}
                                </div>` }
                        ], timesheets)
                    }
                </div>
            </div>`;
    },

    openAddTimesheet() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        App.showModal('Add Timesheet', `
            <div class="grid-2">
                <div class="form-group"><label>Employee</label>
                    <select class="form-input" id="tsEmpId">
                        ${employees.map(e => `<option value="${e.id}">${Utils.escapeHtml(e.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"></div>
                <div class="form-group"><label>Week Start</label><input type="date" class="form-input" id="tsWeekStart" value="${Utils.today()}"></div>
                <div class="form-group"><label>Week End</label><input type="date" class="form-input" id="tsWeekEnd" value="${Utils.today()}"></div>
                <div class="form-group"><label>Regular Hours</label><input type="number" class="form-input" id="tsRegHours" value="40" min="0" max="168"></div>
                <div class="form-group"><label>Overtime Hours</label><input type="number" class="form-input" id="tsOTHours" value="0" min="0"></div>
                <div class="form-group" style="grid-column:1/-1"><label>Remarks</label><textarea class="form-input" id="tsRemarks" rows="2"></textarea></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Payroll.saveTimesheet()">Submit Timesheet</button>`
        );
    },

    saveTimesheet() {
        const empId = document.getElementById('tsEmpId')?.value;
        if (!empId) { App.showToast('Select an employee.', 'error'); return; }
        if (!DataStore.timesheets) DataStore.timesheets = [];
        DataStore.timesheets.push({
            id: Utils.generateId('TS'),
            employeeId: empId,
            weekStart: document.getElementById('tsWeekStart')?.value || '',
            weekEnd: document.getElementById('tsWeekEnd')?.value || '',
            regularHours: parseFloat(document.getElementById('tsRegHours')?.value) || 0,
            overtimeHours: parseFloat(document.getElementById('tsOTHours')?.value) || 0,
            remarks: document.getElementById('tsRemarks')?.value?.trim() || '',
            status: 'pending',
            submittedAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Timesheet submitted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    approveTimesheet(id) {
        const ts = (DataStore.timesheets || []).find(t => t.id === id);
        if (ts) { ts.status = 'approved'; ts.approvedAt = new Date().toISOString(); ts.approvedBy = Auth.getName(); }
        Database.save();
        App.showToast('Timesheet approved.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    deleteTimesheet(id) {
        if (!confirm('Delete this timesheet?')) return;
        DataStore.timesheets = (DataStore.timesheets || []).filter(t => t.id !== id);
        Database.save();
        App.showToast('Deleted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    // ============================================================
    //  SCHEDULES TAB
    // ============================================================
    renderSchedulesTab() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => !company || e.companyId === company);
        const empIds = employees.map(e => e.id);
        const schedules = (DataStore.workSchedules || []).filter(s => empIds.includes(s.employeeId));

        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-calendar-alt"></i> Work Schedules</h3>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.openAddSchedule()"><i class="fas fa-plus"></i> Assign Schedule</button>
                </div>
                <div class="card-body no-padding">
                    ${schedules.length === 0
                        ? '<div class="empty-state"><i class="fas fa-calendar-alt"></i><h3>No Schedules</h3><p>Assign work schedules to employees.</p></div>'
                        : Utils.buildTable([
                            { label: 'Employee', render: r => { const e = (DataStore.employees||[]).find(x=>x.id===r.employeeId); return e ? Utils.escapeHtml(e.name) : r.employeeId; }},
                            { label: 'Schedule Type', render: r => Utils.escapeHtml(r.scheduleType || 'Regular') },
                            { label: 'Work Days', render: r => Utils.escapeHtml(r.workDays || 'Mon-Fri') },
                            { label: 'Time In', render: r => r.timeIn || '08:00' },
                            { label: 'Time Out', render: r => r.timeOut || '17:00' },
                            { label: 'Hours/Day', render: r => `${r.hoursPerDay || 8} hrs` },
                            { label: 'Effective Date', render: r => Utils.formatDate(r.effectiveDate) },
                            { label: 'Actions', render: r => Auth.canEditDelete() ? `<button class="btn btn-sm btn-danger" onclick="Payroll.deleteSchedule('${r.id}')"><i class="fas fa-trash"></i></button>` : '' }
                        ], schedules)
                    }
                </div>
            </div>`;
    },

    openAddSchedule() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        App.showModal('Assign Work Schedule', `
            <div class="grid-2">
                <div class="form-group"><label>Employee</label>
                    <select class="form-input" id="schEmpId">
                        ${employees.map(e => `<option value="${e.id}">${Utils.escapeHtml(e.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Schedule Type</label>
                    <select class="form-input" id="schType">
                        <option value="Regular">Regular (8 hrs/day)</option>
                        <option value="Flexi">Flexi Time</option>
                        <option value="Shifting">Shifting</option>
                        <option value="Field">Field Work</option>
                    </select>
                </div>
                <div class="form-group"><label>Work Days</label>
                    <select class="form-input" id="schDays">
                        <option value="Mon-Fri">Mon-Fri (5 days)</option>
                        <option value="Mon-Sat">Mon-Sat (6 days)</option>
                        <option value="Mon-Sun">Mon-Sun (7 days)</option>
                    </select>
                </div>
                <div class="form-group"><label>Hours Per Day</label><input type="number" class="form-input" id="schHours" value="8" min="1" max="24"></div>
                <div class="form-group"><label>Time In</label><input type="time" class="form-input" id="schTimeIn" value="08:00"></div>
                <div class="form-group"><label>Time Out</label><input type="time" class="form-input" id="schTimeOut" value="17:00"></div>
                <div class="form-group"><label>Effective Date</label><input type="date" class="form-input" id="schEffective" value="${Utils.today()}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Payroll.saveSchedule()">Save Schedule</button>`
        );
    },

    saveSchedule() {
        const empId = document.getElementById('schEmpId')?.value;
        if (!empId) { App.showToast('Select an employee.', 'error'); return; }
        if (!DataStore.workSchedules) DataStore.workSchedules = [];
        DataStore.workSchedules.push({
            id: Utils.generateId('SCH'),
            employeeId: empId,
            scheduleType: document.getElementById('schType')?.value || 'Regular',
            workDays: document.getElementById('schDays')?.value || 'Mon-Fri',
            hoursPerDay: parseInt(document.getElementById('schHours')?.value) || 8,
            timeIn: document.getElementById('schTimeIn')?.value || '08:00',
            timeOut: document.getElementById('schTimeOut')?.value || '17:00',
            effectiveDate: document.getElementById('schEffective')?.value || Utils.today()
        });
        Database.save();
        App.closeModal();
        App.showToast('Schedule assigned.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    deleteSchedule(id) {
        if (!confirm('Remove this schedule?')) return;
        DataStore.workSchedules = (DataStore.workSchedules || []).filter(s => s.id !== id);
        Database.save();
        App.showToast('Deleted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    // ============================================================
    //  13th MONTH TAB
    // ============================================================
    render13thMonthTab() {
        const year = new Date().getFullYear();
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        const rows = employees.map(e => ({
            ...e,
            thirteenth: this.compute13thMonth(e, year)
        }));
        const total = rows.reduce((s, r) => s + r.thirteenth, 0);

        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-gift"></i> 13th Month Pay — ${year}</h3>
                    <span class="badge-tag badge-success">Total: ${Utils.formatCurrency(total)}</span>
                </div>
                <div class="card-body no-padding">
                    ${rows.length === 0
                        ? '<div class="empty-state"><i class="fas fa-gift"></i><h3>No Employees</h3></div>'
                        : Utils.buildTable([
                            { label: 'Employee', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                            { label: 'Position', render: r => Utils.escapeHtml(r.position || '-') },
                            { label: 'Date Hired', render: r => Utils.formatDate(r.dateHired) },
                            { label: 'Monthly Rate', render: r => Utils.formatCurrency(r.monthlyRate || r.dailyRate * 26 || 0) },
                            { label: '13th Month Pay', render: r => `<strong class="text-success">${Utils.formatCurrency(r.thirteenth)}</strong>` },
                            { label: 'Status', render: r => `<span class="badge-tag badge-warning">Estimated</span>` }
                        ], rows)
                    }
                </div>
                <div class="card-footer" style="text-align:right;padding:12px 16px;font-weight:700">
                    Total 13th Month Pay: ${Utils.formatCurrency(total)}
                    <button class="btn btn-sm btn-primary ml-2" onclick="Payroll.print13thMonthReport(${year})"><i class="fas fa-print"></i> Print Report</button>
                </div>
            </div>`;
    },

    compute13thMonth(emp, year) {
        // RA 6686: 13th month = total basic pay earned during the year / 12
        const payslips = (DataStore.payslips || []).filter(p =>
            p.employeeId === emp.id && new Date(p.date).getFullYear() === year
        );
        if (payslips.length > 0) {
            const totalBasic = payslips.reduce((s, p) => s + (p.basicPay || 0), 0);
            return totalBasic / 12;
        }
        // Estimate based on monthly rate
        const monthly = emp.monthlyRate || (emp.dailyRate || 0) * 26;
        const hired = emp.dateHired ? new Date(emp.dateHired) : new Date(year, 0, 1);
        const monthsWorked = hired.getFullYear() < year ? 12 : 12 - hired.getMonth();
        return (monthly * Math.max(0, monthsWorked)) / 12;
    },

    print13thMonthReport(year) {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        const rows = employees.map(e => ({ ...e, thirteenth: this.compute13thMonth(e, year) }));
        const total = rows.reduce((s, r) => s + r.thirteenth, 0);
        const w = window.open('', '_blank', 'width=800,height=600');
        w.document.write(`<html><head><title>13th Month Pay ${year}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px}th{background:#f0f0f0}tfoot td{font-weight:700}@media print{body{padding:0}}</style></head><body>
            <h2 style="text-align:center">13th Month Pay Report — ${year}</h2>
            <table><thead><tr><th>Employee</th><th>Position</th><th>Monthly Rate</th><th>13th Month Pay</th></tr></thead><tbody>
            ${rows.map(r => `<tr><td>${Utils.escapeHtml(r.name)}</td><td>${Utils.escapeHtml(r.position||'')}</td><td style="text-align:right">₱${(r.monthlyRate||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</td><td style="text-align:right">₱${r.thirteenth.toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr>`).join('')}
            </tbody><tfoot><tr><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">₱${total.toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr></tfoot></table>
            <script>window.print();<\/script></body></html>`);
        w.document.close();
    },

    // ============================================================
    //  PERFORMANCE TAB
    // ============================================================
    renderPerformanceTab() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => !company || e.companyId === company);
        const empIds = employees.map(e => e.id);
        const reviews = (DataStore.performanceReviews || []).filter(r => empIds.includes(r.employeeId)).sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));

        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-star"></i> Performance Reviews</h3>
                    <button class="btn btn-sm btn-primary" onclick="Payroll.openAddPerformanceReview()"><i class="fas fa-plus"></i> Add Review</button>
                </div>
                <div class="card-body no-padding">
                    ${reviews.length === 0
                        ? '<div class="empty-state"><i class="fas fa-star"></i><h3>No Performance Reviews</h3><p>Conduct regular employee performance evaluations.</p></div>'
                        : Utils.buildTable([
                            { label: 'Employee', render: r => { const e = (DataStore.employees||[]).find(x=>x.id===r.employeeId); return e ? Utils.escapeHtml(e.name) : r.employeeId; }},
                            { label: 'Review Period', render: r => Utils.escapeHtml(r.period || '-') },
                            { label: 'Date', render: r => Utils.formatDate(r.reviewDate) },
                            { label: 'Rating', render: r => {
                                const stars = Math.round(r.overallRating || 0);
                                return `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} <strong>(${(r.overallRating||0).toFixed(1)}/5)</strong>`;
                            }},
                            { label: 'Recommendation', render: r => `<span class="badge-tag ${r.recommendation==='promoted'?'badge-success':r.recommendation==='improvement'?'badge-danger':'badge-neutral'}">${Utils.escapeHtml(r.recommendation||'maintained')}</span>` },
                            { label: 'Reviewer', render: r => Utils.escapeHtml(r.reviewerName || '-') },
                            { label: 'Actions', render: r => Auth.canEditDelete() ? `<button class="btn btn-sm btn-danger" onclick="Payroll.deleteReview('${r.id}')"><i class="fas fa-trash"></i></button>` : '' }
                        ], reviews)
                    }
                </div>
            </div>`;
    },

    openAddPerformanceReview() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        App.showModal('Add Performance Review', `
            <div class="grid-2">
                <div class="form-group"><label>Employee</label>
                    <select class="form-input" id="prEmpId">
                        ${employees.map(e => `<option value="${e.id}">${Utils.escapeHtml(e.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Review Period</label><input type="text" class="form-input" id="prPeriod" placeholder="e.g. Q1 2026, Annual 2025"></div>
                <div class="form-group"><label>Review Date</label><input type="date" class="form-input" id="prDate" value="${Utils.today()}"></div>
                <div class="form-group"><label>Recommendation</label>
                    <select class="form-input" id="prRec">
                        <option value="maintained">Maintained</option>
                        <option value="promoted">Promoted</option>
                        <option value="improvement">Needs Improvement</option>
                        <option value="probation">Probation</option>
                    </select>
                </div>
            </div>
            <div class="grid-4" style="margin:12px 0">
                ${['Quality of Work','Punctuality','Teamwork','Initiative'].map((cat, i) => `
                    <div class="form-group"><label>${cat} (1-5)</label><input type="number" class="form-input" id="prScore${i}" value="3" min="1" max="5"></div>
                `).join('')}
            </div>
            <div class="form-group"><label>Comments</label><textarea class="form-input" id="prComments" rows="3"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Payroll.savePerformanceReview()">Save Review</button>`
        );
    },

    savePerformanceReview() {
        const empId = document.getElementById('prEmpId')?.value;
        if (!empId) { App.showToast('Select an employee.', 'error'); return; }
        const scores = [0,1,2,3].map(i => parseFloat(document.getElementById(`prScore${i}`)?.value) || 3);
        const overallRating = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (!DataStore.performanceReviews) DataStore.performanceReviews = [];
        DataStore.performanceReviews.push({
            id: Utils.generateId('PRV'),
            employeeId: empId,
            period: document.getElementById('prPeriod')?.value?.trim() || '',
            reviewDate: document.getElementById('prDate')?.value || Utils.today(),
            scores: { qualityOfWork: scores[0], punctuality: scores[1], teamwork: scores[2], initiative: scores[3] },
            overallRating,
            recommendation: document.getElementById('prRec')?.value || 'maintained',
            comments: document.getElementById('prComments')?.value?.trim() || '',
            reviewerName: Auth.getName(),
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Performance review saved.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    deleteReview(id) {
        if (!confirm('Delete this performance review?')) return;
        DataStore.performanceReviews = (DataStore.performanceReviews || []).filter(r => r.id !== id);
        Database.save();
        App.showToast('Deleted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    // ============================================================
    //  INCIDENTS TAB
    // ============================================================
    renderIncidentsTab() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => !company || e.companyId === company);
        const empIds = employees.map(e => e.id);
        const incidents = (DataStore.incidentReports || []).filter(i => empIds.includes(i.employeeId) || !i.employeeId).sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Incident Reports</h3>
                    <button class="btn btn-sm btn-danger" onclick="Payroll.openAddIncident()"><i class="fas fa-plus"></i> File Incident</button>
                </div>
                <div class="card-body no-padding">
                    ${incidents.length === 0
                        ? '<div class="empty-state"><i class="fas fa-shield-alt"></i><h3>No Incidents</h3><p>No workplace incidents on record.</p></div>'
                        : Utils.buildTable([
                            { label: 'ID', render: r => `<strong>${r.id}</strong>` },
                            { label: 'Employee', render: r => { const e = (DataStore.employees||[]).find(x=>x.id===r.employeeId); return e ? Utils.escapeHtml(e.name) : (r.employeeId||'General'); }},
                            { label: 'Date', render: r => Utils.formatDate(r.date) },
                            { label: 'Type', render: r => `<span class="badge-tag ${r.type==='accident'?'badge-danger':r.type==='misconduct'?'badge-warning':'badge-neutral'}">${Utils.escapeHtml(r.type||'incident')}</span>` },
                            { label: 'Description', render: r => Utils.escapeHtml((r.description||'').substring(0, 80)) + (r.description?.length > 80 ? '...' : '') },
                            { label: 'Status', render: r => `<span class="badge-tag ${r.status==='resolved'?'badge-success':'badge-warning'}">${Utils.escapeHtml(r.status||'open')}</span>` },
                            { label: 'Actions', render: r => `
                                <div class="btn-group">
                                    ${r.status !== 'resolved' ? `<button class="btn btn-sm btn-success" onclick="Payroll.resolveIncident('${r.id}')"><i class="fas fa-check"></i></button>` : ''}
                                    ${Auth.canEditDelete() ? `<button class="btn btn-sm btn-danger" onclick="Payroll.deleteIncident('${r.id}')"><i class="fas fa-trash"></i></button>` : ''}
                                </div>` }
                        ], incidents)
                    }
                </div>
            </div>`;
    },

    openAddIncident() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => !company || e.companyId === company);
        App.showModal('File Incident Report', `
            <div class="grid-2">
                <div class="form-group"><label>Employee Involved</label>
                    <select class="form-input" id="incEmpId">
                        <option value="">-- General Incident --</option>
                        ${employees.map(e => `<option value="${e.id}">${Utils.escapeHtml(e.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Date of Incident</label><input type="date" class="form-input" id="incDate" value="${Utils.today()}"></div>
                <div class="form-group"><label>Incident Type</label>
                    <select class="form-input" id="incType">
                        <option value="accident">Work Accident</option>
                        <option value="misconduct">Misconduct</option>
                        <option value="tardiness">Tardiness / Absences</option>
                        <option value="safety">Safety Violation</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group"><label>Severity</label>
                    <select class="form-input" id="incSeverity">
                        <option value="minor">Minor</option>
                        <option value="moderate">Moderate</option>
                        <option value="major">Major</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div class="form-group" style="grid-column:1/-1"><label>Description</label><textarea class="form-input" id="incDesc" rows="3" required></textarea></div>
                <div class="form-group" style="grid-column:1/-1"><label>Corrective Action Taken</label><textarea class="form-input" id="incAction" rows="2"></textarea></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-danger" onclick="Payroll.saveIncident()">File Report</button>`
        );
    },

    saveIncident() {
        const desc = document.getElementById('incDesc')?.value?.trim();
        if (!desc) { App.showToast('Description is required.', 'error'); return; }
        if (!DataStore.incidentReports) DataStore.incidentReports = [];
        DataStore.incidentReports.push({
            id: Utils.generateId('INC'),
            employeeId: document.getElementById('incEmpId')?.value || null,
            date: document.getElementById('incDate')?.value || Utils.today(),
            type: document.getElementById('incType')?.value || 'other',
            severity: document.getElementById('incSeverity')?.value || 'minor',
            description: desc,
            correctiveAction: document.getElementById('incAction')?.value?.trim() || '',
            status: 'open',
            filedBy: Auth.getName(),
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Incident report filed.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    resolveIncident(id) {
        const inc = (DataStore.incidentReports || []).find(i => i.id === id);
        if (inc) { inc.status = 'resolved'; inc.resolvedAt = new Date().toISOString(); inc.resolvedBy = Auth.getName(); }
        Database.save();
        App.showToast('Incident marked as resolved.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    deleteIncident(id) {
        if (!confirm('Delete this incident report?')) return;
        DataStore.incidentReports = (DataStore.incidentReports || []).filter(i => i.id !== id);
        Database.save();
        App.showToast('Deleted.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    // ============================================================
    //  GOVERNMENT REPORTS TAB
    // ============================================================
    renderGovReportsTab() {
        const company = App.currentCompany;
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const monthName = now.toLocaleString('en-PH', { month: 'long' });

        const monthlyPayslips = (DataStore.payslips || []).filter(p => {
            const pDate = new Date(p.date);
            return pDate.getFullYear() === year && pDate.getMonth() === month && employees.find(e => e.id === p.employeeId);
        });

        const totals = monthlyPayslips.reduce((acc, p) => {
            acc.sss += p.sss || 0;
            acc.ph += p.philhealth || 0;
            acc.pagibig += p.pagibig || 0;
            acc.tax += p.withholdingTax || 0;
            acc.gross += p.grossPay || 0;
            acc.net += p.netPay || 0;
            return acc;
        }, { sss: 0, ph: 0, pagibig: 0, tax: 0, gross: 0, net: 0 });

        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-landmark"></i> Government Remittance Reports</h3>
                    <span class="text-muted">${monthName} ${year}</span>
                </div>
                <div class="card-body">
                    <div class="grid-4 mb-3">
                        <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-shield-alt"></i></div></div>
                            <div class="stat-value">${Utils.formatCurrency(totals.sss)}</div><div class="stat-label">SSS (EE only)</div>
                            <button class="btn btn-sm btn-secondary mt-2" onclick="Payroll.printGovReport('sss','${monthName} ${year}')"><i class="fas fa-print"></i> Print R3</button></div>
                        <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-heartbeat"></i></div></div>
                            <div class="stat-value">${Utils.formatCurrency(totals.ph)}</div><div class="stat-label">PhilHealth (EE)</div>
                            <button class="btn btn-sm btn-secondary mt-2" onclick="Payroll.printGovReport('philhealth','${monthName} ${year}')"><i class="fas fa-print"></i> Print RF-1</button></div>
                        <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-home"></i></div></div>
                            <div class="stat-value">${Utils.formatCurrency(totals.pagibig)}</div><div class="stat-label">Pag-IBIG (EE)</div>
                            <button class="btn btn-sm btn-secondary mt-2" onclick="Payroll.printGovReport('pagibig','${monthName} ${year}')"><i class="fas fa-print"></i> Print MCRF</button></div>
                        <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-file-invoice"></i></div></div>
                            <div class="stat-value">${Utils.formatCurrency(totals.tax)}</div><div class="stat-label">W/Tax (BIR)</div>
                            <button class="btn btn-sm btn-secondary mt-2" onclick="Payroll.printGovReport('bir','${monthName} ${year}')"><i class="fas fa-print"></i> Print 1601-C</button></div>
                    </div>

                    <h4 class="mb-2">Detailed Breakdown — ${monthName} ${year}</h4>
                    ${employees.length === 0
                        ? '<div class="empty-state"><i class="fas fa-landmark"></i><h3>No Active Employees</h3></div>'
                        : Utils.buildTable([
                            { label: 'Employee', render: r => Utils.escapeHtml(r.name) },
                            { label: 'SSS No.', render: r => Utils.escapeHtml(r.sssNo || '-') },
                            { label: 'PhilHealth No.', render: r => Utils.escapeHtml(r.philhealthNo || '-') },
                            { label: 'Pag-IBIG No.', render: r => Utils.escapeHtml(r.pagibigNo || '-') },
                            { label: 'TIN', render: r => Utils.escapeHtml(r.tin || '-') },
                            { label: 'SSS', render: r => {
                                const p = monthlyPayslips.find(ps => ps.employeeId === r.id);
                                return Utils.formatCurrency(p?.sss || 0);
                            }},
                            { label: 'PhilHealth', render: r => {
                                const p = monthlyPayslips.find(ps => ps.employeeId === r.id);
                                return Utils.formatCurrency(p?.philhealth || 0);
                            }},
                            { label: 'Pag-IBIG', render: r => {
                                const p = monthlyPayslips.find(ps => ps.employeeId === r.id);
                                return Utils.formatCurrency(p?.pagibig || 0);
                            }},
                            { label: 'W/Tax', render: r => {
                                const p = monthlyPayslips.find(ps => ps.employeeId === r.id);
                                return Utils.formatCurrency(p?.withholdingTax || 0);
                            }}
                        ], employees)
                    }
                </div>
            </div>`;
    },

    printGovReport(type, period) {
        const company = App.currentCompany;
        const companyName = (company && DataStore.companies?.[company]?.name) || 'SJC Group of Companies';
        const employees = (DataStore.employees || []).filter(e => (!company || e.companyId === company) && e.status === 'active');
        const now = new Date();
        const monthlyPayslips = (DataStore.payslips || []).filter(p => {
            const d = new Date(p.date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && employees.find(e => e.id === p.employeeId);
        });

        const labels = { sss: 'SSS R3 Report', philhealth: 'PhilHealth RF-1 Report', pagibig: 'Pag-IBIG MCRF Report', bir: 'BIR 1601-C Report' };
        const field = { sss: 'sss', philhealth: 'philhealth', pagibig: 'pagibig', bir: 'withholdingTax' };
        const noField = { sss: 'sssNo', philhealth: 'philhealthNo', pagibig: 'pagibigNo', bir: 'tin' };

        const rows = employees.map(e => {
            const ps = monthlyPayslips.find(p => p.employeeId === e.id);
            return { ...e, amount: ps ? (ps[field[type]] || 0) : 0 };
        }).filter(r => r.amount > 0);

        const total = rows.reduce((s, r) => s + r.amount, 0);
        const w = window.open('', '_blank', 'width=800,height=600');
        w.document.write(`<html><head><title>${labels[type]}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px}th{background:#eee}tfoot td{font-weight:700}@media print{body{padding:0}}</style></head><body>
            <h2 style="text-align:center">${labels[type]}</h2>
            <p style="text-align:center;margin:0">${Utils.escapeHtml(companyName)} &nbsp;|&nbsp; Period: ${Utils.escapeHtml(period)}</p>
            <br><table><thead><tr><th>Employee Name</th><th>${type.toUpperCase()} No.</th><th style="text-align:right">Amount (₱)</th></tr></thead><tbody>
            ${rows.map(r => `<tr><td>${Utils.escapeHtml(r.name)}</td><td>${Utils.escapeHtml(r[noField[type]]||'-')}</td><td style="text-align:right">₱${r.amount.toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr>`).join('')}
            </tbody><tfoot><tr><td colspan="2" style="text-align:right">TOTAL</td><td style="text-align:right">₱${total.toLocaleString('en-PH',{minimumFractionDigits:2})}</td></tr></tfoot></table>
            <p style="margin-top:40px;font-size:0.85em;color:#555">Generated: ${new Date().toLocaleDateString('en-PH')} by ${Auth.getName()}</p>
            <script>window.print();<\/script></body></html>`);
        w.document.close();
    }

};
