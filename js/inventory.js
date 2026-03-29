/* ========================================
   SJC UBMS - Inventory Module
   Inventory tracking with type-specific categories
   ======================================== */

const Inventory = {
    render(container) {
        const company = App.currentCompany;
        if (!DataStore.inventoryItems) DataStore.inventoryItems = [];
        const items = DataStore.inventoryItems.filter(i => !company || i.companyId === company);
        const categories = company && DataStore.inventoryCategories ? (DataStore.inventoryCategories[company] || []) : [];
        const totalValue = items.reduce((s, i) => s + ((i.quantity || 0) * (i.unitCost || 0)), 0);
        const lowStock = items.filter(i => i.quantity <= (i.reorderLevel || 5));

        container.innerHTML = `
        <div class="section-header">
            <div><h2>Inventory Management</h2><p>${items.length} items — Value: ${Utils.formatCurrency(totalValue)}</p></div>
            <button class="btn btn-primary" onclick="Inventory.addItem()"><i class="fas fa-plus"></i> Add Item</button>
        </div>

        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-boxes"></i></div></div><div class="stat-value">${items.length}</div><div class="stat-label">Total Items</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalValue)}</div><div class="stat-label">Total Value</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-exclamation-circle"></i></div></div><div class="stat-value">${lowStock.length}</div><div class="stat-label">Low Stock</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-layer-group"></i></div></div><div class="stat-value">${[...new Set(items.map(i=>i.category))].length}</div><div class="stat-label">Categories</div></div>
        </div>

        ${lowStock.length > 0 ? `
        <div class="card mb-3 card-alert-danger"><div class="card-body">
            <h3 class="text-danger mb-1"><i class="fas fa-exclamation-triangle"></i> Low Stock Alert</h3>
            <div class="flex-wrap-gap">
                ${lowStock.map(i => `<span class="badge-tag badge-danger">${Utils.escapeHtml(i.name)} (${i.quantity} left)</span>`).join('')}
            </div>
        </div></div>` : ''}

        <div class="card"><div class="card-body no-padding">
            ${items.length === 0 ? '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No Inventory Items</h3><p>Add items to track inventory.</p></div>' :
            Utils.buildTable([
                { label: 'Item', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                { label: 'Category', render: r => `<span class="badge-tag badge-neutral">${Utils.escapeHtml(r.category||'-')}</span>` },
                { label: 'Qty', render: r => `<span class="fw-bold ${r.quantity<=(r.reorderLevel||5)?'text-danger':''}">${r.quantity}</span>` },
                { label: 'Unit', render: r => r.unit || '-' },
                { label: 'Unit Cost', render: r => Utils.formatCurrency(r.unitCost || 0) },
                { label: 'Value', render: r => Utils.formatCurrency((r.quantity||0) * (r.unitCost||0)) },
                { label: 'Location', render: r => Utils.escapeHtml(r.location || '-') },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="Inventory.adjustStock('${r.id}')"><i class="fas fa-exchange-alt"></i></button> <button class="btn btn-sm" onclick="Inventory.editItem('${r.id}')"><i class="fas fa-edit"></i></button>` }
            ], items)}
        </div></div>`;
    },

    addItem() {
        const company = App.currentCompany;
        const categories = company && DataStore.inventoryCategories ? (DataStore.inventoryCategories[company] || []) : ['General','Materials','Equipment','Supplies'];
        App.showModal('Add Inventory Item', `
            <div class="grid-2">
                <div class="form-group"><label>Item Name</label><input type="text" class="form-input" id="invName" required></div>
                <div class="form-group"><label>Category</label><select class="form-input" id="invCat">${categories.map(c=>`<option>${c}</option>`).join('')}<option>Other</option></select></div>
                <div class="form-group"><label>Quantity</label><input type="number" class="form-input" id="invQty" min="0" value="0"></div>
                <div class="form-group"><label>Unit</label><select class="form-input" id="invUnit"><option>pcs</option><option>kg</option><option>liters</option><option>bags</option><option>cu.m.</option><option>sets</option><option>rolls</option><option>boxes</option></select></div>
                <div class="form-group"><label>Unit Cost (₱)</label><input type="number" class="form-input" id="invCost" min="0" step="0.01"></div>
                <div class="form-group"><label>Reorder Level</label><input type="number" class="form-input" id="invReorder" min="0" value="5"></div>
                <div class="form-group"><label>Location/Warehouse</label><input type="text" class="form-input" id="invLoc"></div>
                <div class="form-group"><label>Supplier</label><input type="text" class="form-input" id="invSupplier"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Inventory.saveItem()">Save</button>`
        );
    },

    saveItem() {
        const name = document.getElementById('invName')?.value?.trim();
        if (!name) { App.showToast('Name required', 'error'); return; }
        DataStore.inventoryItems.push({
            id: Utils.generateId('ITM'),
            companyId: App.currentCompany || 'sjc',
            name,
            category: document.getElementById('invCat')?.value || 'General',
            quantity: parseInt(document.getElementById('invQty')?.value) || 0,
            unit: document.getElementById('invUnit')?.value || 'pcs',
            unitCost: parseFloat(document.getElementById('invCost')?.value) || 0,
            reorderLevel: parseInt(document.getElementById('invReorder')?.value) || 5,
            location: document.getElementById('invLoc')?.value?.trim() || '',
            supplier: document.getElementById('invSupplier')?.value?.trim() || ''
        });
        Database.save(); App.closeModal(); App.showToast('Item added');
        this.render(document.getElementById('mainContent'));
    },

    editItem(id) {
        const item = DataStore.inventoryItems.find(x => x.id === id);
        if (!item) return;
        App.showModal('Edit Item', `
            <div class="grid-2">
                <div class="form-group"><label>Item Name</label><input type="text" class="form-input" id="invName" value="${Utils.escapeHtml(item.name)}"></div>
                <div class="form-group"><label>Unit Cost (₱)</label><input type="number" class="form-input" id="invCost" value="${item.unitCost||0}"></div>
                <div class="form-group"><label>Reorder Level</label><input type="number" class="form-input" id="invReorder" value="${item.reorderLevel||5}"></div>
                <div class="form-group"><label>Location</label><input type="text" class="form-input" id="invLoc" value="${Utils.escapeHtml(item.location||'')}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Inventory.updateItem('${id}')">Update</button>`
        );
    },

    updateItem(id) {
        const item = DataStore.inventoryItems.find(x => x.id === id);
        if (!item) return;
        item.name = document.getElementById('invName')?.value?.trim() || item.name;
        item.unitCost = parseFloat(document.getElementById('invCost')?.value) || item.unitCost;
        item.reorderLevel = parseInt(document.getElementById('invReorder')?.value) || item.reorderLevel;
        item.location = document.getElementById('invLoc')?.value?.trim() || '';
        Database.save(); App.closeModal(); App.showToast('Item updated');
        this.render(document.getElementById('mainContent'));
    },

    adjustStock(id) {
        const item = DataStore.inventoryItems.find(x => x.id === id);
        if (!item) return;
        App.showModal('Adjust Stock', `
            <h4 class="mb-2">${Utils.escapeHtml(item.name)} — Current: ${item.quantity} ${item.unit}</h4>
            <div class="grid-2">
                <div class="form-group"><label>Adjustment Type</label><select class="form-input" id="adjType"><option value="add">Stock In (+)</option><option value="subtract">Stock Out (-)</option></select></div>
                <div class="form-group"><label>Quantity</label><input type="number" class="form-input" id="adjQty" min="1" value="1"></div>
            </div>
            <div class="form-group"><label>Reason</label><input type="text" class="form-input" id="adjReason" placeholder="e.g. Purchase, Used in project"></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Inventory.saveAdjustment('${id}')">Adjust</button>`
        );
    },

    saveAdjustment(id) {
        const item = DataStore.inventoryItems.find(x => x.id === id);
        if (!item) return;
        const type = document.getElementById('adjType')?.value;
        const qty = parseInt(document.getElementById('adjQty')?.value) || 0;
        if (type === 'add') item.quantity += qty;
        else item.quantity = Math.max(0, item.quantity - qty);
        Database.save(); App.closeModal(); App.showToast(`Stock adjusted: ${item.name} = ${item.quantity}`);
        this.render(document.getElementById('mainContent'));
    }
};
