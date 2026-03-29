/* ========================================
   SJC UBMS - Quarry Hub Module
   Stationary Crushing Plant: Products, Orders, Deliveries, Production
   ======================================== */

const Crushing = {
    renderProducts(container) {
        const products = DataStore.aggregateProducts;
        const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Aggregate Products</h2><p>${products.length} product types — ${Utils.formatNumber(totalStock)} total stock</p></div>
            <button class="btn btn-primary" onclick="Crushing.addProduct()"><i class="fas fa-plus"></i> Add Product</button>
        </div>
        <div class="grid-3 mb-3">
            ${products.map(p => `
                <div class="stat-card clickable" onclick="Crushing.editProduct('${p.id}')">
                    <div class="product-card-top">
                        <div class="stat-icon orange stat-icon-sm"><i class="fas fa-mountain"></i></div>
                        <span class="badge-tag badge-neutral">${p.category}</span>
                    </div>
                    <h4 class="product-card-name">${Utils.escapeHtml(p.name)}</h4>
                    <div class="product-card-bottom">
                        <div><div class="product-metric-label">Price/${p.unit}</div><div class="product-metric-value">${Utils.formatCurrency(p.price)}</div></div>
                        <div class="text-right"><div class="product-metric-label">Stock</div><div class="product-metric-value ${(p.stock||0)<100?'text-danger':'text-success'}">${Utils.formatNumber(p.stock||0)} ${p.unit}</div></div>
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    addProduct() {
        App.showModal('Add Product', `
            <div class="grid-2">
                <div class="form-group"><label>Product Name</label><input type="text" class="form-input" id="cpName" required></div>
                <div class="form-group"><label>Category</label><select class="form-input" id="cpCat"><option>Gravel</option><option>Sand</option><option>Boulders</option><option>Base Course</option><option>Filling Material</option></select></div>
                <div class="form-group"><label>Unit</label><select class="form-input" id="cpUnit"><option>cu.m</option><option>tons</option><option>bags</option></select></div>
                <div class="form-group"><label>Price/Unit (₱)</label><input type="number" class="form-input" id="cpPrice" min="0"></div>
                <div class="form-group"><label>Stock</label><input type="number" class="form-input" id="cpStock" min="0" value="0"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Crushing.saveProduct()">Save</button>`
        );
    },

    saveProduct() {
        const name = document.getElementById('cpName')?.value?.trim();
        if (!name) { App.showToast('Name required', 'error'); return; }
        DataStore.aggregateProducts.push({
            id: Utils.generateId('AGG'),
            name, category: document.getElementById('cpCat')?.value || 'Gravel',
            unit: document.getElementById('cpUnit')?.value || 'cu.m',
            price: parseFloat(document.getElementById('cpPrice')?.value) || 0,
            stock: parseFloat(document.getElementById('cpStock')?.value) || 0
        });
        Database.save(); App.closeModal(); App.showToast('Product added');
        this.renderProducts(document.getElementById('mainContent'));
    },

    editProduct(id) {
        const p = DataStore.aggregateProducts.find(x => x.id === id);
        if (!p) return;
        App.showModal('Edit Product', `
            <div class="grid-2">
                <div class="form-group"><label>Name</label><input type="text" class="form-input" id="cpName" value="${Utils.escapeHtml(p.name)}"></div>
                <div class="form-group"><label>Category</label><select class="form-input" id="cpCat"><option ${p.category==='Gravel'?'selected':''}>Gravel</option><option ${p.category==='Sand'?'selected':''}>Sand</option><option ${p.category==='Boulders'?'selected':''}>Boulders</option><option ${p.category==='Base Course'?'selected':''}>Base Course</option><option ${p.category==='Filling Material'?'selected':''}>Filling Material</option></select></div>
                <div class="form-group"><label>Unit</label><select class="form-input" id="cpUnit"><option ${p.unit==='cu.m'?'selected':''}>cu.m</option><option ${p.unit==='tons'?'selected':''}>tons</option><option ${p.unit==='bags'?'selected':''}>bags</option></select></div>
                <div class="form-group"><label>Price</label><input type="number" class="form-input" id="cpPrice" value="${p.price}"></div>
                <div class="form-group"><label>Stock</label><input type="number" class="form-input" id="cpStock" value="${p.stock||0}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Crushing.updateProduct('${id}')">Update</button>`
        );
    },

    updateProduct(id) {
        const p = DataStore.aggregateProducts.find(x => x.id === id);
        if (!p) return;
        p.name = document.getElementById('cpName')?.value?.trim() || p.name;
        p.category = document.getElementById('cpCat')?.value || p.category;
        p.unit = document.getElementById('cpUnit')?.value || p.unit;
        p.price = parseFloat(document.getElementById('cpPrice')?.value) || p.price;
        p.stock = parseFloat(document.getElementById('cpStock')?.value) || 0;
        Database.save(); App.closeModal(); App.showToast('Product updated');
        this.renderProducts(document.getElementById('mainContent'));
    },

    renderOrders(container) {
        const orders = DataStore.crushingOrders;
        const totalSales = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Orders</h2><p>${orders.length} orders — Total: ${Utils.formatCurrency(totalSales)}</p></div>
            <button class="btn btn-primary" onclick="Crushing.addOrder()"><i class="fas fa-plus"></i> New Order</button>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${orders.length === 0 ? '<div class="empty-state"><i class="fas fa-clipboard-list"></i><h3>No Orders Yet</h3><p>Create your first aggregate order.</p></div>' :
            Utils.buildTable([
                { label: 'Order ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Customer', render: r => Utils.escapeHtml(r.customer || '-') },
                { label: 'Product', render: r => Utils.escapeHtml(r.productName || '-') },
                { label: 'Quantity', render: r => `${r.quantity} ${r.unit || 'cu.m'}` },
                { label: 'Amount', render: r => Utils.formatCurrency(r.totalAmount) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Date', render: r => Utils.formatDate(r.orderDate) }
            ], orders)}
        </div></div>`;
    },

    addOrder() {
        App.showModal('New Order', `
            <div class="grid-2">
                <div class="form-group"><label>Customer</label><input type="text" class="form-input" id="coCustomer" required></div>
                <div class="form-group"><label>Product</label><select class="form-input" id="coProduct" onchange="Crushing.updateOrderTotal()">${DataStore.aggregateProducts.map(p=>`<option value="${p.id}" data-price="${p.price}" data-unit="${p.unit}">${p.name} (₱${p.price}/${p.unit})</option>`).join('')}</select></div>
                <div class="form-group"><label>Quantity</label><input type="number" class="form-input" id="coQty" min="1" value="1" onchange="Crushing.updateOrderTotal()"></div>
                <div class="form-group"><label>Total Amount (₱)</label><input type="number" class="form-input" id="coTotal" readonly></div>
                <div class="form-group"><label>Delivery Address</label><input type="text" class="form-input" id="coAddress"></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="coDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Crushing.saveOrder()">Create Order</button>`
        );
        this.updateOrderTotal();
    },

    updateOrderTotal() {
        const sel = document.getElementById('coProduct');
        const qty = parseFloat(document.getElementById('coQty')?.value) || 0;
        if (sel && sel.selectedOptions[0]) {
            const price = parseFloat(sel.selectedOptions[0].dataset.price) || 0;
            const total = document.getElementById('coTotal');
            if (total) total.value = (price * qty).toFixed(2);
        }
    },

    saveOrder() {
        const customer = document.getElementById('coCustomer')?.value?.trim();
        if (!customer) { App.showToast('Customer required', 'error'); return; }
        const sel = document.getElementById('coProduct');
        const productId = sel?.value || '';
        const product = DataStore.aggregateProducts.find(p => p.id === productId);
        const qty = parseFloat(document.getElementById('coQty')?.value) || 0;
        DataStore.crushingOrders.push({
            id: Utils.generateId('CRO'),
            customer,
            productId, productName: product?.name || '',
            quantity: qty, unit: product?.unit || 'cu.m',
            unitPrice: product?.price || 0,
            totalAmount: qty * (product?.price || 0),
            deliveryAddress: document.getElementById('coAddress')?.value?.trim() || '',
            orderDate: document.getElementById('coDate')?.value || new Date().toISOString().split('T')[0],
            status: 'pending'
        });
        Database.save(); App.closeModal(); App.showToast('Order created');
        this.renderOrders(document.getElementById('mainContent'));
    },

    renderDeliveries(container) {
        const deliveries = DataStore.crushingDeliveries;
        container.innerHTML = `
        <div class="section-header"><div><h2>Deliveries</h2><p>${deliveries.length} delivery records</p></div>
            <button class="btn btn-primary" onclick="Crushing.addDelivery()"><i class="fas fa-plus"></i> Log Delivery</button></div>
        <div class="card"><div class="card-body no-padding">
            ${deliveries.length === 0 ? '<div class="empty-state"><i class="fas fa-truck"></i><h3>No Deliveries</h3></div>' :
            Utils.buildTable([
                { label: 'ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Order', render: r => r.orderId || '-' },
                { label: 'Vehicle', render: r => Utils.escapeHtml(r.vehicle || '-') },
                { label: 'Driver', render: r => Utils.escapeHtml(r.driver || '-') },
                { label: 'Quantity', render: r => `${r.quantity} ${r.unit||'cu.m'}` },
                { label: 'Date', render: r => Utils.formatDate(r.deliveryDate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], deliveries)}
        </div></div>`;
    },

    addDelivery() {
        App.showModal('Log Delivery', `
            <div class="grid-2">
                <div class="form-group"><label>Order</label><select class="form-input" id="cdOrder"><option value="">Select Order</option>${DataStore.crushingOrders.filter(o=>o.status!=='delivered').map(o=>`<option value="${o.id}">${o.id} — ${o.customer}</option>`).join('')}</select></div>
                <div class="form-group"><label>Vehicle</label><input type="text" class="form-input" id="cdVehicle"></div>
                <div class="form-group"><label>Driver</label><input type="text" class="form-input" id="cdDriver"></div>
                <div class="form-group"><label>Quantity</label><input type="number" class="form-input" id="cdQty" min="0"></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="cdDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Crushing.saveDelivery()">Log</button>`
        );
    },

    saveDelivery() {
        DataStore.crushingDeliveries.push({
            id: Utils.generateId('DEL'),
            orderId: document.getElementById('cdOrder')?.value || '',
            vehicle: document.getElementById('cdVehicle')?.value?.trim() || '',
            driver: document.getElementById('cdDriver')?.value?.trim() || '',
            quantity: parseFloat(document.getElementById('cdQty')?.value) || 0,
            unit: 'cu.m',
            deliveryDate: document.getElementById('cdDate')?.value || new Date().toISOString().split('T')[0],
            status: 'delivered'
        });
        Database.save(); App.closeModal(); App.showToast('Delivery logged');
        this.renderDeliveries(document.getElementById('mainContent'));
    },

    renderProduction(container) {
        const records = DataStore.crushingProduction;
        container.innerHTML = `
        <div class="section-header"><div><h2>Production</h2><p>Crushing plant production monitoring</p></div>
            <button class="btn btn-primary" onclick="Crushing.addProduction()"><i class="fas fa-plus"></i> Log Production</button></div>
        <div class="grid-3 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-industry"></i></div></div><div class="stat-value">${records.length}</div><div class="stat-label">Production Entries</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-cubes"></i></div></div><div class="stat-value">${Utils.formatNumber(records.reduce((s,r)=>s+(r.outputQty||0),0))}</div><div class="stat-label">Total Output (cu.m)</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-cog"></i></div></div><div class="stat-value">${records.filter(r=>r.status==='running').length}</div><div class="stat-label">Active Runs</div></div>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${records.length === 0 ? '<div class="empty-state"><i class="fas fa-industry"></i><h3>No Production Records</h3><p>Log daily crushing plant production output.</p></div>' :
            Utils.buildTable([
                { label: 'Date', render: r => Utils.formatDate(r.date) },
                { label: 'Product', render: r => Utils.escapeHtml(r.product || '-') },
                { label: 'Input (cu.m)', render: r => Utils.formatNumber(r.inputQty || 0) },
                { label: 'Output (cu.m)', render: r => Utils.formatNumber(r.outputQty || 0) },
                { label: 'Machine Hours', render: r => r.machineHours || 0 },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], records)}
        </div></div>`;
    },

    addProduction() {
        App.showModal('Log Production', `
            <div class="grid-2">
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="prDate" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Product</label><select class="form-input" id="prProduct">${DataStore.aggregateProducts.map(p=>`<option>${p.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Input Qty (cu.m)</label><input type="number" class="form-input" id="prInput" min="0"></div>
                <div class="form-group"><label>Output Qty (cu.m)</label><input type="number" class="form-input" id="prOutput" min="0"></div>
                <div class="form-group"><label>Machine Hours</label><input type="number" class="form-input" id="prHours" min="0"></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="prStatus"><option value="completed">Completed</option><option value="running">Running</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Crushing.saveProduction()">Log</button>`
        );
    },

    saveProduction() {
        DataStore.crushingProduction.push({
            id: Utils.generateId('PRD'),
            date: document.getElementById('prDate')?.value || new Date().toISOString().split('T')[0],
            product: document.getElementById('prProduct')?.value || '',
            inputQty: parseFloat(document.getElementById('prInput')?.value) || 0,
            outputQty: parseFloat(document.getElementById('prOutput')?.value) || 0,
            machineHours: parseFloat(document.getElementById('prHours')?.value) || 0,
            status: document.getElementById('prStatus')?.value || 'completed'
        });
        Database.save(); App.closeModal(); App.showToast('Production logged');
        this.renderProduction(document.getElementById('mainContent'));
    }
};
