/* ========================================
   SJC UBMS - Commercial Hub Module
   Nancy's Square: Spaces, Tenants, Leases
   ======================================== */

const Commercial = {
    renderSpaces(container) {
        const spaces = DataStore.commercialSpaces;
        const occupied = spaces.filter(s => s.status === 'occupied');
        const vacant = spaces.filter(s => s.status === 'vacant');
        const monthlyIncome = occupied.reduce((s, sp) => s + sp.monthlyRate, 0);

        container.innerHTML = `
        <div class="section-header">
            <div><h2>Commercial Spaces</h2><p>Nancy's Square — ${spaces.length} units</p></div>
            <button class="btn btn-primary" onclick="Commercial.addSpace()"><i class="fas fa-plus"></i> Add Space</button>
        </div>
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-store"></i></div></div><div class="stat-value">${spaces.length}</div><div class="stat-label">Total Spaces</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div><div class="stat-value">${occupied.length}</div><div class="stat-label">Occupied</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-door-open"></i></div></div><div class="stat-value">${vacant.length}</div><div class="stat-label">Vacant</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(monthlyIncome)}</div><div class="stat-label">Monthly Income</div></div>
        </div>
        <div class="card mb-3"><div class="card-header"><h3>Occupancy Overview</h3></div><div class="card-body">
            <div class="progress-bar progress-bar-xl"><div class="progress-fill green" style="width:${spaces.length ? (occupied.length/spaces.length*100) : 0}%"><span>${spaces.length ? Math.round(occupied.length/spaces.length*100) : 0}% Occupied</span></div></div>
        </div></div>
        <div class="card"><div class="card-header"><h3>Space Directory</h3></div><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'Unit', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                { label: 'Floor', render: r => r.floor },
                { label: 'Type', render: r => `<span class="badge-tag badge-neutral">${r.type}</span>` },
                { label: 'Area', render: r => `${r.area} sqm` },
                { label: 'Rate/mo', render: r => Utils.formatCurrency(r.monthlyRate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Tenant', render: r => Utils.escapeHtml(r.tenant || '-') },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="Commercial.editSpace('${r.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="Commercial.deleteSpace('${r.id}')"><i class="fas fa-trash"></i></button>` }
            ], spaces)}
        </div></div>`;
    },

    addSpace() {
        App.showModal('Add Commercial Space', `
            <div class="grid-2">
                <div class="form-group"><label>Unit Name</label><input type="text" class="form-input" id="spName" required></div>
                <div class="form-group"><label>Floor</label><select class="form-input" id="spFloor"><option>Ground Floor</option><option>2nd Floor</option><option>3rd Floor</option></select></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="spType"><option>Retail</option><option>Office</option><option>Food Court</option><option>Storage</option><option>Kiosk</option></select></div>
                <div class="form-group"><label>Area (sqm)</label><input type="number" class="form-input" id="spArea" min="1"></div>
                <div class="form-group"><label>Monthly Rate (₱)</label><input type="number" class="form-input" id="spRate" min="0"></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="spStatus"><option value="vacant">Vacant</option><option value="occupied">Occupied</option><option value="maintenance">Under Maintenance</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Commercial.saveSpace()">Save</button>`
        );
    },

    saveSpace() {
        const name = document.getElementById('spName')?.value?.trim();
        if (!name) { App.showToast('Unit name is required', 'error'); return; }
        DataStore.commercialSpaces.push({
            id: Utils.generateId('SPC'),
            name, floor: document.getElementById('spFloor')?.value || 'Ground Floor',
            type: document.getElementById('spType')?.value || 'Retail',
            area: parseFloat(document.getElementById('spArea')?.value) || 0,
            monthlyRate: parseFloat(document.getElementById('spRate')?.value) || 0,
            status: document.getElementById('spStatus')?.value || 'vacant',
            tenant: '', createdAt: new Date().toISOString()
        });
        Database.save(); App.closeModal(); App.showToast('Space added');
        this.renderSpaces(document.getElementById('mainContent'));
    },

    editSpace(id) {
        const s = DataStore.commercialSpaces.find(x => x.id === id);
        if (!s) return;
        App.showModal('Edit Space', `
            <div class="grid-2">
                <div class="form-group"><label>Unit Name</label><input type="text" class="form-input" id="spName" value="${Utils.escapeHtml(s.name)}" required></div>
                <div class="form-group"><label>Floor</label><select class="form-input" id="spFloor"><option ${s.floor==='Ground Floor'?'selected':''}>Ground Floor</option><option ${s.floor==='2nd Floor'?'selected':''}>2nd Floor</option><option ${s.floor==='3rd Floor'?'selected':''}>3rd Floor</option></select></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="spType"><option ${s.type==='Retail'?'selected':''}>Retail</option><option ${s.type==='Office'?'selected':''}>Office</option><option ${s.type==='Food Court'?'selected':''}>Food Court</option><option ${s.type==='Storage'?'selected':''}>Storage</option></select></div>
                <div class="form-group"><label>Area</label><input type="number" class="form-input" id="spArea" value="${s.area}"></div>
                <div class="form-group"><label>Rate</label><input type="number" class="form-input" id="spRate" value="${s.monthlyRate}"></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="spStatus"><option value="vacant" ${s.status==='vacant'?'selected':''}>Vacant</option><option value="occupied" ${s.status==='occupied'?'selected':''}>Occupied</option><option value="maintenance" ${s.status==='maintenance'?'selected':''}>Maintenance</option></select></div>
                <div class="form-group"><label>Tenant</label><input type="text" class="form-input" id="spTenant" value="${Utils.escapeHtml(s.tenant||'')}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Commercial.updateSpace('${id}')">Update</button>`
        );
    },

    updateSpace(id) {
        const s = DataStore.commercialSpaces.find(x => x.id === id);
        if (!s) return;
        s.name = document.getElementById('spName')?.value?.trim() || s.name;
        s.floor = document.getElementById('spFloor')?.value || s.floor;
        s.type = document.getElementById('spType')?.value || s.type;
        s.area = parseFloat(document.getElementById('spArea')?.value) || s.area;
        s.monthlyRate = parseFloat(document.getElementById('spRate')?.value) || s.monthlyRate;
        s.status = document.getElementById('spStatus')?.value || s.status;
        s.tenant = document.getElementById('spTenant')?.value?.trim() || '';
        Database.save(); App.closeModal(); App.showToast('Space updated');
        this.renderSpaces(document.getElementById('mainContent'));
    },

    deleteSpace(id) {
        App.confirmAction('Delete this space?', () => {
            DataStore.commercialSpaces = DataStore.commercialSpaces.filter(s => s.id !== id);
            Database.save(); App.showToast('Space deleted');
            this.renderSpaces(document.getElementById('mainContent'));
        });
    },

    renderTenants(container) {
        const tenants = DataStore.tenants;
        container.innerHTML = `
        <div class="section-header"><div><h2>Tenants</h2><p>${tenants.length} registered tenants</p></div>
            <button class="btn btn-primary" onclick="Commercial.addTenant()"><i class="fas fa-plus"></i> Add Tenant</button></div>
        <div class="card"><div class="card-body no-padding">
            ${tenants.length === 0 ? '<div class="empty-state"><i class="fas fa-id-badge"></i><h3>No Tenants Yet</h3></div>' :
            Utils.buildTable([
                { label: 'Business', render: r => `<strong>${Utils.escapeHtml(r.businessName)}</strong>` },
                { label: 'Owner', render: r => Utils.escapeHtml(r.ownerName || '-') },
                { label: 'Contact', render: r => Utils.escapeHtml(r.phone || '-') },
                { label: 'Space', render: r => r.spaceId || '-' },
                { label: 'Type', render: r => `<span class="badge-tag badge-neutral">${r.businessType||'-'}</span>` },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], tenants)}
        </div></div>`;
    },

    addTenant() {
        App.showModal('Add Tenant', `
            <div class="grid-2">
                <div class="form-group"><label>Business Name</label><input type="text" class="form-input" id="tnBiz" required></div>
                <div class="form-group"><label>Owner Name</label><input type="text" class="form-input" id="tnOwner"></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="tnPhone"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="tnEmail"></div>
                <div class="form-group"><label>Business Type</label><select class="form-input" id="tnType"><option>Retail</option><option>Food</option><option>Service</option><option>Office</option></select></div>
                <div class="form-group"><label>Assign Space</label><select class="form-input" id="tnSpace"><option value="">None</option>${DataStore.commercialSpaces.filter(s=>s.status==='vacant').map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Commercial.saveTenant()">Save</button>`
        );
    },

    saveTenant() {
        const biz = document.getElementById('tnBiz')?.value?.trim();
        if (!biz) { App.showToast('Business name required', 'error'); return; }
        DataStore.tenants.push({
            id: Utils.generateId('TNT'),
            businessName: biz,
            ownerName: document.getElementById('tnOwner')?.value?.trim() || '',
            phone: document.getElementById('tnPhone')?.value?.trim() || '',
            email: document.getElementById('tnEmail')?.value?.trim() || '',
            businessType: document.getElementById('tnType')?.value || 'Retail',
            spaceId: document.getElementById('tnSpace')?.value || '',
            status: 'active',
            createdAt: new Date().toISOString()
        });
        Database.save(); App.closeModal(); App.showToast('Tenant added');
        this.renderTenants(document.getElementById('mainContent'));
    },

    renderLeases(container) {
        const leases = DataStore.leaseContracts;
        container.innerHTML = `
        <div class="section-header"><div><h2>Lease Contracts</h2><p>${leases.length} contracts</p></div>
            <button class="btn btn-primary" onclick="Commercial.addLease()"><i class="fas fa-plus"></i> New Contract</button></div>
        <div class="card"><div class="card-body no-padding">
            ${leases.length === 0 ? '<div class="empty-state"><i class="fas fa-file-contract"></i><h3>No Lease Contracts</h3></div>' :
            Utils.buildTable([
                { label: 'Contract', render: r => `<strong>${r.id}</strong>` },
                { label: 'Tenant', render: r => Utils.escapeHtml(r.tenantName || r.tenantId) },
                { label: 'Space', render: r => r.spaceId || '-' },
                { label: 'Monthly', render: r => Utils.formatCurrency(r.monthlyRate) },
                { label: 'Start', render: r => Utils.formatDate(r.startDate) },
                { label: 'End', render: r => Utils.formatDate(r.endDate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], leases)}
        </div></div>`;
    },

    addLease() {
        App.showModal('New Lease Contract', `
            <div class="grid-2">
                <div class="form-group"><label>Tenant</label><select class="form-input" id="lcTenant">${DataStore.tenants.map(t=>`<option value="${t.id}">${t.businessName}</option>`).join('')}</select></div>
                <div class="form-group"><label>Space</label><select class="form-input" id="lcSpace">${DataStore.commercialSpaces.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Monthly Rate</label><input type="number" class="form-input" id="lcRate" min="0"></div>
                <div class="form-group"><label>Security Deposit</label><input type="number" class="form-input" id="lcDeposit" min="0"></div>
                <div class="form-group"><label>Start Date</label><input type="date" class="form-input" id="lcStart"></div>
                <div class="form-group"><label>End Date</label><input type="date" class="form-input" id="lcEnd"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Commercial.saveLease()">Create Contract</button>`
        );
    },

    saveLease() {
        const tenantId = document.getElementById('lcTenant')?.value;
        const tenant = DataStore.tenants.find(t => t.id === tenantId);
        DataStore.leaseContracts.push({
            id: Utils.generateId('LSE'),
            tenantId: tenantId || '',
            tenantName: tenant?.businessName || '',
            spaceId: document.getElementById('lcSpace')?.value || '',
            monthlyRate: parseFloat(document.getElementById('lcRate')?.value) || 0,
            securityDeposit: parseFloat(document.getElementById('lcDeposit')?.value) || 0,
            startDate: document.getElementById('lcStart')?.value || '',
            endDate: document.getElementById('lcEnd')?.value || '',
            status: 'active'
        });
        Database.save(); App.closeModal(); App.showToast('Lease contract created');
        this.renderLeases(document.getElementById('mainContent'));
    },

    renderPayments(container) {
        const payments = DataStore.rentalPayments;
        const total = payments.reduce((s, p) => s + p.amount, 0);
        container.innerHTML = `
        <div class="section-header"><div><h2>Rental Payments</h2><p>Total collected: ${Utils.formatCurrency(total)}</p></div>
            <button class="btn btn-primary" onclick="Commercial.addRentalPayment()"><i class="fas fa-plus"></i> Record Payment</button></div>
        <div class="card"><div class="card-body no-padding">
            ${payments.length === 0 ? '<div class="empty-state"><i class="fas fa-cash-register"></i><h3>No Payments Recorded</h3></div>' :
            Utils.buildTable([
                { label: 'Date', render: r => Utils.formatDate(r.date) },
                { label: 'Tenant', render: r => Utils.escapeHtml(r.tenantName || r.tenantId || '-') },
                { label: 'Space', render: r => r.spaceId || '-' },
                { label: 'Amount', render: r => `<strong>${Utils.formatCurrency(r.amount)}</strong>` },
                { label: 'Period', render: r => r.period || '-' },
                { label: 'Method', render: r => r.method || '-' }
            ], payments)}
        </div></div>`;
    },

    addRentalPayment() {
        App.showModal('Record Rental Payment', `
            <div class="grid-2">
                <div class="form-group"><label>Tenant</label><select class="form-input" id="rpTenant">${DataStore.tenants.map(t=>`<option value="${t.id}">${t.businessName}</option>`).join('')}</select></div>
                <div class="form-group"><label>Amount</label><input type="number" class="form-input" id="rpAmount" min="0" required></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="rpDate" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Period</label><input type="text" class="form-input" id="rpPeriod" placeholder="e.g. January 2025"></div>
                <div class="form-group"><label>Method</label><select class="form-input" id="rpMethod"><option>Cash</option><option>Bank Transfer</option><option>Check</option><option>Online</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Commercial.saveRentalPayment()">Record</button>`
        );
    },

    saveRentalPayment() {
        const amount = parseFloat(document.getElementById('rpAmount')?.value);
        if (!amount) { App.showToast('Amount required', 'error'); return; }
        const tenantId = document.getElementById('rpTenant')?.value || '';
        const tenant = DataStore.tenants.find(t => t.id === tenantId);
        DataStore.rentalPayments.push({
            id: Utils.generateId('RPAY'),
            tenantId, tenantName: tenant?.businessName || '',
            amount, date: document.getElementById('rpDate')?.value || new Date().toISOString().split('T')[0],
            period: document.getElementById('rpPeriod')?.value || '',
            method: document.getElementById('rpMethod')?.value || 'Cash'
        });
        Database.save(); App.closeModal(); App.showToast('Payment recorded');
        this.renderPayments(document.getElementById('mainContent'));
    }
};
