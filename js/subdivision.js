/* ========================================
   SJC UBMS - Subdivision Hub Module
   Erlandia Homes: Lots, Homeowners, Payments
   ======================================== */

const Subdivision = {
    renderLots(container) {
        const lots = DataStore.lots;
        const statuses = { available: 0, reserved: 0, sold: 0 };
        lots.forEach(l => { if (statuses[l.status] !== undefined) statuses[l.status]++; });

        container.innerHTML = `
        <div class="section-header">
            <div><h2>Lot Management</h2><p>Erlandia Homes Subdivision — ${lots.length} lots</p></div>
            <button class="btn btn-primary" onclick="Subdivision.addLot()"><i class="fas fa-plus"></i> Add Lot</button>
        </div>
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-map"></i></div></div><div class="stat-value">${lots.length}</div><div class="stat-label">Total Lots</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div><div class="stat-value">${statuses.sold}</div><div class="stat-label">Sold</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-clock"></i></div></div><div class="stat-value">${statuses.reserved}</div><div class="stat-label">Reserved</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-tag"></i></div></div><div class="stat-value">${statuses.available}</div><div class="stat-label">Available</div></div>
        </div>

        <!-- Lot Grid Visual -->
        <div class="card mb-3">
            <div class="card-header"><h3><i class="fas fa-th"></i>Lot Map</h3></div>
            <div class="card-body">
                <div class="lot-grid">
                    ${lots.map(l => `
                        <div class="lot-tile ${l.status}" onclick="Subdivision.viewLot('${l.id}')" title="Block ${l.block}, Lot ${l.lot}">
                            <div class="lot-id">B${l.block}-L${l.lot}</div>
                            <div class="lot-area">${l.area} sqm</div>
                            <div class="lot-status">${l.status}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="lot-legend">
                    <span><span class="legend-dot legend-available"></span> Available</span>
                    <span><span class="legend-dot legend-reserved"></span> Reserved</span>
                    <span><span class="legend-dot legend-sold"></span> Sold</span>
                </div>
            </div>
        </div>

        <div class="card"><div class="card-header"><h3>Lot Details</h3></div><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'Lot ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Block/Lot', render: r => `Block ${r.block}, Lot ${r.lot}` },
                { label: 'Type', render: r => `<span class="badge-tag badge-neutral">${r.type}</span>` },
                { label: 'Area', render: r => `${r.area} sqm` },
                { label: 'Price/sqm', render: r => Utils.formatCurrency(r.pricePerSqm) },
                { label: 'Total Price', render: r => Utils.formatCurrency(r.totalPrice) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Buyer', render: r => Utils.escapeHtml(r.buyer || '-') },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="Subdivision.editLot('${r.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="Subdivision.deleteLot('${r.id}')"><i class="fas fa-trash"></i></button>` }
            ], lots)}
        </div></div>`;
    },

    addLot() {
        App.showModal('Add New Lot', `
            <div class="grid-2">
                <div class="form-group"><label>Block Number</label><input type="number" class="form-input" id="lotBlock" min="1" required></div>
                <div class="form-group"><label>Lot Number</label><input type="number" class="form-input" id="lotNum" min="1" required></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="lotType"><option>Residential</option><option>Corner Lot</option><option>Commercial</option><option>Inner Lot</option></select></div>
                <div class="form-group"><label>Area (sqm)</label><input type="number" class="form-input" id="lotArea" min="1" required></div>
                <div class="form-group"><label>Price per sqm (₱)</label><input type="number" class="form-input" id="lotPpSqm" min="0" required></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="lotStatus"><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Subdivision.saveLot()">Save Lot</button>`
        );
    },

    saveLot() {
        const block = document.getElementById('lotBlock')?.value;
        const lot = document.getElementById('lotNum')?.value;
        if (!block || !lot) { App.showToast('Block and Lot numbers are required', 'error'); return; }
        const area = parseFloat(document.getElementById('lotArea')?.value) || 0;
        const ppSqm = parseFloat(document.getElementById('lotPpSqm')?.value) || 0;
        DataStore.lots.push({
            id: Utils.generateId('LOT'),
            block: parseInt(block),
            lot: parseInt(lot),
            type: document.getElementById('lotType')?.value || 'Residential',
            area, pricePerSqm: ppSqm, totalPrice: area * ppSqm,
            status: document.getElementById('lotStatus')?.value || 'available',
            buyer: '', createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Lot added successfully');
        this.renderLots(document.getElementById('mainContent'));
    },

    editLot(id) {
        const l = DataStore.lots.find(x => x.id === id);
        if (!l) return;
        App.showModal('Edit Lot', `
            <div class="grid-2">
                <div class="form-group"><label>Block</label><input type="number" class="form-input" id="lotBlock" value="${l.block}"></div>
                <div class="form-group"><label>Lot</label><input type="number" class="form-input" id="lotNum" value="${l.lot}"></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="lotType"><option ${l.type==='Residential'?'selected':''}>Residential</option><option ${l.type==='Corner Lot'?'selected':''}>Corner Lot</option><option ${l.type==='Commercial'?'selected':''}>Commercial</option><option ${l.type==='Inner Lot'?'selected':''}>Inner Lot</option></select></div>
                <div class="form-group"><label>Area</label><input type="number" class="form-input" id="lotArea" value="${l.area}"></div>
                <div class="form-group"><label>Price/sqm</label><input type="number" class="form-input" id="lotPpSqm" value="${l.pricePerSqm}"></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="lotStatus"><option value="available" ${l.status==='available'?'selected':''}>Available</option><option value="reserved" ${l.status==='reserved'?'selected':''}>Reserved</option><option value="sold" ${l.status==='sold'?'selected':''}>Sold</option></select></div>
                <div class="form-group"><label>Buyer Name</label><input type="text" class="form-input" id="lotBuyer" value="${Utils.escapeHtml(l.buyer||'')}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Subdivision.updateLot('${id}')">Update</button>`
        );
    },

    updateLot(id) {
        const l = DataStore.lots.find(x => x.id === id);
        if (!l) return;
        l.block = parseInt(document.getElementById('lotBlock')?.value) || l.block;
        l.lot = parseInt(document.getElementById('lotNum')?.value) || l.lot;
        l.type = document.getElementById('lotType')?.value || l.type;
        l.area = parseFloat(document.getElementById('lotArea')?.value) || l.area;
        l.pricePerSqm = parseFloat(document.getElementById('lotPpSqm')?.value) || l.pricePerSqm;
        l.totalPrice = l.area * l.pricePerSqm;
        l.status = document.getElementById('lotStatus')?.value || l.status;
        l.buyer = document.getElementById('lotBuyer')?.value?.trim() || '';
        Database.save();
        App.closeModal();
        App.showToast('Lot updated');
        this.renderLots(document.getElementById('mainContent'));
    },

    viewLot(id) {
        const l = DataStore.lots.find(x => x.id === id);
        if (!l) return;
        const payments = DataStore.lotPayments.filter(p => p.lotId === id);
        const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
        App.showModal(`Lot Details — B${l.block}-L${l.lot}`, `
            <div class="grid-2 mb-3">
                <div><strong>Type:</strong> ${l.type}</div>
                <div><strong>Area:</strong> ${l.area} sqm</div>
                <div><strong>Price/sqm:</strong> ${Utils.formatCurrency(l.pricePerSqm)}</div>
                <div><strong>Total Price:</strong> ${Utils.formatCurrency(l.totalPrice)}</div>
                <div><strong>Status:</strong> <span class="badge-tag ${Utils.getStatusClass(l.status)}">${l.status}</span></div>
                <div><strong>Buyer:</strong> ${Utils.escapeHtml(l.buyer || 'N/A')}</div>
            </div>
            ${l.status !== 'available' ? `
                <h4 class="mt-2 mb-1">Payment History</h4>
                <div class="mb-1"><strong>Total Paid:</strong> ${Utils.formatCurrency(totalPaid)} / ${Utils.formatCurrency(l.totalPrice)} (${((totalPaid/l.totalPrice)*100).toFixed(1)}%)</div>
                <div class="progress-bar mb-3"><div class="progress-fill green" style="width:${Math.min(100,(totalPaid/l.totalPrice)*100)}%"></div></div>
                ${payments.length > 0 ? Utils.buildTable([
                    { label: 'Date', render: r => Utils.formatDate(r.date) },
                    { label: 'Amount', render: r => Utils.formatCurrency(r.amount) },
                    { label: 'Method', render: r => r.method || '-' },
                    { label: 'Reference', render: r => r.reference || '-' }
                ], payments) : '<p>No payments recorded yet.</p>'}
            ` : ''}
        `);
    },

    deleteLot(id) {
        App.confirmAction('Delete this lot?', () => {
            DataStore.lots = DataStore.lots.filter(l => l.id !== id);
            Database.save();
            App.showToast('Lot deleted');
            this.renderLots(document.getElementById('mainContent'));
        });
    },

    renderHomeowners(container) {
        const owners = DataStore.homeowners;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Homeowners</h2><p>${owners.length} registered homeowners</p></div>
            <button class="btn btn-primary" onclick="Subdivision.addHomeowner()"><i class="fas fa-plus"></i> Add Homeowner</button>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${owners.length === 0 ? '<div class="empty-state"><i class="fas fa-user-friends"></i><h3>No Homeowners Yet</h3><p>Add homeowner records as lots are sold.</p></div>' :
            Utils.buildTable([
                { label: 'Name', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                { label: 'Lot', render: r => r.lotId || '-' },
                { label: 'Contact', render: r => Utils.escapeHtml(r.phone || '-') },
                { label: 'Email', render: r => Utils.escapeHtml(r.email || '-') },
                { label: 'Move-in', render: r => Utils.formatDate(r.moveInDate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], owners)}
        </div></div>`;
    },

    addHomeowner() {
        App.showModal('Add Homeowner', `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="hoName" required></div>
                <div class="form-group"><label>Lot</label><select class="form-input" id="hoLot"><option value="">Select Lot</option>${DataStore.lots.filter(l=>l.status==='sold').map(l=>`<option value="${l.id}">B${l.block}-L${l.lot}</option>`).join('')}</select></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="hoPhone"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="hoEmail"></div>
                <div class="form-group"><label>Move-in Date</label><input type="date" class="form-input" id="hoMoveIn"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Subdivision.saveHomeowner()">Save</button>`
        );
    },

    saveHomeowner() {
        const name = document.getElementById('hoName')?.value?.trim();
        if (!name) { App.showToast('Name is required', 'error'); return; }
        DataStore.homeowners.push({
            id: Utils.generateId('HO'),
            name,
            lotId: document.getElementById('hoLot')?.value || '',
            phone: document.getElementById('hoPhone')?.value?.trim() || '',
            email: document.getElementById('hoEmail')?.value?.trim() || '',
            moveInDate: document.getElementById('hoMoveIn')?.value || '',
            status: 'active',
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Homeowner added');
        this.renderHomeowners(document.getElementById('mainContent'));
    },

    renderPayments(container) {
        const payments = DataStore.lotPayments;
        const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Lot Payments</h2><p>${payments.length} payment records — Total: ${Utils.formatCurrency(totalCollected)}</p></div>
            <button class="btn btn-primary" onclick="Subdivision.addPayment()"><i class="fas fa-plus"></i> Record Payment</button>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${payments.length === 0 ? '<div class="empty-state"><i class="fas fa-money-check-alt"></i><h3>No Payments Yet</h3></div>' :
            Utils.buildTable([
                { label: 'Date', render: r => Utils.formatDate(r.date) },
                { label: 'Lot', render: r => r.lotId },
                { label: 'Payer', render: r => Utils.escapeHtml(r.payer || '-') },
                { label: 'Amount', render: r => `<strong>${Utils.formatCurrency(r.amount)}</strong>` },
                { label: 'Method', render: r => r.method || '-' },
                { label: 'Reference', render: r => r.reference || '-' }
            ], payments)}
        </div></div>`;
    },

    addPayment() {
        App.showModal('Record Lot Payment', `
            <div class="grid-2">
                <div class="form-group"><label>Lot</label><select class="form-input" id="payLot"><option value="">Select Lot</option>${DataStore.lots.filter(l=>l.status!=='available').map(l=>`<option value="${l.id}">B${l.block}-L${l.lot} (${l.buyer||'N/A'})</option>`).join('')}</select></div>
                <div class="form-group"><label>Amount (₱)</label><input type="number" class="form-input" id="payAmount" min="0" required></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="payDate" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Method</label><select class="form-input" id="payMethod"><option>Cash</option><option>Bank Transfer</option><option>Check</option><option>Online</option></select></div>
                <div class="form-group"><label>Payer Name</label><input type="text" class="form-input" id="payPayer"></div>
                <div class="form-group"><label>Reference No.</label><input type="text" class="form-input" id="payRef"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Subdivision.savePayment()">Record</button>`
        );
    },

    savePayment() {
        const lotId = document.getElementById('payLot')?.value;
        const amount = parseFloat(document.getElementById('payAmount')?.value);
        if (!lotId || !amount) { App.showToast('Lot and amount are required', 'error'); return; }
        DataStore.lotPayments.push({
            id: Utils.generateId('LPAY'),
            lotId,
            amount,
            date: document.getElementById('payDate')?.value || new Date().toISOString().split('T')[0],
            method: document.getElementById('payMethod')?.value || 'Cash',
            payer: document.getElementById('payPayer')?.value?.trim() || '',
            reference: document.getElementById('payRef')?.value?.trim() || ''
        });
        Database.save();
        App.closeModal();
        App.showToast('Payment recorded');
        this.renderPayments(document.getElementById('mainContent'));
    },

    renderAmenities(container) {
        const amenities = DataStore.subdivisionAmenities;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Amenities</h2><p>Subdivision amenities and facilities</p></div>
            <button class="btn btn-primary" onclick="Subdivision.addAmenity()"><i class="fas fa-plus"></i> Add Amenity</button>
        </div>
        <div class="grid-3">
            ${amenities.length === 0 ? '<div class="card span-full"><div class="card-body"><div class="empty-state"><i class="fas fa-swimming-pool"></i><h3>No Amenities</h3></div></div></div>' :
            amenities.map(a => `
                <div class="card">
                    <div class="card-body text-center">
                        <div class="stat-icon stat-icon-lg ${a.status==='operational'?'green':'orange'}"><i class="fas ${a.icon||'fa-star'}"></i></div>
                        <h4>${Utils.escapeHtml(a.name)}</h4>
                        <p class="text-sm text-muted">${Utils.escapeHtml(a.description||'')}</p>
                        <span class="badge-tag ${Utils.getStatusClass(a.status)}">${a.status}</span>
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    addAmenity() {
        App.showModal('Add Amenity', `
            <div class="grid-2">
                <div class="form-group"><label>Name</label><input type="text" class="form-input" id="amName" required></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="amStatus"><option value="operational">Operational</option><option value="maintenance">Under Maintenance</option><option value="planned">Planned</option></select></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="amDesc" rows="2"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Subdivision.saveAmenity()">Save</button>`
        );
    },

    saveAmenity() {
        const name = document.getElementById('amName')?.value?.trim();
        if (!name) { App.showToast('Name is required', 'error'); return; }
        DataStore.subdivisionAmenities.push({
            id: Utils.generateId('AMN'),
            name,
            description: document.getElementById('amDesc')?.value?.trim() || '',
            status: document.getElementById('amStatus')?.value || 'operational',
            icon: 'fa-star'
        });
        Database.save();
        App.closeModal();
        App.showToast('Amenity added');
        this.renderAmenities(document.getElementById('mainContent'));
    }
};
