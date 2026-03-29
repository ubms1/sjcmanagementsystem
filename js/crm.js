/* ========================================
   SJC UBMS - CRM Module
   Customer Relationship Management across all companies
   ======================================== */

const CRM = {
    render(container) {
        const currentCompany = App.currentCompany;
        const customers = (DataStore.customers || []).filter(c => !currentCompany || c.companyId === currentCompany);
        const interactions = (DataStore.interactions || []).filter(i => !currentCompany || i.companyId === currentCompany);
        
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Customer Relationship Management</h2><p>Manage clients, leads, and interactions</p></div>
            <div class="btn-group">
                <button class="btn btn-secondary" onclick="Excel.openExportDialog(['customers'],'Export Customers')"><i class="fas fa-file-excel"></i> Export</button>
                <button class="btn btn-primary" onclick="CRM.addCustomer()"><i class="fas fa-plus"></i> Add Customer</button>
            </div>
        </div>
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-users"></i></div></div><div class="stat-value">${customers.length}</div><div class="stat-label">Total Customers</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-user-check"></i></div></div><div class="stat-value">${customers.filter(c=>c.status==='active').length}</div><div class="stat-label">Active</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-bullseye"></i></div></div><div class="stat-value">${customers.filter(c=>c.type==='lead').length}</div><div class="stat-label">Leads</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-comments"></i></div></div><div class="stat-value">${interactions.length}</div><div class="stat-label">Interactions</div></div>
        </div>

        <div class="tabs mb-3">
            <button class="tab-btn active" onclick="CRM.switchTab(this,'customerList')">Customers</button>
            <button class="tab-btn" onclick="CRM.switchTab(this,'interactionList')">Interactions</button>
        </div>

        <div id="customerList">
            <div class="card"><div class="card-body no-padding">
                ${customers.length === 0 ? '<div class="empty-state"><i class="fas fa-users"></i><h3>No Customers</h3><p>Add your first customer or lead.</p></div>' :
                Utils.buildTable([
                    { label: 'Name', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                    { label: 'Company', render: r => Utils.escapeHtml(r.company || '-') },
                    { label: 'Email', render: r => r.email || '-' },
                    { label: 'Phone', render: r => r.phone || '-' },
                    { label: 'Type', render: r => `<span class="badge-tag ${r.type==='lead'?'badge-warning':'badge-primary'}">${r.type}</span>` },
                    { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                    { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="CRM.editCustomer('${r.id}')" title="Edit"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-info" onclick="CRM.viewHistory('${r.id}')" title="View History"><i class="fas fa-history"></i></button> <button class="btn btn-sm btn-primary" onclick="CRM.logInteraction('${r.id}')" title="Log Interaction"><i class="fas fa-comment-dots"></i></button> <button class="btn btn-sm btn-success" onclick="CRM.createInvoiceFor('${r.id}')" title="Create Invoice"><i class="fas fa-file-invoice-dollar"></i></button>` }
                ], customers)}
            </div></div>
        </div>

        <div id="interactionList" class="hidden">
            <div class="card"><div class="card-body no-padding">
                ${interactions.length === 0 ? '<div class="empty-state"><i class="fas fa-comments"></i><h3>No Interactions</h3><p>Log your first customer interaction.</p></div>' :
                Utils.buildTable([
                    { label: 'Date', render: r => Utils.formatDate(r.date) },
                    { label: 'Customer', render: r => { const c = (DataStore.customers||[]).find(x=>x.id===r.customerId); return c ? Utils.escapeHtml(c.name) : r.customerId; }},
                    { label: 'Type', render: r => `<span class="badge-tag badge-neutral">${r.type}</span>` },
                    { label: 'Subject', render: r => Utils.escapeHtml(r.subject || '-') },
                    { label: 'Notes', render: r => Utils.escapeHtml((r.notes||'').substring(0,60)) + (r.notes?.length>60?'...':'') }
                ], interactions)}
            </div></div>
        </div>`;
    },

    switchTab(btn, tabId) {
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['customerList','interactionList'].forEach(t => { const el = document.getElementById(t); if (el) el.classList.toggle('hidden', t !== tabId); });
    },

    addCustomer() {
        App.showModal('Add Customer', `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="crmName" required></div>
                <div class="form-group"><label>Company/Organization</label><input type="text" class="form-input" id="crmCompany"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="crmEmail"></div>
                <div class="form-group"><label>Phone</label><input type="text" class="form-input" id="crmPhone"></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="crmType"><option value="client">Client</option><option value="lead">Lead</option><option value="prospect">Prospect</option></select></div>
                <div class="form-group"><label>Address</label><input type="text" class="form-input" id="crmAddress"></div>
            </div>
            <div class="form-group"><label>Notes</label><textarea class="form-input" id="crmNotes" rows="2"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="CRM.saveCustomer()">Save</button>`
        );
    },

    saveCustomer() {
        const name = document.getElementById('crmName')?.value?.trim();
        if (!name) { App.showToast('Name required', 'error'); return; }
        if (!DataStore.customers) DataStore.customers = [];
        DataStore.customers.push({
            id: Utils.generateId('CUS'),
            companyId: App.currentCompany || 'sjc',
            name,
            company: document.getElementById('crmCompany')?.value?.trim() || '',
            email: document.getElementById('crmEmail')?.value?.trim() || '',
            phone: document.getElementById('crmPhone')?.value?.trim() || '',
            type: document.getElementById('crmType')?.value || 'client',
            address: document.getElementById('crmAddress')?.value?.trim() || '',
            notes: document.getElementById('crmNotes')?.value?.trim() || '',
            status: 'active',
            createdAt: new Date().toISOString()
        });
        Database.save(); App.closeModal(); App.showToast('Customer added');
        this.render(document.getElementById('mainContent'));
    },

    editCustomer(id) {
        const c = (DataStore.customers||[]).find(x => x.id === id);
        if (!c) return;
        App.showModal('Edit Customer', `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="crmName" value="${Utils.escapeHtml(c.name)}"></div>
                <div class="form-group"><label>Company</label><input type="text" class="form-input" id="crmCompany" value="${Utils.escapeHtml(c.company||'')}"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="crmEmail" value="${c.email||''}"></div>
                <div class="form-group"><label>Phone</label><input type="text" class="form-input" id="crmPhone" value="${c.phone||''}"></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="crmType"><option value="client" ${c.type==='client'?'selected':''}>Client</option><option value="lead" ${c.type==='lead'?'selected':''}>Lead</option><option value="prospect" ${c.type==='prospect'?'selected':''}>Prospect</option></select></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="crmStatus"><option value="active" ${c.status==='active'?'selected':''}>Active</option><option value="inactive" ${c.status==='inactive'?'selected':''}>Inactive</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="CRM.updateCustomer('${id}')">Update</button>`
        );
    },

    updateCustomer(id) {
        const c = (DataStore.customers||[]).find(x => x.id === id);
        if (!c) return;
        c.name = document.getElementById('crmName')?.value?.trim() || c.name;
        c.company = document.getElementById('crmCompany')?.value?.trim() || '';
        c.email = document.getElementById('crmEmail')?.value?.trim() || '';
        c.phone = document.getElementById('crmPhone')?.value?.trim() || '';
        c.type = document.getElementById('crmType')?.value || c.type;
        c.status = document.getElementById('crmStatus')?.value || c.status;
        Database.save(); App.closeModal(); App.showToast('Customer updated');
        this.render(document.getElementById('mainContent'));
    },

    logInteraction(customerId) {
        App.showModal('Log Interaction', `
            <div class="grid-2">
                <div class="form-group"><label>Type</label><select class="form-input" id="intType"><option>Phone Call</option><option>Email</option><option>Meeting</option><option>Site Visit</option><option>Follow-up</option></select></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="intDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="form-group"><label>Subject</label><input type="text" class="form-input" id="intSubject"></div>
            <div class="form-group"><label>Notes</label><textarea class="form-input" id="intNotes" rows="3"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="CRM.saveInteraction('${customerId}')">Log</button>`
        );
    },

    createInvoiceFor(customerId) {
        const c = (DataStore.customers || []).find(x => x.id === customerId);
        if (!c) return;
        App.navigate('invoicing');
        // Slight delay to let the invoicing module render before opening the modal
        setTimeout(() => Invoicing.createInvoice(c.name, c.address || ''), 250);
    },

    viewHistory(customerId) {
        const c = (DataStore.customers || []).find(x => x.id === customerId);
        if (!c) return;
        const invoices = (DataStore.invoices || []).filter(i => i.client === c.name);
        const interactions = (DataStore.interactions || []).filter(i => i.customerId === customerId);
        const crushOrders = (DataStore.crushingOrders || []).filter(o => o.customer === c.name);
        const testOrders = (DataStore.testOrders || []).filter(o => o.client === c.name);
        const projects = (DataStore.projects || []).filter(p => p.client === c.name);

        const invHtml = invoices.length ? Utils.buildTable([
            { label: 'Invoice', render: r => `<strong>${r.id}</strong>` },
            { label: 'Amount', render: r => Utils.formatCurrency(r.amount) },
            { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
            { label: 'Date', render: r => Utils.formatDate(r.date || r.createdAt) }
        ], invoices) : '<p class="text-muted">No invoices found.</p>';

        const intHtml = interactions.length ? Utils.buildTable([
            { label: 'Type', render: r => r.type },
            { label: 'Subject', render: r => Utils.escapeHtml(r.subject || '-') },
            { label: 'Date', render: r => Utils.formatDate(r.date) }
        ], interactions) : '<p class="text-muted">No interactions logged.</p>';

        const crushHtml = crushOrders.length ? Utils.buildTable([
            { label: 'Order', render: r => `<strong>${r.id}</strong>` },
            { label: 'Product', render: r => Utils.escapeHtml(r.productName || '-') },
            { label: 'Amount', render: r => Utils.formatCurrency(r.totalAmount) },
            { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
        ], crushOrders) : '';

        const testHtml = testOrders.length ? Utils.buildTable([
            { label: 'Order', render: r => `<strong>${r.id}</strong>` },
            { label: 'Test', render: r => { const t = DataStore.testServices.find(s=>s.id===r.testServiceId); return t ? Utils.escapeHtml(t.name) : r.testServiceId; }},
            { label: 'Amount', render: r => Utils.formatCurrency(r.totalCost) },
            { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
        ], testOrders) : '';

        const projHtml = projects.length ? Utils.buildTable([
            { label: 'Project', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
            { label: 'Budget', render: r => Utils.formatCurrency(r.budget) },
            { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
        ], projects) : '';

        App.showModal(`Customer History — ${Utils.escapeHtml(c.name)}`, `
            <div class="mb-3"><strong>Company:</strong> ${Utils.escapeHtml(c.company || '-')} &nbsp;|&nbsp; <strong>Contact:</strong> ${Utils.escapeHtml(c.phone || '-')} &nbsp;|&nbsp; <strong>Email:</strong> ${Utils.escapeHtml(c.email || '-')}</div>
            <h4 class="mb-1"><i class="fas fa-file-invoice-dollar"></i> Invoices (${invoices.length})</h4>${invHtml}
            ${crushOrders.length ? `<h4 class="mt-3 mb-1"><i class="fas fa-truck"></i> Quarry Orders (${crushOrders.length})</h4>${crushHtml}` : ''}
            ${testOrders.length ? `<h4 class="mt-3 mb-1"><i class="fas fa-flask"></i> Test Orders (${testOrders.length})</h4>${testHtml}` : ''}
            ${projects.length ? `<h4 class="mt-3 mb-1"><i class="fas fa-hard-hat"></i> Projects (${projects.length})</h4>${projHtml}` : ''}
            <h4 class="mt-3 mb-1"><i class="fas fa-comments"></i> Interactions (${interactions.length})</h4>${intHtml}
        `);
    },

    saveInteraction(customerId) {
        if (!DataStore.interactions) DataStore.interactions = [];
        DataStore.interactions.push({
            id: Utils.generateId('INT'),
            companyId: App.currentCompany || 'sjc',
            customerId,
            type: document.getElementById('intType')?.value || 'Phone Call',
            date: document.getElementById('intDate')?.value || new Date().toISOString().split('T')[0],
            subject: document.getElementById('intSubject')?.value?.trim() || '',
            notes: document.getElementById('intNotes')?.value?.trim() || ''
        });
        Database.save(); App.closeModal(); App.showToast('Interaction logged');
        this.render(document.getElementById('mainContent'));
    }
};
