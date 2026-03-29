/* ========================================
   SJC UBMS - Testing Lab Hub Module
   Megatesting Center: Services, Orders, Samples, Results, Equipment, Quality
   ======================================== */

const TestingLab = {
    renderServices(container) {
        const services = DataStore.testServices;
        const categories = [...new Set(services.map(s => s.category))];
        container.innerHTML = `
        <div class="section-header"><div><h2>Test Services</h2><p>DPWH-accredited civil engineering laboratory tests</p></div></div>

        ${categories.map(cat => `
            <h3 class="category-heading"><i class="fas fa-vials"></i>${cat}</h3>
            <div class="grid-3 mb-3">
                ${services.filter(s => s.category === cat).map(s => `
                    <div class="card">
                        <div class="card-body">
                            <div class="service-card-top">
                                <span class="badge-tag badge-megatesting">${s.category}</span>
                                <span class="service-price megatesting">${Utils.formatCurrency(s.price)}</span>
                            </div>
                            <h4 class="service-name">${Utils.escapeHtml(s.name)}</h4>
                            <div class="service-meta">
                                <span><i class="fas fa-book"></i> ${Utils.escapeHtml(s.standard)}</span>
                                <span><i class="fas fa-clock"></i> ${s.turnaround}</span>
                            </div>
                            ${s.description ? `<p class="service-desc">${Utils.escapeHtml(s.description)}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}`;
    },

    renderOrders(container) {
        const orders = DataStore.testOrders;
        const totalRev = orders.reduce((s, o) => s + (o.totalCost || 0), 0);
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Test Orders</h2><p>${orders.length} orders — Revenue: ${Utils.formatCurrency(totalRev)}</p></div>
            <button class="btn btn-primary" onclick="TestingLab.addOrder()"><i class="fas fa-plus"></i> New Test Order</button>
        </div>
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-file-medical"></i></div></div><div class="stat-value">${orders.length}</div><div class="stat-label">Total Orders</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-hourglass-half"></i></div></div><div class="stat-value">${orders.filter(o=>o.status==='pending').length}</div><div class="stat-label">Pending</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-flask"></i></div></div><div class="stat-value">${orders.filter(o=>o.status==='in-progress').length}</div><div class="stat-label">In Progress</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check-double"></i></div></div><div class="stat-value">${orders.filter(o=>o.status==='completed').length}</div><div class="stat-label">Completed</div></div>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'Order ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Client', render: r => Utils.escapeHtml(r.client) },
                { label: 'Project', render: r => Utils.escapeHtml(r.project || '-') },
                { label: 'Test', render: r => { const t = DataStore.testServices.find(ts=>ts.id===r.testServiceId); return t ? Utils.escapeHtml(t.name) : r.testServiceId; }},
                { label: 'Samples', render: r => r.sampleCount },
                { label: 'Amount', render: r => Utils.formatCurrency(r.totalCost) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Date', render: r => Utils.formatDate(r.orderDate || r.dateReceived) },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="TestingLab.updateOrderStatus('${r.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-primary" onclick="TestingLab.viewOrder('${r.id}')"><i class="fas fa-eye"></i></button>` }
            ], orders)}
        </div></div>`;
    },

    addOrder() {
        const custOpts = DataStore.customers.map(c=>`<option value="${Utils.escapeHtml(c.name)}">${Utils.escapeHtml(c.name)}</option>`).join('');
        App.showModal('New Test Order', `
            <div class="grid-2">
                <div class="form-group"><label>Client</label><select class="form-input" id="toClient" required><option value="">— Select Client —</option>${custOpts}</select></div>
                <div class="form-group"><label>Project Name</label><input type="text" class="form-input" id="toProject"></div>
                <div class="form-group"><label>Test Service</label><select class="form-input" id="toService" onchange="TestingLab.updateCost()">${DataStore.testServices.map(s=>`<option value="${s.id}" data-price="${s.price}">${s.name} (₱${s.price})</option>`).join('')}</select></div>
                <div class="form-group"><label>Number of Samples</label><input type="number" class="form-input" id="toSamples" min="1" value="1" onchange="TestingLab.updateCost()"></div>
                <div class="form-group"><label>Total Cost (₱)</label><input type="number" class="form-input" id="toCost" readonly></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="toDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>
            <div class="form-group"><label>Notes</label><textarea class="form-input" id="toNotes" rows="2"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="TestingLab.saveOrder()">Create Order</button>`
        );
        this.updateCost();
    },

    updateCost() {
        const sel = document.getElementById('toService');
        const samples = parseInt(document.getElementById('toSamples')?.value) || 1;
        if (sel?.selectedOptions[0]) {
            const price = parseFloat(sel.selectedOptions[0].dataset.price) || 0;
            const cost = document.getElementById('toCost');
            if (cost) cost.value = (price * samples).toFixed(2);
        }
    },

    saveOrder() {
        const client = document.getElementById('toClient')?.value?.trim();
        if (!client) { App.showToast('Client required', 'error'); return; }
        const serviceId = document.getElementById('toService')?.value || '';
        const service = DataStore.testServices.find(s => s.id === serviceId);
        const samples = parseInt(document.getElementById('toSamples')?.value) || 1;
        DataStore.testOrders.push({
            id: Utils.generateId('TO'),
            client,
            project: document.getElementById('toProject')?.value?.trim() || '',
            testServiceId: serviceId,
            sampleCount: samples,
            totalCost: samples * (service?.price || 0),
            orderDate: document.getElementById('toDate')?.value || new Date().toISOString().split('T')[0],
            notes: document.getElementById('toNotes')?.value?.trim() || '',
            status: 'pending'
        });
        Database.save(); App.closeModal(); App.showToast('Test order created');
        this.renderOrders(document.getElementById('mainContent'));
    },

    viewOrder(id) {
        const o = DataStore.testOrders.find(x => x.id === id);
        if (!o) return;
        const service = DataStore.testServices.find(s => s.id === o.testServiceId);
        const samples = DataStore.testSamples.filter(s => s.orderId === id);
        const results = DataStore.testResults.filter(r => r.orderId === id);
        App.showModal(`Test Order — ${o.id}`, `
            <div class="grid-2 mb-3">
                <div><strong>Client:</strong> ${Utils.escapeHtml(o.client)}</div>
                <div><strong>Project:</strong> ${Utils.escapeHtml(o.project || '-')}</div>
                <div><strong>Test:</strong> ${service ? Utils.escapeHtml(service.name) : o.testServiceId}</div>
                <div><strong>Standard:</strong> ${service?.standard || '-'}</div>
                <div><strong>Samples:</strong> ${o.sampleCount}</div>
                <div><strong>Amount:</strong> ${Utils.formatCurrency(o.totalCost)}</div>
                <div><strong>Status:</strong> <span class="badge-tag ${Utils.getStatusClass(o.status)}">${o.status}</span></div>
                <div><strong>Date:</strong> ${Utils.formatDate(o.orderDate)}</div>
            </div>
            ${o.notes ? `<p class="text-sm text-muted"><strong>Notes:</strong> ${Utils.escapeHtml(o.notes)}</p>` : ''}
            <h4 class="mt-2 mb-1">Samples (${samples.length})</h4>
            ${samples.length > 0 ? Utils.buildTable([
                { label: 'Sample ID', render: r => r.id },
                { label: 'Description', render: r => Utils.escapeHtml(r.description || '-') },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], samples) : '<p>No samples logged yet.</p>'}
            <h4 class="mt-2 mb-1">Results (${results.length})</h4>
            ${results.length > 0 ? Utils.buildTable([
                { label: 'Result ID', render: r => r.id },
                { label: 'Parameter', render: r => Utils.escapeHtml(r.parameter || '-') },
                { label: 'Value', render: r => r.value || '-' },
                { label: 'Verdict', render: r => `<span class="badge-tag ${r.verdict==='pass'?'badge-success':'badge-danger'}">${r.verdict||'-'}</span>` }
            ], results) : '<p>No results recorded yet.</p>'}
        `);
    },

    updateOrderStatus(id) {
        const o = DataStore.testOrders.find(x => x.id === id);
        if (!o) return;
        App.showModal('Update Order Status', `
            <div class="form-group"><label>Status</label><select class="form-input" id="toStatus">
                <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
                <option value="in-progress" ${o.status==='in-progress'?'selected':''}>In Progress</option>
                <option value="completed" ${o.status==='completed'?'selected':''}>Completed</option>
                <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
            </select></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="TestingLab.saveOrderStatus('${id}')">Update</button>`
        );
    },

    saveOrderStatus(id) {
        const o = DataStore.testOrders.find(x => x.id === id);
        if (!o) return;
        o.status = document.getElementById('toStatus')?.value || o.status;
        Database.save(); App.closeModal(); App.showToast('Order status updated');
        this.renderOrders(document.getElementById('mainContent'));
    },

    renderSamples(container) {
        const samples = DataStore.testSamples;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Samples</h2><p>${samples.length} samples tracked</p></div>
            <button class="btn btn-primary" onclick="TestingLab.addSample()"><i class="fas fa-plus"></i> Log Sample</button>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${samples.length === 0 ? '<div class="empty-state"><i class="fas fa-microscope"></i><h3>No Samples</h3><p>Log test samples as they are received.</p></div>' :
            Utils.buildTable([
                { label: 'Sample ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Order', render: r => r.orderId || '-' },
                { label: 'Description', render: r => Utils.escapeHtml(r.description || '-') },
                { label: 'Source', render: r => Utils.escapeHtml(r.source || '-') },
                { label: 'Received', render: r => Utils.formatDate(r.receivedDate) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
            ], samples)}
        </div></div>`;
    },

    addSample() {
        App.showModal('Log Sample', `
            <div class="grid-2">
                <div class="form-group"><label>Test Order</label><select class="form-input" id="smOrder"><option value="">Select Order</option>${DataStore.testOrders.map(o=>`<option value="${o.id}">${o.id} — ${o.client}</option>`).join('')}</select></div>
                <div class="form-group"><label>Description</label><input type="text" class="form-input" id="smDesc"></div>
                <div class="form-group"><label>Source/Location</label><input type="text" class="form-input" id="smSource"></div>
                <div class="form-group"><label>Date Received</label><input type="date" class="form-input" id="smDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="TestingLab.saveSample()">Log</button>`
        );
    },

    saveSample() {
        DataStore.testSamples.push({
            id: Utils.generateId('SMP'),
            orderId: document.getElementById('smOrder')?.value || '',
            description: document.getElementById('smDesc')?.value?.trim() || '',
            source: document.getElementById('smSource')?.value?.trim() || '',
            receivedDate: document.getElementById('smDate')?.value || new Date().toISOString().split('T')[0],
            status: 'received'
        });
        Database.save(); App.closeModal(); App.showToast('Sample logged');
        this.renderSamples(document.getElementById('mainContent'));
    },

    renderResults(container) {
        const results = DataStore.testResults;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Test Results</h2><p>${results.length} results recorded</p></div>
            <button class="btn btn-primary" onclick="TestingLab.addResult()"><i class="fas fa-plus"></i> Add Result</button>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${results.length === 0 ? '<div class="empty-state"><i class="fas fa-poll"></i><h3>No Results</h3><p>Record test results from completed analyses.</p></div>' :
            Utils.buildTable([
                { label: 'Result ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Order', render: r => r.orderId || '-' },
                { label: 'Sample', render: r => r.sampleId || '-' },
                { label: 'Parameter', render: r => Utils.escapeHtml(r.parameter || '-') },
                { label: 'Value', render: r => r.value || '-' },
                { label: 'Specification', render: r => r.specification || '-' },
                { label: 'Verdict', render: r => `<span class="badge-tag ${r.verdict==='pass'?'badge-success':'badge-danger'}">${r.verdict||'-'}</span>` },
                { label: 'Date', render: r => Utils.formatDate(r.testDate) }
            ], results)}
        </div></div>`;
    },

    addResult() {
        App.showModal('Add Test Result', `
            <div class="grid-2">
                <div class="form-group"><label>Test Order</label><select class="form-input" id="trOrder">${DataStore.testOrders.map(o=>`<option value="${o.id}">${o.id} — ${o.client}</option>`).join('')}</select></div>
                <div class="form-group"><label>Sample</label><select class="form-input" id="trSample"><option value="">N/A</option>${DataStore.testSamples.map(s=>`<option value="${s.id}">${s.id}</option>`).join('')}</select></div>
                <div class="form-group"><label>Parameter</label><input type="text" class="form-input" id="trParam" placeholder="e.g. Compressive Strength"></div>
                <div class="form-group"><label>Value</label><input type="text" class="form-input" id="trValue" placeholder="e.g. 28.5 MPa"></div>
                <div class="form-group"><label>Specification</label><input type="text" class="form-input" id="trSpec" placeholder="e.g. Min 25 MPa"></div>
                <div class="form-group"><label>Verdict</label><select class="form-input" id="trVerdict"><option value="pass">Pass</option><option value="fail">Fail</option></select></div>
                <div class="form-group"><label>Test Date</label><input type="date" class="form-input" id="trDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="TestingLab.saveResult()">Save Result</button>`
        );
    },

    saveResult() {
        DataStore.testResults.push({
            id: Utils.generateId('RES'),
            orderId: document.getElementById('trOrder')?.value || '',
            sampleId: document.getElementById('trSample')?.value || '',
            parameter: document.getElementById('trParam')?.value?.trim() || '',
            value: document.getElementById('trValue')?.value?.trim() || '',
            specification: document.getElementById('trSpec')?.value?.trim() || '',
            verdict: document.getElementById('trVerdict')?.value || 'pass',
            testDate: document.getElementById('trDate')?.value || new Date().toISOString().split('T')[0]
        });
        Database.save(); App.closeModal(); App.showToast('Result recorded');
        this.renderResults(document.getElementById('mainContent'));
    },

    renderEquipment(container) {
        const equipment = DataStore.labEquipment;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Lab Equipment</h2><p>${equipment.length} items tracked</p></div>
            <button class="btn btn-primary" onclick="TestingLab.addEquipment()"><i class="fas fa-plus"></i> Add Equipment</button>
        </div>
        <div class="grid-3 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-tools"></i></div></div><div class="stat-value">${equipment.length}</div><div class="stat-label">Total Equipment</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check"></i></div></div><div class="stat-value">${equipment.filter(e=>e.status==='calibrated').length}</div><div class="stat-label">Calibrated</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-exclamation"></i></div></div><div class="stat-value">${equipment.filter(e=>e.status==='needs-calibration').length}</div><div class="stat-label">Needs Calibration</div></div>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${equipment.length === 0 ? '<div class="empty-state"><i class="fas fa-tools"></i><h3>No Equipment</h3><p>Register lab equipment and track calibration.</p></div>' :
            Utils.buildTable([
                { label: 'Equipment', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                { label: 'Model', render: r => Utils.escapeHtml(r.model || '-') },
                { label: 'Serial No.', render: r => r.serialNumber || '-' },
                { label: 'Category', render: r => `<span class="badge-tag badge-neutral">${r.category||'-'}</span>` },
                { label: 'Last Calibration', render: r => Utils.formatDate(r.lastCalibration) },
                { label: 'Next Calibration', render: r => Utils.formatDate(r.nextCalibration) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status||'-'}</span>` }
            ], equipment)}
        </div></div>`;
    },

    addEquipment() {
        App.showModal('Add Lab Equipment', `
            <div class="grid-2">
                <div class="form-group"><label>Equipment Name</label><input type="text" class="form-input" id="eqName" required></div>
                <div class="form-group"><label>Model</label><input type="text" class="form-input" id="eqModel"></div>
                <div class="form-group"><label>Serial Number</label><input type="text" class="form-input" id="eqSerial"></div>
                <div class="form-group"><label>Category</label><select class="form-input" id="eqCat"><option>Compression Machine</option><option>Sieve Shaker</option><option>Oven</option><option>Balance/Scale</option><option>Testing Mold</option><option>Other</option></select></div>
                <div class="form-group"><label>Last Calibration</label><input type="date" class="form-input" id="eqLastCal"></div>
                <div class="form-group"><label>Next Calibration</label><input type="date" class="form-input" id="eqNextCal"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="TestingLab.saveEquipment()">Save</button>`
        );
    },

    saveEquipment() {
        const name = document.getElementById('eqName')?.value?.trim();
        if (!name) { App.showToast('Name required', 'error'); return; }
        DataStore.labEquipment.push({
            id: Utils.generateId('EQP'),
            name, model: document.getElementById('eqModel')?.value?.trim() || '',
            serialNumber: document.getElementById('eqSerial')?.value?.trim() || '',
            category: document.getElementById('eqCat')?.value || 'Other',
            lastCalibration: document.getElementById('eqLastCal')?.value || '',
            nextCalibration: document.getElementById('eqNextCal')?.value || '',
            status: 'calibrated'
        });
        Database.save(); App.closeModal(); App.showToast('Equipment added');
        this.renderEquipment(document.getElementById('mainContent'));
    },

    renderQualityReviews(container) {
        const reviews = DataStore.qualityReviews;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Quality Reviews</h2><p>DPWH compliance &amp; quality assurance reviews</p></div>
            <button class="btn btn-primary" onclick="TestingLab.addReview()"><i class="fas fa-plus"></i> Add Review</button>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${reviews.length === 0 ? '<div class="empty-state"><i class="fas fa-award"></i><h3>No Quality Reviews</h3><p>Log quality reviews and compliance audits.</p></div>' :
            Utils.buildTable([
                { label: 'Review ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Type', render: r => r.type || '-' },
                { label: 'Reviewer', render: r => Utils.escapeHtml(r.reviewer || '-') },
                { label: 'Date', render: r => Utils.formatDate(r.date) },
                { label: 'Findings', render: r => Utils.escapeHtml(r.findings || '-') },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status||'-'}</span>` }
            ], reviews)}
        </div></div>`;
    },

    addReview() {
        App.showModal('Add Quality Review', `
            <div class="grid-2">
                <div class="form-group"><label>Type</label><select class="form-input" id="qrType"><option>Internal Audit</option><option>DPWH Review</option><option>ISO Audit</option><option>Client Review</option></select></div>
                <div class="form-group"><label>Reviewer</label><input type="text" class="form-input" id="qrReviewer"></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="qrDate" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="qrStatus"><option value="passed">Passed</option><option value="needs-improvement">Needs Improvement</option><option value="failed">Failed</option></select></div>
            </div>
            <div class="form-group"><label>Findings/Remarks</label><textarea class="form-input" id="qrFindings" rows="3"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="TestingLab.saveReview()">Save</button>`
        );
    },

    saveReview() {
        DataStore.qualityReviews.push({
            id: Utils.generateId('QR'),
            type: document.getElementById('qrType')?.value || 'Internal Audit',
            reviewer: document.getElementById('qrReviewer')?.value?.trim() || '',
            date: document.getElementById('qrDate')?.value || new Date().toISOString().split('T')[0],
            findings: document.getElementById('qrFindings')?.value?.trim() || '',
            status: document.getElementById('qrStatus')?.value || 'passed'
        });
        Database.save(); App.closeModal(); App.showToast('Quality review added');
        this.renderQualityReviews(document.getElementById('mainContent'));
    }
};
