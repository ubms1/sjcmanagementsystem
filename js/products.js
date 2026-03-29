/* ========================================
   SJC UBMS - Products & Services Catalog
   Unified catalog for all 6 companies
   Link to POS, Invoicing, and Inventory
   ======================================== */

const Catalog = {

    // ----------------------------------------------------------------
    //  HELPERS – aggregate all products/services from all sources
    // ----------------------------------------------------------------
    _allItems() {
        const items = [];

        // 1. Quarry aggregates (DataStore.aggregateProducts)
        (DataStore.aggregateProducts || []).forEach(p => items.push({
            _source: 'aggregateProducts',
            _sourceId: p.id,
            id: p.id,
            companyId: 'crushing',
            companyName: 'SJC Crushing Plant',
            type: 'product',
            name: p.name,
            description: '',
            category: p.category || 'Aggregates',
            price: p.price || p.pricePerUnit || 0,
            unit: p.unit || 'cu.m',
            sku: p.id,
            stock: p.stock !== undefined ? p.stock : null,
            lowStockThreshold: 50,
            active: true,
            createdAt: p.createdAt || null
        }));

        // 2. Driving courses (DataStore.drivingCourses)
        (DataStore.drivingCourses || []).forEach(c => items.push({
            _source: 'drivingCourses',
            _sourceId: c.id,
            id: c.id,
            companyId: 'mileage',
            companyName: 'Mileage Dev\'t & Training Center',
            type: 'service',
            name: c.name,
            description: c.description || '',
            category: c.category || 'Driving Course',
            price: c.price || c.fee || 0,
            unit: 'enrollment',
            sku: c.id,
            stock: null,
            lowStockThreshold: null,
            active: true,
            createdAt: c.createdAt || null
        }));

        // 3. Test services (DataStore.testServices)
        (DataStore.testServices || []).forEach(s => items.push({
            _source: 'testServices',
            _sourceId: s.id,
            id: s.id,
            companyId: 'megatesting',
            companyName: 'Megatesting Center Inc.',
            type: 'service',
            name: s.name,
            description: s.description || '',
            category: s.category || 'Testing',
            price: s.price || 0,
            unit: 'test',
            sku: s.id,
            stock: null,
            lowStockThreshold: null,
            active: true,
            createdAt: s.createdAt || null
        }));

        // 4. Custom catalog items (DataStore.catalog)
        (DataStore.catalog || []).forEach(c => {
            const co = DataStore.companies[c.companyId];
            items.push({
                _source: 'catalog',
                _sourceId: c.id,
                id: c.id,
                companyId: c.companyId,
                companyName: co ? co.name : c.companyId,
                type: c.type || 'service',
                name: c.name,
                description: c.description || '',
                category: c.category || 'General',
                price: c.price || 0,
                unit: c.unit || 'service',
                sku: c.sku || c.id,
                stock: c.stock !== undefined ? c.stock : null,
                lowStockThreshold: c.lowStockThreshold || null,
                active: c.active !== false,
                createdAt: c.createdAt || null
            });
        });

        return items;
    },

    /** Returns catalog items available for a given companyId (or all). Used by POS/Invoicing. */
    getForCompany(companyId, onlyType = null) {
        let items = this._allItems();
        if (companyId) items = items.filter(i => i.companyId === companyId || i.companyId === 'all');
        if (onlyType) items = items.filter(i => i.type === onlyType);
        return items.filter(i => i.active !== false);
    },

    // ----------------------------------------------------------------
    //  RENDER – main page
    // ----------------------------------------------------------------
    render(container) {
        const all = this._allItems();
        const products = all.filter(i => i.type === 'product');
        const services = all.filter(i => i.type === 'service');
        const lowStock = all.filter(i => i.stock !== null && i.stock < (i.lowStockThreshold || 50));
        const companies = [...new Set(all.map(i => i.companyId))];

        container.innerHTML = `
        <div class="section-header">
            <div>
                <h2><i class="fas fa-box-open"></i> Products &amp; Services Catalog</h2>
                <p>${all.length} items across ${companies.length} companies &mdash; ${products.length} products, ${services.length} services</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-secondary" onclick="Catalog.exportCatalog()"><i class="fas fa-file-excel"></i> Export</button>
                <button class="btn btn-primary" onclick="Catalog.addItem()"><i class="fas fa-plus"></i> Add Item</button>
            </div>
        </div>

        <!-- Stats -->
        <div class="grid-4 mb-3">
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon blue"><i class="fas fa-cubes"></i></div></div>
                <div class="stat-value">${products.length}</div>
                <div class="stat-label">Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon green"><i class="fas fa-concierge-bell"></i></div></div>
                <div class="stat-value">${services.length}</div>
                <div class="stat-label">Services</div>
            </div>
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon orange"><i class="fas fa-exclamation-triangle"></i></div></div>
                <div class="stat-value">${lowStock.length}</div>
                <div class="stat-label">Low Stock</div>
            </div>
            <div class="stat-card">
                <div class="stat-header"><div class="stat-icon purple"><i class="fas fa-building"></i></div></div>
                <div class="stat-value">${companies.length}</div>
                <div class="stat-label">Companies</div>
            </div>
        </div>

        ${lowStock.length > 0 ? `
        <div class="card mb-3 card-alert-danger"><div class="card-body">
            <h3 class="text-danger mb-1"><i class="fas fa-exclamation-triangle"></i> Low Stock Alert</h3>
            <div class="flex-wrap-gap">
                ${lowStock.map(i => `<span class="badge-tag badge-danger">${Utils.escapeHtml(i.name)} (${i.stock} left)</span>`).join('')}
            </div>
        </div></div>` : ''}

        <!-- Tabs -->
        <div class="tab-bar mb-3">
            <button class="tab-btn active" onclick="Catalog._switchTab(this,'tab-all')">All (${all.length})</button>
            <button class="tab-btn" onclick="Catalog._switchTab(this,'tab-products')">Products (${products.length})</button>
            <button class="tab-btn" onclick="Catalog._switchTab(this,'tab-services')">Services (${services.length})</button>
            <button class="tab-btn" onclick="Catalog._switchTab(this,'tab-quarry')">Quarry (${all.filter(i=>i.companyId==='crushing').length})</button>
            <button class="tab-btn" onclick="Catalog._switchTab(this,'tab-driving')">Driving (${all.filter(i=>i.companyId==='mileage').length})</button>
            <button class="tab-btn" onclick="Catalog._switchTab(this,'tab-testing')">Testing (${all.filter(i=>i.companyId==='megatesting').length})</button>
            <button class="tab-btn" onclick="Catalog._switchTab(this,'tab-custom')">Custom (${(DataStore.catalog||[]).length})</button>
        </div>

        <!-- Search -->
        <div class="form-group mb-3">
            <input type="text" id="catalogSearch" class="form-input" placeholder="Search products and services..." oninput="Catalog._search(this.value)">
        </div>

        <!-- Tab panels -->
        <div id="tab-all" class="catalog-tab">${this._renderGrid(all)}</div>
        <div id="tab-products" class="catalog-tab hidden">${this._renderGrid(products)}</div>
        <div id="tab-services" class="catalog-tab hidden">${this._renderGrid(services)}</div>
        <div id="tab-quarry" class="catalog-tab hidden">${this._renderGrid(all.filter(i=>i.companyId==='crushing'))}</div>
        <div id="tab-driving" class="catalog-tab hidden">${this._renderGrid(all.filter(i=>i.companyId==='mileage'))}</div>
        <div id="tab-testing" class="catalog-tab hidden">${this._renderGrid(all.filter(i=>i.companyId==='megatesting'))}</div>
        <div id="tab-custom" class="catalog-tab hidden">${this._renderGrid(all.filter(i=>i._source==='catalog'))}</div>`;
    },

    _renderGrid(items) {
        if (items.length === 0) return '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No Items</h3><p>No products or services here yet.</p></div>';
        return `<div class="catalog-grid">${items.map(i => this._renderCard(i)).join('')}</div>`;
    },

    _renderCard(item) {
        const sourceLabel = { aggregateProducts: 'Quarry', drivingCourses: 'Driving School', testServices: 'Testing Lab', catalog: 'Custom' };
        const sourceColor = { aggregateProducts: 'orange', drivingCourses: 'teal', testServices: 'red', catalog: 'blue' };
        const typeClass = item.type === 'product' ? 'catalog-badge-product' : 'catalog-badge-service';
        const stockHtml = item.stock !== null
            ? `<span class="catalog-stock ${item.stock < (item.lowStockThreshold || 50) ? 'stock-low' : 'stock-ok'}"><i class="fas fa-warehouse"></i> ${item.stock} ${item.unit}</span>`
            : '';
        const canEdit = item._source === 'catalog';
        return `
        <div class="catalog-card" data-search="${Utils.escapeHtml((item.name + ' ' + item.category + ' ' + item.companyName).toLowerCase())}">
            <div class="catalog-card-top">
                <span class="badge-tag badge-${sourceColor[item._source] || 'blue'}">${sourceLabel[item._source] || 'Custom'}</span>
                <span class="catalog-type-badge ${typeClass}">${item.type === 'product' ? '<i class="fas fa-cube"></i> Product' : '<i class="fas fa-concierge-bell"></i> Service'}</span>
            </div>
            <div class="catalog-card-body">
                <div class="catalog-company">${Utils.escapeHtml(item.companyName)}</div>
                <h4 class="catalog-item-name">${Utils.escapeHtml(item.name)}</h4>
                <div class="catalog-category"><i class="fas fa-tag"></i> ${Utils.escapeHtml(item.category)}</div>
                ${item.description ? `<p class="catalog-desc">${Utils.escapeHtml(item.description.substring(0,80))}${item.description.length > 80 ? '...' : ''}</p>` : ''}
                <div class="catalog-price">${Utils.formatCurrency(item.price)} <span class="catalog-unit">/ ${item.unit}</span></div>
                ${stockHtml}
            </div>
            <div class="catalog-card-actions">
                <button class="btn btn-sm btn-primary" onclick="Catalog._sellInPOS('${item._sourceId}','${item.name.replace(/'/g,"\\'")}',${item.price},'${item.unit}')" title="Sell in POS"><i class="fas fa-cash-register"></i> POS</button>
                <button class="btn btn-sm" onclick="Catalog._addToInvoice('${item._sourceId}','${item.name.replace(/'/g,"\\'")}',${item.price})" title="Add to Invoice"><i class="fas fa-file-invoice"></i> Invoice</button>
                ${canEdit ? `<button class="btn btn-sm" onclick="Catalog.editItem('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>` : ''}
                ${canEdit ? `<button class="btn btn-sm btn-danger" onclick="Catalog.deleteItem('${item.id}')" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                ${!canEdit ? `<button class="btn btn-sm" onclick="Catalog._viewSource('${item._source}','${item._sourceId}')" title="View in source module"><i class="fas fa-external-link-alt"></i></button>` : ''}
            </div>
        </div>`;
    },

    _switchTab(btn, tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.catalog-tab').forEach(t => t.classList.add('hidden'));
        btn.classList.add('active');
        const panel = document.getElementById(tabId);
        if (panel) panel.classList.remove('hidden');
        // Re-apply search filter
        const q = document.getElementById('catalogSearch')?.value || '';
        if (q) this._search(q);
    },

    _search(q) {
        const lq = q.toLowerCase();
        // Only search within visible tab
        const visibleTab = document.querySelector('.catalog-tab:not(.hidden)');
        if (!visibleTab) return;
        visibleTab.querySelectorAll('.catalog-card').forEach(card => {
            const match = !lq || (card.dataset.search || '').includes(lq);
            card.style.display = match ? '' : 'none';
        });
    },

    _sellInPOS(id, name, price, unit) {
        App.navigate('pos');
        // Add item to cart after POS renders
        setTimeout(() => {
            if (typeof POS !== 'undefined') {
                POS.addToCart(id, name, price, unit);
                App.showToast(`${name} added to POS cart`, 'success');
            }
        }, 300);
    },

    _addToInvoice(id, name, price) {
        App.navigate('invoicing');
        setTimeout(() => {
            if (typeof Invoicing !== 'undefined') {
                Invoicing.createInvoice();
                // Pre-fill first line item
                setTimeout(() => {
                    const descInputs = document.querySelectorAll('.inv-item-desc');
                    const priceInputs = document.querySelectorAll('.inv-item-price');
                    if (descInputs[0]) descInputs[0].value = name;
                    if (priceInputs[0]) { priceInputs[0].value = price; Invoicing.calcTotal(); }
                }, 200);
            }
        }, 300);
    },

    _viewSource(source, id) {
        const routeMap = {
            aggregateProducts: 'quarry-products',
            drivingCourses: 'courses',
            testServices: 'test-services'
        };
        const route = routeMap[source];
        if (route) App.navigate(route);
    },

    // ----------------------------------------------------------------
    //  ADD ITEM (custom catalog)
    // ----------------------------------------------------------------
    addItem() {
        const companyOptions = Object.values(DataStore.companies)
            .map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('');
        App.showModal('Add Product / Service', `
            <div class="grid-2">
                <div class="form-group"><label>Name *</label><input type="text" class="form-input" id="catName" required></div>
                <div class="form-group"><label>Type</label>
                    <select class="form-input" id="catType">
                        <option value="product">Product (physical item)</option>
                        <option value="service">Service</option>
                    </select>
                </div>
                <div class="form-group"><label>Company *</label>
                    <select class="form-input" id="catCompany">
                        <option value="all">All Companies</option>
                        ${companyOptions}
                    </select>
                </div>
                <div class="form-group"><label>Category</label><input type="text" class="form-input" id="catCategory" placeholder="e.g. Materials, Consultation…"></div>
                <div class="form-group"><label>Price (₱) *</label><input type="number" class="form-input" id="catPrice" min="0" step="0.01"></div>
                <div class="form-group"><label>Unit</label><input type="text" class="form-input" id="catUnit" placeholder="e.g. pcs, cu.m, session…" value="service"></div>
                <div class="form-group"><label>SKU / Code</label><input type="text" class="form-input" id="catSku" placeholder="Optional code"></div>
                <div class="form-group"><label>Stock (leave blank for services)</label><input type="number" class="form-input" id="catStock" min="0" placeholder="blank = N/A"></div>
                <div class="form-group"><label>Low Stock Alert Qty</label><input type="number" class="form-input" id="catLowStock" min="0" placeholder="e.g. 10"></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="catDesc" rows="2" placeholder="Short description…"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Catalog.saveItem()">Save Item</button>`
        );
    },

    saveItem() {
        const name = document.getElementById('catName')?.value?.trim();
        const price = parseFloat(document.getElementById('catPrice')?.value);
        if (!name) { App.showToast('Name is required', 'error'); return; }
        if (isNaN(price) || price < 0) { App.showToast('Valid price required', 'error'); return; }
        const stockVal = document.getElementById('catStock')?.value?.trim();
        const lowStockVal = document.getElementById('catLowStock')?.value?.trim();
        if (!DataStore.catalog) DataStore.catalog = [];
        DataStore.catalog.push({
            id: Utils.generateId('CAT'),
            companyId: document.getElementById('catCompany')?.value || 'all',
            type: document.getElementById('catType')?.value || 'service',
            name,
            description: document.getElementById('catDesc')?.value?.trim() || '',
            category: document.getElementById('catCategory')?.value?.trim() || 'General',
            price,
            unit: document.getElementById('catUnit')?.value?.trim() || 'service',
            sku: document.getElementById('catSku')?.value?.trim() || '',
            stock: stockVal !== '' && stockVal !== undefined ? parseInt(stockVal) : null,
            lowStockThreshold: lowStockVal !== '' && lowStockVal !== undefined ? parseInt(lowStockVal) : null,
            active: true,
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast(`${name} added to catalog`, 'success');
        this.render(document.getElementById('mainContent'));
    },

    editItem(id) {
        const item = (DataStore.catalog || []).find(c => c.id === id);
        if (!item) return;
        const companyOptions = Object.values(DataStore.companies)
            .map(c => `<option value="${c.id}" ${c.id === item.companyId ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('');
        App.showModal('Edit Product / Service', `
            <div class="grid-2">
                <div class="form-group"><label>Name *</label><input type="text" class="form-input" id="catName" value="${Utils.escapeHtml(item.name)}" required></div>
                <div class="form-group"><label>Type</label>
                    <select class="form-input" id="catType">
                        <option value="product" ${item.type === 'product' ? 'selected' : ''}>Product</option>
                        <option value="service" ${item.type === 'service' ? 'selected' : ''}>Service</option>
                    </select>
                </div>
                <div class="form-group"><label>Company</label>
                    <select class="form-input" id="catCompany">
                        <option value="all" ${item.companyId === 'all' ? 'selected' : ''}>All Companies</option>
                        ${companyOptions}
                    </select>
                </div>
                <div class="form-group"><label>Category</label><input type="text" class="form-input" id="catCategory" value="${Utils.escapeHtml(item.category || '')}"></div>
                <div class="form-group"><label>Price (₱)</label><input type="number" class="form-input" id="catPrice" value="${item.price}" min="0" step="0.01"></div>
                <div class="form-group"><label>Unit</label><input type="text" class="form-input" id="catUnit" value="${Utils.escapeHtml(item.unit || 'service')}"></div>
                <div class="form-group"><label>SKU</label><input type="text" class="form-input" id="catSku" value="${Utils.escapeHtml(item.sku || '')}"></div>
                <div class="form-group"><label>Stock</label><input type="number" class="form-input" id="catStock" value="${item.stock !== null && item.stock !== undefined ? item.stock : ''}"></div>
                <div class="form-group"><label>Low Stock Alert Qty</label><input type="number" class="form-input" id="catLowStock" value="${item.lowStockThreshold || ''}"></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="catDesc" rows="2">${Utils.escapeHtml(item.description || '')}</textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Catalog.updateItem('${id}')">Update</button>`
        );
    },

    updateItem(id) {
        const item = (DataStore.catalog || []).find(c => c.id === id);
        if (!item) return;
        const name = document.getElementById('catName')?.value?.trim();
        const price = parseFloat(document.getElementById('catPrice')?.value);
        if (!name) { App.showToast('Name required', 'error'); return; }
        const stockVal = document.getElementById('catStock')?.value?.trim();
        const lowStockVal = document.getElementById('catLowStock')?.value?.trim();
        item.name = name;
        item.type = document.getElementById('catType')?.value || item.type;
        item.companyId = document.getElementById('catCompany')?.value || item.companyId;
        item.category = document.getElementById('catCategory')?.value?.trim() || item.category;
        item.price = isNaN(price) ? item.price : price;
        item.unit = document.getElementById('catUnit')?.value?.trim() || item.unit;
        item.sku = document.getElementById('catSku')?.value?.trim() || item.sku;
        item.stock = stockVal !== '' ? parseInt(stockVal) : null;
        item.lowStockThreshold = lowStockVal !== '' ? parseInt(lowStockVal) : null;
        item.description = document.getElementById('catDesc')?.value?.trim() || '';
        Database.save();
        App.closeModal();
        App.showToast('Item updated', 'success');
        this.render(document.getElementById('mainContent'));
    },

    deleteItem(id) {
        const item = (DataStore.catalog || []).find(c => c.id === id);
        if (!item) return;
        if (!confirm(`Delete "${item.name}" from the catalog?`)) return;
        DataStore.catalog = DataStore.catalog.filter(c => c.id !== id);
        Database.save();
        App.showToast('Item deleted', 'success');
        this.render(document.getElementById('mainContent'));
    },

    exportCatalog() {
        if (typeof Excel !== 'undefined') {
            Excel.openExportDialog(['catalog'], 'Export Catalog');
        }
    },

    // ----------------------------------------------------------------
    //  PICKER MODAL – used by Invoicing and other modules
    // ----------------------------------------------------------------
    openPickerModal(onSelect, companyId = null) {
        const items = companyId ? this.getForCompany(companyId) : this._allItems().filter(i => i.active !== false);
        const companies = [...new Set(items.map(i => i.companyId))];
        const companyFilterOptions = ['all', ...companies]
            .map(c => {
                const co = DataStore.companies[c];
                return `<option value="${c}">${co ? Utils.escapeHtml(co.name) : 'All Companies'}</option>`;
            }).join('');

        const rows = items.map(i => `
            <tr class="catalog-picker-row" data-company="${i.companyId}" data-name="${Utils.escapeHtml(i.name.toLowerCase())}" style="cursor:pointer" onclick="${onSelect}('${i._sourceId}','${i.name.replace(/'/g,"\\'")}',${i.price},'${i.unit}')">
                <td><strong>${Utils.escapeHtml(i.name)}</strong></td>
                <td><span class="badge-tag badge-neutral">${Utils.escapeHtml(i.category)}</span></td>
                <td>${Utils.escapeHtml(i.companyName)}</td>
                <td><span class="badge-tag ${i.type === 'product' ? 'badge-blue' : 'badge-green'}">${i.type}</span></td>
                <td><strong>${Utils.formatCurrency(i.price)}</strong> / ${i.unit}</td>
            </tr>`).join('');

        App.showModal('Pick from Catalog',
            `<div class="flex-gap mb-2">
                <input type="text" class="form-input" id="pickerSearch" placeholder="Search…" oninput="Catalog._filterPicker(this.value)">
                <select class="form-input" id="pickerCompany" onchange="Catalog._filterPicker(document.getElementById('pickerSearch').value)" style="max-width:220px">
                    <option value="all">All Companies</option>
                    ${companyFilterOptions}
                </select>
            </div>
            <div style="max-height:400px;overflow-y:auto;">
            <table class="data-table" style="width:100%">
                <thead><tr><th>Name</th><th>Category</th><th>Company</th><th>Type</th><th>Price</th></tr></thead>
                <tbody id="pickerRows">${rows}</tbody>
            </table></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>`
        );
    },

    _filterPicker(q) {
        const lq = q.toLowerCase();
        const co = document.getElementById('pickerCompany')?.value || 'all';
        document.querySelectorAll('.catalog-picker-row').forEach(row => {
            const nameMatch = !lq || (row.dataset.name || '').includes(lq);
            const coMatch = co === 'all' || row.dataset.company === co;
            row.style.display = nameMatch && coMatch ? '' : 'none';
        });
    }
};
