/* ========================================
   SJC UBMS - Invoicing Module
   Invoice creation and management
   ======================================== */

const Invoicing = {
    render(container) {
        const company = App.currentCompany;
        const invoices = (DataStore.invoices || []).filter(i => !company || (i.companyId || i.company) === company);
        const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
        const paid = invoices.filter(i => i.status === 'paid');
        const paidAmt = paid.reduce((s, i) => s + (i.amount || 0), 0);
        const pending = invoices.filter(i => i.status === 'pending' || i.status === 'sent');
        const overdue = invoices.filter(i => i.status === 'overdue');

        container.innerHTML = `
        <div class="section-header">
            <div><h2>Invoicing</h2><p>${invoices.length} invoices — ${Utils.formatCurrency(total)} total</p></div>
            <div class="btn-group">
                <button class="btn btn-secondary" onclick="Excel.openExportDialog(['invoices'],'Export Invoices')"><i class="fas fa-file-excel"></i> Export</button>
                <button class="btn btn-primary" onclick="Invoicing.createInvoice()"><i class="fas fa-plus"></i> Create Invoice</button>
            </div>
        </div>

        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-file-invoice-dollar"></i></div></div><div class="stat-value">${invoices.length}</div><div class="stat-label">Total Invoices</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div><div class="stat-value">${Utils.formatCurrency(paidAmt)}</div><div class="stat-label">Paid (${paid.length})</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-clock"></i></div></div><div class="stat-value">${pending.length}</div><div class="stat-label">Pending</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-exclamation-triangle"></i></div></div><div class="stat-value">${overdue.length}</div><div class="stat-label">Overdue</div></div>
        </div>

        <div class="card"><div class="card-body no-padding">
            ${invoices.length === 0 ? '<div class="empty-state"><i class="fas fa-file-invoice"></i><h3>No Invoices</h3><p>Create your first invoice.</p></div>' :
            Utils.buildTable([
                { label: 'Invoice #', render: r => `<strong>${r.id}</strong>` },
                { label: 'Client', render: r => Utils.escapeHtml(r.client || '-') },
                { label: 'Description', render: r => Utils.escapeHtml((r.description||'').substring(0,50)) },
                { label: 'Amount', render: r => `<strong>${Utils.formatCurrency(r.amount)}</strong>` },
                { label: 'Date', render: r => Utils.formatDate(r.date) },
                { label: 'Due Date', render: r => Utils.formatDate(r.dueDate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Actions', render: r => `
                    <button class="btn btn-sm" onclick="Invoicing.viewInvoice('${r.id}')" title="View"><i class="fas fa-eye"></i></button>
                    ${r.status!=='paid'?`<button class="btn btn-sm btn-primary" onclick="Invoicing.markPaid('${r.id}')" title="Mark Paid"><i class="fas fa-check"></i></button>`:''}`
                }
            ], invoices)}
        </div></div>`;
    },

    createInvoice(prefillClient = '', prefillAddress = '') {
        const companyId = App.currentCompany || 'sjc';
        const customers = (DataStore.customers || []).filter(c =>
            !companyId || companyId === 'all' || c.companyId === companyId
        );
        const hasCustomers = customers.length > 0;
        const clientField = hasCustomers
            ? `<select class="form-input" id="invClientSelect" onchange="Invoicing.onClientSelect(this)">
                 <option value="">-- Select Customer --</option>
                 ${customers.map(c => `<option value="${Utils.escapeHtml(c.name)}" data-address="${Utils.escapeHtml(c.address || '')}" ${c.name === prefillClient ? 'selected' : ''}>${Utils.escapeHtml(c.name)}${c.company ? ' (' + Utils.escapeHtml(c.company) + ')' : ''}</option>`).join('')}
                 <option value="__manual__">+ Enter name manually…</option>
               </select>
               <input type="text" class="form-input mt-1" id="invClient" placeholder="Client name" value="${Utils.escapeHtml(prefillClient)}" style="${prefillClient ? '' : 'display:none'}">`
            : `<input type="text" class="form-input" id="invClient" placeholder="Client name" value="${Utils.escapeHtml(prefillClient)}" required>`;

        App.showModal('Create Invoice', `
            <div class="grid-2">
                <div class="form-group"><label>Client / Customer *</label>${clientField}</div>
                <div class="form-group"><label>Client Address</label><input type="text" class="form-input" id="invAddress" value="${Utils.escapeHtml(prefillAddress)}"></div>
                <div class="form-group"><label>Invoice Date</label><input type="date" class="form-input" id="invDate" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Due Date</label><input type="date" class="form-input" id="invDue"></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="invDesc" rows="2"></textarea></div>
            <div id="invItems">
                <h4 class="mb-1">Line Items</h4>
                <div class="grid-3 mb-1">
                    <div class="form-group"><label>Item</label><input type="text" class="form-input inv-item-desc"></div>
                    <div class="form-group"><label>Qty</label><input type="number" class="form-input inv-item-qty" min="1" value="1" onchange="Invoicing.calcTotal()"></div>
                    <div class="form-group"><label>Price (₱)</label><input type="number" class="form-input inv-item-price" min="0" step="0.01" onchange="Invoicing.calcTotal()"></div>
                </div>
            </div>
            <button class="btn btn-sm" onclick="Invoicing.addLineItem()"><i class="fas fa-plus"></i> Add Line</button>
            <button class="btn btn-sm btn-secondary" onclick="Invoicing.pickFromCatalog()" style="margin-left:6px"><i class="fas fa-box-open"></i> Pick from Catalog</button>
            <div class="inv-form-total">Total: ₱<span id="invTotal">0.00</span></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Invoicing.saveInvoice()">Create Invoice</button>`
        );
        // If pre-filled from CRM, select the matching dropdown option
        if (prefillClient && hasCustomers) {
            setTimeout(() => {
                const sel = document.getElementById('invClientSelect');
                if (sel) sel.value = prefillClient;
            }, 50);
        }
    },

    onClientSelect(sel) {
        const manualInput = document.getElementById('invClient');
        const addrInput = document.getElementById('invAddress');
        if (!manualInput) return;
        if (sel.value === '__manual__') {
            manualInput.style.display = '';
            manualInput.value = '';
            manualInput.focus();
        } else {
            manualInput.style.display = 'none';
            manualInput.value = '';
            const opt = sel.options[sel.selectedIndex];
            if (addrInput && opt) addrInput.value = opt.dataset.address || '';
        }
    },

    addLineItem() {
        const container = document.getElementById('invItems');
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'grid-3 inv-line-row';
        row.innerHTML = `
            <div class="form-group"><input type="text" class="form-input inv-item-desc" placeholder="Description"></div>
            <div class="form-group"><input type="number" class="form-input inv-item-qty" min="1" value="1" onchange="Invoicing.calcTotal()"></div>
            <div class="form-group"><input type="number" class="form-input inv-item-price" min="0" step="0.01" onchange="Invoicing.calcTotal()"></div>`;
        container.appendChild(row);
    },

    pickFromCatalog() {
        if (typeof Catalog === 'undefined') { App.showToast('Catalog module not loaded', 'error'); return; }
        const companyId = App.currentCompany;
        Catalog.openPickerModal('Invoicing.addLineFromCatalog', companyId);
    },

    addLineFromCatalog(id, name, price, unit) {
        App.closeModal();
        const container = document.getElementById('invItems');
        if (!container) return;
        // Try to fill in first empty line item
        const descs = container.querySelectorAll('.inv-item-desc');
        const prices = container.querySelectorAll('.inv-item-price');
        for (let i = 0; i < descs.length; i++) {
            if (!descs[i].value) {
                descs[i].value = name;
                if (prices[i]) { prices[i].value = price; }
                Invoicing.calcTotal();
                return;
            }
        }
        // Otherwise add new line
        const row = document.createElement('div');
        row.className = 'grid-3 inv-line-row';
        row.innerHTML = `
            <div class="form-group"><input type="text" class="form-input inv-item-desc" value="${Utils.escapeHtml(name)}"></div>
            <div class="form-group"><input type="number" class="form-input inv-item-qty" min="1" value="1" onchange="Invoicing.calcTotal()"></div>
            <div class="form-group"><input type="number" class="form-input inv-item-price" min="0" step="0.01" value="${price}" onchange="Invoicing.calcTotal()"></div>`;
        container.appendChild(row);
        Invoicing.calcTotal();
    },

    calcTotal() {
        const qtys = document.querySelectorAll('.inv-item-qty');
        const prices = document.querySelectorAll('.inv-item-price');
        let total = 0;
        qtys.forEach((q, i) => { total += (parseFloat(q.value)||0) * (parseFloat(prices[i]?.value)||0); });
        const el = document.getElementById('invTotal');
        if (el) el.textContent = total.toFixed(2);
    },

    saveInvoice() {
        const clientSelect = document.getElementById('invClientSelect');
        const clientInput = document.getElementById('invClient');
        const client = (clientSelect && clientSelect.value && clientSelect.value !== '__manual__')
            ? clientSelect.value
            : (clientInput?.value?.trim() || '');
        if (!client) { App.showToast('Client required', 'error'); return; }
        const descs = document.querySelectorAll('.inv-item-desc');
        const qtys = document.querySelectorAll('.inv-item-qty');
        const prices = document.querySelectorAll('.inv-item-price');
        const items = []; let total = 0;
        descs.forEach((d, i) => {
            const qty = parseFloat(qtys[i]?.value) || 0;
            const price = parseFloat(prices[i]?.value) || 0;
            if (qty > 0 && price > 0) { items.push({ description: d.value?.trim() || '', qty, price, subtotal: qty * price }); total += qty * price; }
        });
        if (total <= 0) { App.showToast('Add at least one line item', 'error'); return; }

        DataStore.invoices.push({
            id: Utils.generateId('INV'),
            companyId: App.currentCompany || 'sjc',
            client,
            address: document.getElementById('invAddress')?.value?.trim() || '',
            date: document.getElementById('invDate')?.value || new Date().toISOString().split('T')[0],
            dueDate: document.getElementById('invDue')?.value || '',
            description: document.getElementById('invDesc')?.value?.trim() || '',
            items, amount: total, status: 'pending'
        });
        Database.save(); App.closeModal(); App.showToast('Invoice created');
        this.render(document.getElementById('mainContent'));
    },

    viewInvoice(id) {
        const inv = (DataStore.invoices||[]).find(i => i.id === id);
        if (!inv) return;
        const co = DataStore.companies[inv.companyId || inv.company];
        App.showModal(`Invoice ${inv.id}`, `
            <div class="inv-header">
                <div class="inv-header-row">
                    <div><h3>${co ? Utils.escapeHtml(co.name) : 'SJC'}</h3><span class="text-sm text-muted">${co?.address||''}</span></div>
                    <div class="text-right"><h3 class="inv-title">INVOICE</h3><span class="inv-id">${inv.id}</span></div>
                </div>
            </div>
            <div class="grid-2 mb-3 inv-info">
                <div><strong>Bill To:</strong><br>${Utils.escapeHtml(inv.client)}<br>${Utils.escapeHtml(inv.address||'')}</div>
                <div class="text-right"><strong>Date:</strong> ${Utils.formatDate(inv.date)}<br><strong>Due:</strong> ${Utils.formatDate(inv.dueDate)}<br><strong>Status:</strong> <span class="badge-tag ${Utils.getStatusClass(inv.status)}">${inv.status}</span></div>
            </div>
            ${inv.items?.length > 0 ? `<div class="table-wrapper"><table class="table"><thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>
                ${inv.items.map(it=>`<tr><td>${Utils.escapeHtml(it.description)}</td><td>${it.qty}</td><td>${Utils.formatCurrency(it.price)}</td><td>${Utils.formatCurrency(it.subtotal)}</td></tr>`).join('')}
            </tbody></table></div>` : `<p>${Utils.escapeHtml(inv.description||'')}</p>`}
            <div class="inv-total">Total: ${Utils.formatCurrency(inv.amount)}</div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
             <button class="btn btn-primary" onclick="Invoicing.printInvoice('${inv.id}')"><i class="fas fa-print"></i> Print</button>`
        );
    },

    printInvoice(id) {
        const inv = (DataStore.invoices||[]).find(i => i.id === id);
        if (!inv) return;
        const co = DataStore.companies[inv.companyId || inv.company];
        const coName = co ? Utils.escapeHtml(co.name) : 'SJC Unified Business Management System';
        const coAddress = Utils.escapeHtml(co?.address || '');
        const itemsHtml = inv.items?.length > 0
            ? inv.items.map(it => `<tr><td>${Utils.escapeHtml(it.description)}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${Utils.formatCurrency(it.price)}</td><td style="text-align:right">${Utils.formatCurrency(it.subtotal)}</td></tr>`).join('')
            : `<tr><td colspan="4">${Utils.escapeHtml(inv.description||'')}</td></tr>`;
        const html = `
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
  .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a3a6b; padding-bottom: 16px; margin-bottom: 24px; }
  .co-name { font-size: 20px; font-weight: 700; color: #1a3a6b; }
  .inv-label { font-size: 32px; font-weight: 900; color: #1a3a6b; letter-spacing: 2px; }
  .inv-id { font-size: 14px; color: #666; }
  .info { display: flex; justify-content: space-between; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a3a6b; color: #fff; padding: 8px 12px; text-align: left; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  .total-row { font-size: 18px; font-weight: 700; text-align: right; margin-top: 16px; border-top: 2px solid #1a3a6b; padding-top: 8px; }
  .badge { padding: 2px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; }
  .paid { background: #d1fae5; color: #065f46; } .pending { background: #fef3c7; color: #92400e; } .overdue { background: #fee2e2; color: #7f1d1d; }
</style>
<div class="hdr">
  <div><div class="co-name">${coName}</div><div style="font-size:12px;color:#888">${coAddress}</div></div>
  <div style="text-align:right"><div class="inv-label">INVOICE</div><div class="inv-id"># ${Utils.escapeHtml(inv.id)}</div></div>
</div>
<div class="info">
  <div><strong>Bill To:</strong><br>${Utils.escapeHtml(inv.client)}<br><span style="font-size:12px;color:#666">${Utils.escapeHtml(inv.address||'')}</span></div>
  <div style="text-align:right">
    <div><strong>Date:</strong> ${new Date(inv.date).toLocaleDateString('en-PH')}</div>
    <div><strong>Due:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-PH') : '—'}</div>
    <div><strong>Status:</strong> <span class="badge ${inv.status}">${(inv.status||'').toUpperCase()}</span></div>
  </div>
</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Subtotal</th></tr></thead>
  <tbody>${itemsHtml}</tbody>
</table>
<div class="total-row">Total Amount: ${Utils.formatCurrency(inv.amount)}</div>`;
        Utils.printPreview(html, `Invoice ${inv.id}`);
    },

    markPaid(id) {
        const inv = (DataStore.invoices||[]).find(i => i.id === id);
        if (!inv) return;
        inv.status = 'paid';
        inv.paidDate = new Date().toISOString().split('T')[0];
        Database.save(); App.showToast('Invoice marked as paid');
        this.render(document.getElementById('mainContent'));
    }
};
