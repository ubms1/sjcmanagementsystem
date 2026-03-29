/* ========================================
   SJC UBMS - Point of Sale Module
   POS for quarry products, driving courses, test services
   ======================================== */

const POS = {
    cart: [],

    render(container) {
        const company = App.currentCompany;
        const companyObj = DataStore.companies[company];
        const type = companyObj?.type || 'construction';
        this.cart = [];

        container.innerHTML = `
        <div class="section-header"><div><h2>Point of Sale</h2><p>${companyObj ? Utils.escapeHtml(companyObj.name) : 'All Companies'}</p></div></div>

        <div class="pos-layout">
            <div class="pos-products-panel">
                <div class="card mb-3"><div class="card-body">
                    <div class="flex-gap mb-2">
                        <input type="text" class="form-input" id="posSearch" placeholder="Search products/services..." oninput="POS.filterProducts()">
                    </div>
                    <div id="posProducts" class="grid-3 pos-product-grid">
                        ${this.getProductCards(type)}
                    </div>
                </div></div>
            </div>

            <div class="pos-cart-panel">
                <div class="card pos-cart-sidebar">
                    <div class="card-body">
                        <h3 class="mb-1"><i class="fas fa-shopping-cart"></i> Cart</h3>
                        <div id="posCart" class="pos-cart-items">
                            <div class="empty-state pos-empty"><i class="fas fa-shopping-basket"></i><p>Cart is empty</p></div>
                        </div>
                        <div class="pos-totals">
                            <div class="pos-total-row"><span>Subtotal</span><span id="posSubtotal">₱0.00</span></div>
                            <div class="pos-total-row"><span>VAT (12%)</span><span id="posVat">₱0.00</span></div>
                            <div class="pos-total-row pos-grand-total"><span>Total</span><span id="posTotal">₱0.00</span></div>
                        </div>
                        <div class="pos-checkout-form">
                            <div class="form-group"><label>Customer</label>
                                ${(()=>{
                                    const co = App.currentCompany;
                                    const custs = (DataStore.customers||[]).filter(c => !co || co === 'all' || c.companyId === co);
                                    return custs.length > 0
                                        ? `<select class="form-input" id="posCustomer">
                                             <option value="">Walk-in / Anonymous</option>
                                             ${custs.map(c=>`<option value="${Utils.escapeHtml(c.name)}">${Utils.escapeHtml(c.name)}${c.company?' ('+Utils.escapeHtml(c.company)+')':''}</option>`).join('')}
                                           </select>`
                                        : `<input type="text" class="form-input" id="posCustomer" placeholder="Walk-in">`;
                                })()}
                            </div>
                            <div class="form-group"><label>Payment Method</label><select class="form-input" id="posPayment"><option>Cash</option><option>Bank Transfer</option><option>Check</option><option>GCash</option><option>Credit</option></select></div>
                            <button class="btn btn-primary btn-block" onclick="POS.checkout()"><i class="fas fa-check-circle"></i> Complete Sale</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    getProductCards(type) {
        let products = [];
        if (type === 'quarry') {
            products = (DataStore.aggregateProducts || []).map(p => ({ id: p.id, name: p.name, price: p.price || p.pricePerUnit, unit: p.unit, category: 'Aggregates' }));
        } else if (type === 'driving_school') {
            products = (DataStore.drivingCourses || []).map(c => ({ id: c.id, name: c.name, price: c.price || c.fee, unit: 'enrollment', category: c.category }));
        } else if (type === 'testing_lab') {
            products = (DataStore.testServices || []).map(s => ({ id: s.id, name: s.name, price: s.price, unit: 'test', category: s.category }));
        } else {
            products = [
                { id: 'svc-001', name: 'General Service', price: 1000, unit: 'service', category: 'Services' },
                { id: 'svc-002', name: 'Consultation', price: 2500, unit: 'session', category: 'Services' },
                { id: 'svc-003', name: 'Project Estimate', price: 5000, unit: 'estimate', category: 'Services' }
            ];
        }
        if (products.length === 0) return '<div class="empty-state pos-empty"><p>No products available for this company type.</p></div>';
        return products.map(p => `
            <div class="card pos-product" data-name="${Utils.escapeHtml(p.name.toLowerCase())}" onclick="POS.addToCart('${p.id}','${Utils.escapeHtml(p.name)}',${p.price},'${p.unit}')">
                <div class="card-body pos-product-body">
                    <div class="pos-product-cat">${Utils.escapeHtml(p.category)}</div>
                    <h4 class="pos-product-name">${Utils.escapeHtml(p.name)}</h4>
                    <div class="pos-product-price">${Utils.formatCurrency(p.price)}</div>
                    <div class="pos-product-unit">per ${p.unit}</div>
                </div>
            </div>
        `).join('');
    },

    filterProducts() {
        const q = (document.getElementById('posSearch')?.value || '').toLowerCase();
        document.querySelectorAll('.pos-product').forEach(el => {
            el.style.display = !q || el.dataset.name?.includes(q) ? '' : 'none';
        });
    },

    addToCart(id, name, price, unit) {
        const existing = this.cart.find(c => c.id === id);
        if (existing) existing.qty++;
        else this.cart.push({ id, name, price, unit, qty: 1 });
        this.updateCart();
    },

    updateCart() {
        const cartEl = document.getElementById('posCart');
        if (!cartEl) return;
        if (this.cart.length === 0) {
            cartEl.innerHTML = '<div class="empty-state pos-empty"><i class="fas fa-shopping-basket"></i><p>Cart is empty</p></div>';
        } else {
            cartEl.innerHTML = this.cart.map((item, i) => `
                <div class="pos-cart-item">
                    <div class="pos-cart-item-info"><strong>${Utils.escapeHtml(item.name)}</strong><br><span class="pos-cart-item-meta">${Utils.formatCurrency(item.price)} x ${item.qty}</span></div>
                    <div class="pos-cart-item-actions">
                        <span class="pos-cart-item-total">${Utils.formatCurrency(item.price * item.qty)}</span>
                        <button class="btn btn-sm" onclick="POS.changeQty(${i},-1)">-</button>
                        <button class="btn btn-sm" onclick="POS.changeQty(${i},1)">+</button>
                        <button class="btn btn-sm pos-cart-remove" onclick="POS.removeFromCart(${i})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }
        const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
        const vat = subtotal * 0.12;
        document.getElementById('posSubtotal').textContent = Utils.formatCurrency(subtotal);
        document.getElementById('posVat').textContent = Utils.formatCurrency(vat);
        document.getElementById('posTotal').textContent = Utils.formatCurrency(subtotal + vat);
    },

    changeQty(index, delta) {
        if (!this.cart[index]) return;
        this.cart[index].qty = Math.max(1, this.cart[index].qty + delta);
        this.updateCart();
    },

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.updateCart();
    },

    checkout() {
        if (this.cart.length === 0) { App.showToast('Cart is empty', 'error'); return; }
        const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
        const vat = subtotal * 0.12;
        const total = subtotal + vat;
        const company = App.currentCompany || 'sjc';
        const posCustomerEl = document.getElementById('posCustomer');
        const customer = (posCustomerEl?.value?.trim()) || 'Walk-in';
        const payment = document.getElementById('posPayment')?.value || 'Cash';

        if (!DataStore.posTransactions) DataStore.posTransactions = [];
        const txn = {
            id: Utils.generateId('TXN'),
            companyId: company,
            customer, paymentMethod: payment,
            items: [...this.cart],
            subtotal, vat, total,
            date: new Date().toISOString()
        };
        DataStore.posTransactions.push(txn);

        // Also create an invoice
        DataStore.invoices.push({
            id: Utils.generateId('INV'),
            companyId: company,
            client: customer,
            description: 'POS Sale — ' + this.cart.map(i => i.name).join(', '),
            items: this.cart.map(i => ({ description: i.name, qty: i.qty, price: i.price, subtotal: i.price * i.qty })),
            amount: total,
            date: new Date().toISOString().split('T')[0],
            status: payment === 'Credit' ? 'pending' : 'paid'
        });

        // Deduct inventory stock for matching items
        if (!DataStore.inventoryTransactions) DataStore.inventoryTransactions = [];
        this.cart.forEach(item => {
            const invItem = (DataStore.inventoryItems || []).find(inv =>
                inv.companyId === company &&
                inv.name.toLowerCase() === item.name.toLowerCase()
            );
            if (invItem) {
                invItem.quantity = Math.max(0, (invItem.quantity || 0) - item.qty);
                DataStore.inventoryTransactions.push({
                    id: Utils.generateId('TXN'),
                    itemId: invItem.id,
                    companyId: company,
                    type: 'out',
                    quantity: item.qty,
                    reference: txn.id,
                    date: new Date().toISOString(),
                    notes: 'POS Sale'
                });
            }
        });

        Database.save();
        this.cart = [];
        App.showToast(`Sale completed — ${Utils.formatCurrency(total)}`, 'success');
        this.render(document.getElementById('mainContent'));
    }
};
