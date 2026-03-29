/* ========================================
   SJC UBMS - ISO Quality Management Module
   ISO quality management system
   ======================================== */

const ISO = {
    render(container) {
        if (!DataStore.isoDocuments) DataStore.isoDocuments = [];
        if (!DataStore.isoAudits) DataStore.isoAudits = [];
        if (!DataStore.isoCAPAs) DataStore.isoCAPAs = [];
        const docs = DataStore.isoDocuments;
        const audits = DataStore.isoAudits;
        const capas = DataStore.isoCAPAs;

        container.innerHTML = `
        <div class="section-header"><div><h2>ISO Quality Management</h2><p>Document control, audits, and CAPA management</p></div></div>

        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-file-alt"></i></div></div><div class="stat-value">${docs.length}</div><div class="stat-label">Documents</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-clipboard-check"></i></div></div><div class="stat-value">${audits.length}</div><div class="stat-label">Audits</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-exclamation-circle"></i></div></div><div class="stat-value">${capas.filter(c=>c.status==='open').length}</div><div class="stat-label">Open CAPAs</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon purple"><i class="fas fa-certificate"></i></div></div><div class="stat-value">${docs.filter(d=>d.status==='approved').length}</div><div class="stat-label">Approved Docs</div></div>
        </div>

        <div class="tabs mb-3">
            <button class="tab-btn active" onclick="ISO.switchTab(this,'docsTab')">Documents</button>
            <button class="tab-btn" onclick="ISO.switchTab(this,'auditsTab')">Audits</button>
            <button class="tab-btn" onclick="ISO.switchTab(this,'capaTab')">CAPA</button>
        </div>

        <div id="docsTab">
            <div class="section-header mb-2"><div></div><button class="btn btn-primary" onclick="ISO.addDocument()"><i class="fas fa-plus"></i> Add Document</button></div>
            <div class="card"><div class="card-body no-padding">
                ${docs.length === 0 ? '<div class="empty-state"><i class="fas fa-folder-open"></i><h3>No Documents</h3></div>' :
                Utils.buildTable([
                    { label: 'Doc ID', render: r => `<strong>${r.id}</strong>` },
                    { label: 'Title', render: r => Utils.escapeHtml(r.title) },
                    { label: 'Type', render: r => `<span class="badge-tag badge-neutral">${r.type||'-'}</span>` },
                    { label: 'Revision', render: r => r.revision || '1.0' },
                    { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                    { label: 'Date', render: r => Utils.formatDate(r.date) }
                ], docs)}
            </div></div>
        </div>

        <div id="auditsTab" class="hidden">
            <div class="section-header mb-2"><div></div><button class="btn btn-primary" onclick="ISO.addAudit()"><i class="fas fa-plus"></i> Schedule Audit</button></div>
            <div class="card"><div class="card-body no-padding">
                ${audits.length === 0 ? '<div class="empty-state"><i class="fas fa-clipboard-check"></i><h3>No Audits</h3></div>' :
                Utils.buildTable([
                    { label: 'Audit ID', render: r => `<strong>${r.id}</strong>` },
                    { label: 'Type', render: r => r.type || '-' },
                    { label: 'Scope', render: r => Utils.escapeHtml(r.scope || '-') },
                    { label: 'Auditor', render: r => Utils.escapeHtml(r.auditor || '-') },
                    { label: 'Date', render: r => Utils.formatDate(r.date) },
                    { label: 'Findings', render: r => r.findings || 0 },
                    { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
                ], audits)}
            </div></div>
        </div>

        <div id="capaTab" class="hidden">
            <div class="section-header mb-2"><div></div><button class="btn btn-primary" onclick="ISO.addCAPA()"><i class="fas fa-plus"></i> Create CAPA</button></div>
            <div class="card"><div class="card-body no-padding">
                ${capas.length === 0 ? '<div class="empty-state"><i class="fas fa-tools"></i><h3>No CAPAs</h3></div>' :
                Utils.buildTable([
                    { label: 'CAPA ID', render: r => `<strong>${r.id}</strong>` },
                    { label: 'Type', render: r => `<span class="badge-tag ${r.type==='corrective'?'badge-danger':'badge-warning'}">${r.type}</span>` },
                    { label: 'Description', render: r => Utils.escapeHtml((r.description||'').substring(0,60)) },
                    { label: 'Root Cause', render: r => Utils.escapeHtml((r.rootCause||'').substring(0,40)) },
                    { label: 'Due Date', render: r => Utils.formatDate(r.dueDate) },
                    { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` }
                ], capas)}
            </div></div>
        </div>`;
    },

    switchTab(btn, tabId) {
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['docsTab','auditsTab','capaTab'].forEach(t => { const el = document.getElementById(t); if (el) el.classList.toggle('hidden', t !== tabId); });
    },

    addDocument() {
        App.showModal('Add ISO Document', `
            <div class="grid-2">
                <div class="form-group"><label>Title</label><input type="text" class="form-input" id="isoTitle" required></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="isoDocType"><option>Quality Manual</option><option>Procedure</option><option>Work Instruction</option><option>Form/Template</option><option>Policy</option><option>Record</option></select></div>
                <div class="form-group"><label>Revision</label><input type="text" class="form-input" id="isoRev" value="1.0"></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="isoDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="ISO.saveDocument()">Save</button>`
        );
    },

    saveDocument() {
        const title = document.getElementById('isoTitle')?.value?.trim();
        if (!title) { App.showToast('Title required', 'error'); return; }
        DataStore.isoDocuments.push({
            id: Utils.generateId('DOC'),
            title,
            type: document.getElementById('isoDocType')?.value || 'Procedure',
            revision: document.getElementById('isoRev')?.value || '1.0',
            date: document.getElementById('isoDate')?.value || new Date().toISOString().split('T')[0],
            status: 'draft'
        });
        Database.save(); App.closeModal(); App.showToast('Document added');
        this.render(document.getElementById('mainContent'));
    },

    addAudit() {
        App.showModal('Schedule Audit', `
            <div class="grid-2">
                <div class="form-group"><label>Type</label><select class="form-input" id="auditType"><option>Internal Audit</option><option>External Audit</option><option>Surveillance Audit</option></select></div>
                <div class="form-group"><label>Scope</label><input type="text" class="form-input" id="auditScope" placeholder="e.g. Quality processes"></div>
                <div class="form-group"><label>Auditor</label><input type="text" class="form-input" id="auditAuditor"></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="auditDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="ISO.saveAudit()">Save</button>`
        );
    },

    saveAudit() {
        DataStore.isoAudits.push({
            id: Utils.generateId('AUD'),
            type: document.getElementById('auditType')?.value || 'Internal Audit',
            scope: document.getElementById('auditScope')?.value?.trim() || '',
            auditor: document.getElementById('auditAuditor')?.value?.trim() || '',
            date: document.getElementById('auditDate')?.value || new Date().toISOString().split('T')[0],
            findings: 0, status: 'scheduled'
        });
        Database.save(); App.closeModal(); App.showToast('Audit scheduled');
        this.render(document.getElementById('mainContent'));
    },

    addCAPA() {
        App.showModal('Create CAPA', `
            <div class="grid-2">
                <div class="form-group"><label>Type</label><select class="form-input" id="capaType"><option value="corrective">Corrective Action</option><option value="preventive">Preventive Action</option></select></div>
                <div class="form-group"><label>Due Date</label><input type="date" class="form-input" id="capaDue"></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="capaDesc" rows="2"></textarea></div>
            <div class="form-group"><label>Root Cause</label><textarea class="form-input" id="capaRoot" rows="2"></textarea></div>
            <div class="form-group"><label>Action Plan</label><textarea class="form-input" id="capaPlan" rows="2"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="ISO.saveCAPA()">Create</button>`
        );
    },

    saveCAPA() {
        DataStore.isoCAPAs.push({
            id: Utils.generateId('CAPA'),
            type: document.getElementById('capaType')?.value || 'corrective',
            description: document.getElementById('capaDesc')?.value?.trim() || '',
            rootCause: document.getElementById('capaRoot')?.value?.trim() || '',
            actionPlan: document.getElementById('capaPlan')?.value?.trim() || '',
            dueDate: document.getElementById('capaDue')?.value || '',
            status: 'open'
        });
        Database.save(); App.closeModal(); App.showToast('CAPA created');
        this.render(document.getElementById('mainContent'));
    }
};
