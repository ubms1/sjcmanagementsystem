/* ========================================
   SJC UBMS - Construction Hub Module
   Projects, Monitoring, Job Costing, etc.
   ======================================== */

const Construction = {
    renderProjects(container) {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const projects = DataStore.projects.filter(p => p.company === company);

        container.innerHTML = `
        <div class="section-header">
            <div><h2>Projects</h2><p>${projects.length} total projects</p></div>
            <button class="btn btn-primary" onclick="Construction.addProject()"><i class="fas fa-plus"></i> New Project</button>
        </div>
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-project-diagram"></i></div></div><div class="stat-value">${projects.length}</div><div class="stat-label">Total</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-spinner"></i></div></div><div class="stat-value">${projects.filter(p=>p.status==='in-progress').length}</div><div class="stat-label">Active</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-check-circle"></i></div></div><div class="stat-value">${projects.filter(p=>p.status==='completed').length}</div><div class="stat-label">Completed</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(projects.reduce((s,p)=>s+p.budget,0), true)}</div><div class="stat-label">Total Budget</div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Project List</h3></div><div class="card-body no-padding">
            ${projects.length === 0 ? '<div class="empty-state"><i class="fas fa-hard-hat"></i><h3>No Projects Yet</h3><p>Add your first construction project.</p></div>' :
            Utils.buildTable([
                { label: 'Project', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong><div class="text-xs text-muted">${Utils.escapeHtml(r.location||'')}</div>` },
                { label: 'Client', render: r => Utils.escapeHtml(r.client||'-') },
                { label: 'Budget', render: r => Utils.formatCurrency(r.budget) },
                { label: 'Progress', render: r => `<div class="table-progress-cell"><div class="progress-bar"><div class="progress-fill ${r.progress>=75?'green':r.progress>=50?'blue':'orange'}" style="width:${r.progress}%"></div></div><span class="table-progress-pct">${r.progress}%</span></div>` },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Start', render: r => Utils.formatDate(r.startDate) },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="Construction.editProject('${r.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="Construction.deleteProject('${r.id}')"><i class="fas fa-trash"></i></button>` }
            ], projects)}
        </div></div>`;
    },

    addProject() {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const custOpts = DataStore.customers.map(c=>`<option value="${Utils.escapeHtml(c.name)}">${Utils.escapeHtml(c.name)}</option>`).join('');
        App.showModal('New Project', `
            <form id="projectForm">
                <div class="grid-2">
                    <div class="form-group"><label>Project Name</label><input type="text" class="form-input" id="pName" required></div>
                    <div class="form-group"><label>Client</label><select class="form-input" id="pClient"><option value="">— Select Client —</option>${custOpts}</select></div>
                    <div class="form-group"><label>Location</label><input type="text" class="form-input" id="pLocation"></div>
                    <div class="form-group"><label>Budget (₱)</label><input type="number" class="form-input" id="pBudget" min="0"></div>
                    <div class="form-group"><label>Start Date</label><input type="date" class="form-input" id="pStart"></div>
                    <div class="form-group"><label>End Date</label><input type="date" class="form-input" id="pEnd"></div>
                    <div class="form-group"><label>Status</label><select class="form-input" id="pStatus"><option value="planning">Planning</option><option value="in-progress">In Progress</option><option value="on-hold">On Hold</option><option value="completed">Completed</option></select></div>
                    <div class="form-group"><label>Progress (%)</label><input type="number" class="form-input" id="pProgress" min="0" max="100" value="0"></div>
                </div>
                <div class="form-group"><label>Description</label><textarea class="form-input" id="pDesc" rows="3"></textarea></div>
            </form>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Construction.saveProject()">Save Project</button>`
        );
    },

    saveProject() {
        const name = document.getElementById('pName')?.value?.trim();
        if (!name) { App.showToast('Project name is required', 'error'); return; }
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const project = {
            id: Utils.generateId('PRJ'),
            company,
            name,
            client: document.getElementById('pClient')?.value?.trim() || '',
            location: document.getElementById('pLocation')?.value?.trim() || '',
            budget: parseFloat(document.getElementById('pBudget')?.value) || 0,
            startDate: document.getElementById('pStart')?.value || '',
            endDate: document.getElementById('pEnd')?.value || '',
            status: document.getElementById('pStatus')?.value || 'planning',
            progress: parseInt(document.getElementById('pProgress')?.value) || 0,
            description: document.getElementById('pDesc')?.value?.trim() || '',
            createdAt: new Date().toISOString()
        };
        DataStore.projects.push(project);
        Database.save();
        App.closeModal();
        App.showToast('Project created successfully');
        this.renderProjects(document.getElementById('mainContent'));
    },

    editProject(id) {
        const p = DataStore.projects.find(pr => pr.id === id);
        if (!p) return;
        const custOpts = DataStore.customers.map(c=>`<option value="${Utils.escapeHtml(c.name)}" ${p.client===c.name?'selected':''}>${Utils.escapeHtml(c.name)}</option>`).join('');
        App.showModal('Edit Project', `
            <form id="projectForm">
                <div class="grid-2">
                    <div class="form-group"><label>Project Name</label><input type="text" class="form-input" id="pName" value="${Utils.escapeHtml(p.name)}" required></div>
                    <div class="form-group"><label>Client</label><select class="form-input" id="pClient"><option value="">— Select Client —</option>${custOpts}</select></div>
                    <div class="form-group"><label>Location</label><input type="text" class="form-input" id="pLocation" value="${Utils.escapeHtml(p.location||'')}"></div>
                    <div class="form-group"><label>Budget (₱)</label><input type="number" class="form-input" id="pBudget" value="${p.budget}" min="0"></div>
                    <div class="form-group"><label>Start Date</label><input type="date" class="form-input" id="pStart" value="${p.startDate}"></div>
                    <div class="form-group"><label>End Date</label><input type="date" class="form-input" id="pEnd" value="${p.endDate}"></div>
                    <div class="form-group"><label>Status</label><select class="form-input" id="pStatus"><option value="planning" ${p.status==='planning'?'selected':''}>Planning</option><option value="in-progress" ${p.status==='in-progress'?'selected':''}>In Progress</option><option value="on-hold" ${p.status==='on-hold'?'selected':''}>On Hold</option><option value="completed" ${p.status==='completed'?'selected':''}>Completed</option></select></div>
                    <div class="form-group"><label>Progress (%)</label><input type="number" class="form-input" id="pProgress" value="${p.progress}" min="0" max="100"></div>
                </div>
                <div class="form-group"><label>Description</label><textarea class="form-input" id="pDesc" rows="3">${Utils.escapeHtml(p.description||'')}</textarea></div>
            </form>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Construction.updateProject('${id}')">Update Project</button>`
        );
    },

    updateProject(id) {
        const p = DataStore.projects.find(pr => pr.id === id);
        if (!p) return;
        const name = document.getElementById('pName')?.value?.trim();
        if (!name) { App.showToast('Project name is required', 'error'); return; }
        p.name = name;
        p.client = document.getElementById('pClient')?.value?.trim() || '';
        p.location = document.getElementById('pLocation')?.value?.trim() || '';
        p.budget = parseFloat(document.getElementById('pBudget')?.value) || 0;
        p.startDate = document.getElementById('pStart')?.value || '';
        p.endDate = document.getElementById('pEnd')?.value || '';
        p.status = document.getElementById('pStatus')?.value || 'planning';
        p.progress = parseInt(document.getElementById('pProgress')?.value) || 0;
        p.description = document.getElementById('pDesc')?.value?.trim() || '';
        Database.save();
        App.closeModal();
        App.showToast('Project updated');
        this.renderProjects(document.getElementById('mainContent'));
    },

    deleteProject(id) {
        App.confirmAction('Delete this project? This cannot be undone.', () => {
            DataStore.projects = DataStore.projects.filter(p => p.id !== id);
            Database.save();
            App.showToast('Project deleted');
            this.renderProjects(document.getElementById('mainContent'));
        });
    },

    renderMonitoring(container) {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const active = DataStore.projects.filter(p => p.company === company && p.status === 'in-progress');
        container.innerHTML = `
        <div class="section-header"><div><h2>Project Monitoring</h2><p>Track active project progress</p></div></div>
        ${active.length === 0 ? '<div class="empty-state"><i class="fas fa-tasks"></i><h3>No Active Projects</h3></div>' :
        active.map(p => `
            <div class="card mb-3">
                <div class="card-header"><h3>${Utils.escapeHtml(p.name)}</h3><span class="badge-tag ${Utils.getStatusClass(p.status)}">${p.status}</span></div>
                <div class="card-body">
                    <div class="grid-4 mb-3">
                        <div><div class="detail-label">Client</div><div class="detail-value">${Utils.escapeHtml(p.client||'-')}</div></div>
                        <div><div class="detail-label">Location</div><div class="detail-value">${Utils.escapeHtml(p.location||'-')}</div></div>
                        <div><div class="detail-label">Budget</div><div class="detail-value">${Utils.formatCurrency(p.budget)}</div></div>
                        <div><div class="detail-label">Timeline</div><div class="detail-value">${Utils.formatDate(p.startDate)} — ${Utils.formatDate(p.endDate)}</div></div>
                    </div>
                    <div class="progress-header"><span class="progress-header-label">Progress</span><span class="progress-header-pct">${p.progress}%</span></div>
                    <div class="progress-bar progress-bar-lg"><div class="progress-fill ${p.progress>=75?'green':p.progress>=50?'blue':'orange'}" style="width:${p.progress}%"></div></div>
                </div>
            </div>
        `).join('')}`;
    },

    renderJobCosting(container) {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const projects = DataStore.projects.filter(p => p.company === company);
        container.innerHTML = `
        <div class="section-header"><div><h2>Job Costing</h2><p>Budget vs actual tracking</p></div></div>
        <div class="card"><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'Project', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                { label: 'Budget', render: r => Utils.formatCurrency(r.budget) },
                { label: 'Spent', render: r => { const spent = r.budget * (r.progress / 100) * 0.95; return Utils.formatCurrency(spent); }},
                { label: 'Remaining', render: r => { const spent = r.budget * (r.progress / 100) * 0.95; return Utils.formatCurrency(r.budget - spent); }},
                { label: 'Variance', render: r => { const variance = r.budget * 0.05 * (r.progress / 100); return `<span class="text-success fw-bold">+${Utils.formatCurrency(variance)}</span>`; }},
                { label: 'Progress', render: r => `${r.progress}%` }
            ], projects)}
        </div></div>`;
    },

    renderSubcontractors(container) {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const subs = (DataStore.subcontractors || []).filter(s => s.company === company);
        container.innerHTML = `
        <div class="section-header"><div><h2>Subcontractors</h2><p>Manage subcontractor relationships</p></div><button class="btn btn-primary" onclick="Construction.addSubcontractor()"><i class="fas fa-plus"></i> Add Subcontractor</button></div>
        <div class="card"><div class="card-header"><h3>Subcontractor Registry</h3></div><div class="card-body no-padding">
            ${subs.length === 0 ? '<div class="empty-state"><i class="fas fa-people-carry"></i><h3>No Subcontractors Yet</h3><p>Add and manage your construction subcontractors here.</p></div>' :
            Utils.buildTable([
                { label: 'Company', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                { label: 'Contact Person', render: r => Utils.escapeHtml(r.contact||'-') },
                { label: 'Phone', render: r => Utils.escapeHtml(r.phone||'-') },
                { label: 'Specialty', render: r => Utils.escapeHtml(r.specialty||'General') },
                { label: 'Actions', render: r => `<button class="btn btn-sm btn-danger" onclick="Construction.deleteSubcontractor('${r.id}')"><i class="fas fa-trash"></i></button>` }
            ], subs)}
        </div></div>`;
    },

    addSubcontractor() {
        App.showModal('Add Subcontractor', `
            <div class="grid-2">
                <div class="form-group"><label>Company Name</label><input type="text" class="form-input" id="scName" required></div>
                <div class="form-group"><label>Contact Person</label><input type="text" class="form-input" id="scContact"></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="scPhone"></div>
                <div class="form-group"><label>Specialty</label><select class="form-input" id="scSpecialty"><option>General</option><option>Electrical</option><option>Plumbing</option><option>Structural</option><option>Finishing</option><option>Heavy Equipment</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" onclick="Construction.saveSubcontractor()">Save</button>`
        );
    },

    saveSubcontractor() {
        const name = document.getElementById('scName')?.value?.trim();
        if (!name) { App.showToast('Company name is required', 'error'); return; }
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        if (!DataStore.subcontractors) DataStore.subcontractors = [];
        DataStore.subcontractors.push({
            id: Utils.generateId('SUB'),
            company,
            name,
            contact: document.getElementById('scContact')?.value?.trim() || '',
            phone: document.getElementById('scPhone')?.value?.trim() || '',
            specialty: document.getElementById('scSpecialty')?.value || 'General',
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Subcontractor added successfully');
        this.renderSubcontractors(document.getElementById('mainContent'));
    },

    deleteSubcontractor(id) {
        if (!confirm('Delete this subcontractor?')) return;
        if (!DataStore.subcontractors) return;
        DataStore.subcontractors = DataStore.subcontractors.filter(s => s.id !== id);
        Database.save();
        App.showToast('Subcontractor removed');
        this.renderSubcontractors(document.getElementById('mainContent'));
    },

    renderEquipment(container) {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const equipment = (DataStore.equipment || []).filter(e => e.company === company);
        const heavy = equipment.filter(e => e.category === 'heavy');
        const vehicles = equipment.filter(e => e.category === 'vehicle');
        const maintenance = equipment.filter(e => e.status === 'maintenance');
        const projects = DataStore.projects.filter(p => p.company === company);
        container.innerHTML = `
        <div class="section-header"><div><h2>Equipment &amp; Fleet</h2><p>Manage construction equipment and vehicles</p></div><button class="btn btn-primary" onclick="Construction.addEquipment()"><i class="fas fa-plus"></i> Add Equipment</button></div>
        <div class="grid-3 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-truck-monster"></i></div></div><div class="stat-value">${heavy.length}</div><div class="stat-label">Heavy Equipment</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-truck"></i></div></div><div class="stat-value">${vehicles.length}</div><div class="stat-label">Vehicles</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-tools"></i></div></div><div class="stat-value">${maintenance.length}</div><div class="stat-label">Under Maintenance</div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Equipment Registry</h3></div><div class="card-body no-padding">
            ${equipment.length === 0 ? '<div class="empty-state"><i class="fas fa-truck-monster"></i><h3>No Equipment Yet</h3><p>Add your construction equipment and fleet.</p></div>' :
            Utils.buildTable([
                { label: 'Equipment', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong><div class="text-xs text-muted">${Utils.escapeHtml(r.serialNumber||'')}</div>` },
                { label: 'Type', render: r => Utils.escapeHtml(r.type||'-') },
                { label: 'Plate / Serial', render: r => Utils.escapeHtml(r.plateNumber||r.serialNumber||'-') },
                { label: 'Status', render: r => `<span class="badge-tag ${r.status==='active'?'badge-success':r.status==='maintenance'?'badge-warning':'badge-secondary'}">${r.status||'active'}</span>` },
                { label: 'Assigned To', render: r => Utils.escapeHtml(r.assignedProject||'Unassigned') },
                { label: 'Next Maint.', render: r => r.nextMaintenance ? Utils.formatDate(r.nextMaintenance) : '-' },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="Construction.editEquipment('${r.id}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="Construction.deleteEquipment('${r.id}')"><i class="fas fa-trash"></i></button>` }
            ], equipment)}
        </div></div>`;
    },

    addEquipment() {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const projects = DataStore.projects.filter(p => p.company === company);
        App.showModal('Add Equipment', `
            <form id="equipForm">
                <div class="grid-2">
                    <div class="form-group"><label>Equipment Name</label><input type="text" class="form-input" id="eqName" required></div>
                    <div class="form-group"><label>Category</label><select class="form-input" id="eqCategory"><option value="heavy">Heavy Equipment</option><option value="vehicle">Vehicle</option><option value="tool">Power Tool</option><option value="other">Other</option></select></div>
                    <div class="form-group"><label>Type / Model</label><input type="text" class="form-input" id="eqType" placeholder="e.g. Backhoe, Dump Truck"></div>
                    <div class="form-group"><label>Plate / Serial No.</label><input type="text" class="form-input" id="eqSerial"></div>
                    <div class="form-group"><label>Status</label><select class="form-input" id="eqStatus"><option value="active">Active / Operational</option><option value="maintenance">Under Maintenance</option><option value="idle">Idle</option><option value="retired">Retired</option></select></div>
                    <div class="form-group"><label>Assigned Project</label><select class="form-input" id="eqProject"><option value="">Unassigned</option>${projects.map(p=>`<option value="${Utils.escapeHtml(p.name)}">${Utils.escapeHtml(p.name)}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Last Maintenance</label><input type="date" class="form-input" id="eqLastMaint"></div>
                    <div class="form-group"><label>Next Maintenance</label><input type="date" class="form-input" id="eqNextMaint"></div>
                </div>
                <div class="form-group"><label>Notes</label><textarea class="form-input" id="eqNotes" rows="2"></textarea></div>
            </form>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Construction.saveEquipment()">Save Equipment</button>`
        );
    },

    saveEquipment() {
        const name = document.getElementById('eqName')?.value?.trim();
        if (!name) { App.showToast('Equipment name is required', 'error'); return; }
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        if (!DataStore.equipment) DataStore.equipment = [];
        DataStore.equipment.push({
            id: Utils.generateId('EQ'),
            company,
            name,
            category: document.getElementById('eqCategory')?.value || 'other',
            type: document.getElementById('eqType')?.value?.trim() || '',
            serialNumber: document.getElementById('eqSerial')?.value?.trim() || '',
            plateNumber: document.getElementById('eqSerial')?.value?.trim() || '',
            status: document.getElementById('eqStatus')?.value || 'active',
            assignedProject: document.getElementById('eqProject')?.value || '',
            lastMaintenance: document.getElementById('eqLastMaint')?.value || '',
            nextMaintenance: document.getElementById('eqNextMaint')?.value || '',
            notes: document.getElementById('eqNotes')?.value?.trim() || '',
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Equipment added successfully');
        this.renderEquipment(document.getElementById('mainContent'));
    },

    editEquipment(id) {
        const eq = (DataStore.equipment || []).find(e => e.id === id);
        if (!eq) return;
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const projects = DataStore.projects.filter(p => p.company === company);
        App.showModal('Edit Equipment', `
            <form id="equipForm">
                <div class="grid-2">
                    <div class="form-group"><label>Equipment Name</label><input type="text" class="form-input" id="eqName" value="${Utils.escapeHtml(eq.name)}" required></div>
                    <div class="form-group"><label>Category</label><select class="form-input" id="eqCategory"><option value="heavy" ${eq.category==='heavy'?'selected':''}>Heavy Equipment</option><option value="vehicle" ${eq.category==='vehicle'?'selected':''}>Vehicle</option><option value="tool" ${eq.category==='tool'?'selected':''}>Power Tool</option><option value="other" ${eq.category==='other'?'selected':''}>Other</option></select></div>
                    <div class="form-group"><label>Type / Model</label><input type="text" class="form-input" id="eqType" value="${Utils.escapeHtml(eq.type||'')}"></div>
                    <div class="form-group"><label>Plate / Serial No.</label><input type="text" class="form-input" id="eqSerial" value="${Utils.escapeHtml(eq.serialNumber||'')}"></div>
                    <div class="form-group"><label>Status</label><select class="form-input" id="eqStatus"><option value="active" ${eq.status==='active'?'selected':''}>Active / Operational</option><option value="maintenance" ${eq.status==='maintenance'?'selected':''}>Under Maintenance</option><option value="idle" ${eq.status==='idle'?'selected':''}>Idle</option><option value="retired" ${eq.status==='retired'?'selected':''}>Retired</option></select></div>
                    <div class="form-group"><label>Assigned Project</label><select class="form-input" id="eqProject"><option value="">Unassigned</option>${projects.map(p=>`<option value="${Utils.escapeHtml(p.name)}" ${eq.assignedProject===p.name?'selected':''}>${Utils.escapeHtml(p.name)}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Last Maintenance</label><input type="date" class="form-input" id="eqLastMaint" value="${eq.lastMaintenance||''}"></div>
                    <div class="form-group"><label>Next Maintenance</label><input type="date" class="form-input" id="eqNextMaint" value="${eq.nextMaintenance||''}"></div>
                </div>
                <div class="form-group"><label>Notes</label><textarea class="form-input" id="eqNotes" rows="2">${Utils.escapeHtml(eq.notes||'')}</textarea></div>
            </form>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Construction.updateEquipment('${id}')">Update Equipment</button>`
        );
    },

    updateEquipment(id) {
        const eq = (DataStore.equipment || []).find(e => e.id === id);
        if (!eq) return;
        const name = document.getElementById('eqName')?.value?.trim();
        if (!name) { App.showToast('Equipment name is required', 'error'); return; }
        eq.name = name;
        eq.category = document.getElementById('eqCategory')?.value || eq.category;
        eq.type = document.getElementById('eqType')?.value?.trim() || '';
        eq.serialNumber = document.getElementById('eqSerial')?.value?.trim() || '';
        eq.plateNumber = eq.serialNumber;
        eq.status = document.getElementById('eqStatus')?.value || eq.status;
        eq.assignedProject = document.getElementById('eqProject')?.value || '';
        eq.lastMaintenance = document.getElementById('eqLastMaint')?.value || '';
        eq.nextMaintenance = document.getElementById('eqNextMaint')?.value || '';
        eq.notes = document.getElementById('eqNotes')?.value?.trim() || '';
        Database.save();
        App.closeModal();
        App.showToast('Equipment updated successfully');
        this.renderEquipment(document.getElementById('mainContent'));
    },

    deleteEquipment(id) {
        if (!confirm('Delete this equipment?')) return;
        DataStore.equipment = (DataStore.equipment || []).filter(e => e.id !== id);
        Database.save();
        App.showToast('Equipment removed');
        this.renderEquipment(document.getElementById('mainContent'));
    },

    renderSafety(container) {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        if (!DataStore.safetyRecords) DataStore.safetyRecords = [];
        const records = DataStore.safetyRecords.filter(r => r.company === company);
        const incidents = records.filter(r => r.recordType === 'incident');
        const inspections = records.filter(r => r.recordType === 'inspection');
        const openIssues = records.filter(r => r.status === 'open');
        const lastIncident = incidents.length > 0 ? new Date(incidents.sort((a,b) => new Date(b.date)-new Date(a.date))[0].date) : null;
        const daysSafe = lastIncident ? Math.floor((new Date() - lastIncident) / 86400000) : 999;

        container.innerHTML = `
        <div class="section-header">
            <div><h2>Safety / QHSE</h2><p>Quality, Health, Safety &amp; Environment management</p></div>
            <div class="flex-gap">
                <button class="btn btn-danger" onclick="Construction.addIncident()"><i class="fas fa-exclamation-triangle"></i> Report Incident</button>
                <button class="btn btn-primary" onclick="Construction.addInspection()"><i class="fas fa-clipboard-check"></i> Schedule Inspection</button>
            </div>
        </div>
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-shield-alt"></i></div></div><div class="stat-value">${daysSafe === 999 ? '0' : daysSafe}</div><div class="stat-label">Days Without Incident</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-clipboard-check"></i></div></div><div class="stat-value">${inspections.length}</div><div class="stat-label">Inspections</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-exclamation-triangle"></i></div></div><div class="stat-value">${incidents.length}</div><div class="stat-label">Incidents</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-clock"></i></div></div><div class="stat-value">${openIssues.length}</div><div class="stat-label">Open Issues</div></div>
        </div>
        <div class="tabs mb-3">
            <button class="tab-btn active" onclick="Construction.safetySwitchTab(this,'safetyIncidents')">Incidents</button>
            <button class="tab-btn" onclick="Construction.safetySwitchTab(this,'safetyInspections')">Inspections</button>
        </div>
        <div id="safetyIncidents">
            <div class="card"><div class="card-body no-padding">
                ${incidents.length === 0 ? '<div class="empty-state"><i class="fas fa-shield-alt"></i><h3>No Incidents Recorded</h3><p>No safety incidents on file — good job!</p></div>' :
                Utils.buildTable([
                    { label: 'Date', render: r => Utils.formatDate(r.date) },
                    { label: 'Type', render: r => `<span class="badge-tag badge-danger">${Utils.escapeHtml(r.incidentType||'-')}</span>` },
                    { label: 'Description', render: r => Utils.escapeHtml((r.description||'').substring(0,60)) },
                    { label: 'Persons Involved', render: r => Utils.escapeHtml(r.personsInvolved||'-') },
                    { label: 'Severity', render: r => `<span class="badge-tag ${r.severity==='high'?'badge-danger':r.severity==='medium'?'badge-warning':'badge-neutral'}">${r.severity||'low'}</span>` },
                    { label: 'Status', render: r => `<span class="badge-tag ${r.status==='closed'?'badge-success':'badge-warning'}">${r.status||'open'}</span>` },
                    { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="Construction.closeSafetyRecord('${r.id}')"><i class="fas fa-check"></i></button> <button class="btn btn-sm btn-danger" onclick="Construction.deleteSafetyRecord('${r.id}')"><i class="fas fa-trash"></i></button>` }
                ], incidents)}
            </div></div>
        </div>
        <div id="safetyInspections" class="hidden">
            <div class="card"><div class="card-body no-padding">
                ${inspections.length === 0 ? '<div class="empty-state"><i class="fas fa-clipboard-check"></i><h3>No Inspections</h3><p>Schedule your first safety inspection.</p></div>' :
                Utils.buildTable([
                    { label: 'Date', render: r => Utils.formatDate(r.date) },
                    { label: 'Type', render: r => `<span class="badge-tag badge-primary">${Utils.escapeHtml(r.inspectionType||'-')}</span>` },
                    { label: 'Area / Project', render: r => Utils.escapeHtml(r.area||'-') },
                    { label: 'Inspector', render: r => Utils.escapeHtml(r.inspector||'-') },
                    { label: 'Findings', render: r => Utils.escapeHtml((r.findings||'None').substring(0,60)) },
                    { label: 'Status', render: r => `<span class="badge-tag ${r.status==='passed'?'badge-success':r.status==='failed'?'badge-danger':'badge-warning'}">${r.status||'pending'}</span>` },
                    { label: 'Actions', render: r => `<button class="btn btn-sm btn-danger" onclick="Construction.deleteSafetyRecord('${r.id}')"><i class="fas fa-trash"></i></button>` }
                ], inspections)}
            </div></div>
        </div>`;
    },

    safetySwitchTab(btn, tabId) {
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['safetyIncidents','safetyInspections'].forEach(t => { const el = document.getElementById(t); if (el) el.classList.toggle('hidden', t !== tabId); });
    },

    addIncident() {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const projects = DataStore.projects.filter(p => p.company === company);
        App.showModal('Report Safety Incident', `
            <div class="grid-2">
                <div class="form-group"><label>Date of Incident</label><input type="date" class="form-input" id="siDate" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Incident Type</label><select class="form-input" id="siType"><option>Near Miss</option><option>First Aid</option><option>Medical Treatment</option><option>Lost Time Injury</option><option>Property Damage</option><option>Environmental Spill</option><option>Fire</option><option>Other</option></select></div>
                <div class="form-group"><label>Severity</label><select class="form-input" id="siSeverity"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                <div class="form-group"><label>Project / Location</label><select class="form-input" id="siProject"><option value="">General Site</option>${projects.map(p=>`<option value="${Utils.escapeHtml(p.name)}">${Utils.escapeHtml(p.name)}</option>`).join('')}</select></div>
            </div>
            <div class="form-group"><label>Persons Involved</label><input type="text" class="form-input" id="siPersons" placeholder="e.g. Juan Dela Cruz, worker"></div>
            <div class="form-group"><label>Description</label><textarea class="form-input" id="siDesc" rows="3" required></textarea></div>
            <div class="form-group"><label>Immediate Action Taken</label><textarea class="form-input" id="siAction" rows="2"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-danger" onclick="Construction.saveIncident()">Report Incident</button>`
        );
    },

    saveIncident() {
        const desc = document.getElementById('siDesc')?.value?.trim();
        if (!desc) { App.showToast('Description is required', 'error'); return; }
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        DataStore.safetyRecords.push({
            id: Utils.generateId('SAF'),
            company, recordType: 'incident',
            date: document.getElementById('siDate')?.value || new Date().toISOString().split('T')[0],
            incidentType: document.getElementById('siType')?.value || 'Other',
            severity: document.getElementById('siSeverity')?.value || 'low',
            project: document.getElementById('siProject')?.value || '',
            personsInvolved: document.getElementById('siPersons')?.value?.trim() || '',
            description: desc,
            actionTaken: document.getElementById('siAction')?.value?.trim() || '',
            status: 'open', createdAt: new Date().toISOString()
        });
        Database.save(); App.closeModal(); App.showToast('Incident reported');
        this.renderSafety(document.getElementById('mainContent'));
    },

    addInspection() {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const projects = DataStore.projects.filter(p => p.company === company);
        App.showModal('Schedule Safety Inspection', `
            <div class="grid-2">
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="inDate" value="${new Date().toISOString().split('T')[0]}"></div>
                <div class="form-group"><label>Inspection Type</label><select class="form-input" id="inType"><option>General Safety Audit</option><option>Fire Safety</option><option>Electrical Safety</option><option>PPE Compliance</option><option>Scaffolding Inspection</option><option>Equipment Safety</option><option>Environmental</option></select></div>
                <div class="form-group"><label>Area / Project</label><select class="form-input" id="inArea"><option value="General Site">General Site</option>${projects.map(p=>`<option value="${Utils.escapeHtml(p.name)}">${Utils.escapeHtml(p.name)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Inspector</label><input type="text" class="form-input" id="inInspector"></div>
                <div class="form-group"><label>Outcome</label><select class="form-input" id="inStatus"><option value="passed">Passed</option><option value="failed">Failed</option><option value="pending">Pending</option></select></div>
            </div>
            <div class="form-group"><label>Findings / Notes</label><textarea class="form-input" id="inFindings" rows="3"></textarea></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Construction.saveInspection()">Save Inspection</button>`
        );
    },

    saveInspection() {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        DataStore.safetyRecords.push({
            id: Utils.generateId('INS'),
            company, recordType: 'inspection',
            date: document.getElementById('inDate')?.value || new Date().toISOString().split('T')[0],
            inspectionType: document.getElementById('inType')?.value || 'General Safety Audit',
            area: document.getElementById('inArea')?.value || 'General Site',
            inspector: document.getElementById('inInspector')?.value?.trim() || '',
            findings: document.getElementById('inFindings')?.value?.trim() || '',
            status: document.getElementById('inStatus')?.value || 'pending',
            createdAt: new Date().toISOString()
        });
        Database.save(); App.closeModal(); App.showToast('Inspection recorded');
        this.renderSafety(document.getElementById('mainContent'));
    },

    closeSafetyRecord(id) {
        const rec = (DataStore.safetyRecords || []).find(r => r.id === id);
        if (!rec) return;
        rec.status = 'closed';
        Database.save(); App.showToast('Record closed');
        this.renderSafety(document.getElementById('mainContent'));
    },

    deleteSafetyRecord(id) {
        if (!confirm('Delete this safety record?')) return;
        DataStore.safetyRecords = (DataStore.safetyRecords || []).filter(r => r.id !== id);
        Database.save(); App.showToast('Record deleted');
        this.renderSafety(document.getElementById('mainContent'));
    },

    renderDocuments(container) {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const docs = (DataStore.documents || []).filter(d => d.company === company);
        const projects = DataStore.projects.filter(p => p.company === company);
        container.innerHTML = `
        <div class="section-header"><div><h2>Documents</h2><p>Construction document management</p></div><button class="btn btn-primary" onclick="Construction.addDocument()"><i class="fas fa-upload"></i> Add Document</button></div>
        <div class="card"><div class="card-header"><h3>Document Repository</h3></div><div class="card-body no-padding">
            ${docs.length === 0 ? '<div class="empty-state"><i class="fas fa-folder-open"></i><h3>No Documents Yet</h3><p>Add and manage construction documents, permits, and contracts.</p></div>' :
            Utils.buildTable([
                { label: 'Document Name', render: r => `<strong>${Utils.escapeHtml(r.name)}</strong>` },
                { label: 'Type', render: r => Utils.escapeHtml(r.type||'-') },
                { label: 'Project', render: r => Utils.escapeHtml(r.project||'General') },
                { label: 'Date', render: r => Utils.formatDate(r.date) },
                { label: 'Notes', render: r => Utils.escapeHtml(r.notes||'-') },
                { label: 'Actions', render: r => `<button class="btn btn-sm btn-danger" onclick="Construction.deleteDocument('${r.id}')"><i class="fas fa-trash"></i></button>` }
            ], docs)}
        </div></div>`;
    },

    addDocument() {
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const projects = DataStore.projects.filter(p => p.company === company);
        App.showModal('Add Document', `
            <form id="docForm">
                <div class="grid-2">
                    <div class="form-group"><label>Document Name</label><input type="text" class="form-input" id="docName" required></div>
                    <div class="form-group"><label>Document Type</label><select class="form-input" id="docType"><option>Contract</option><option>Permit</option><option>Blueprint / Plan</option><option>Report</option><option>Invoice</option><option>Certificate</option><option>Inspection Report</option><option>Other</option></select></div>
                    <div class="form-group"><label>Project</label><select class="form-input" id="docProject"><option value="">General</option>${projects.map(p=>`<option value="${Utils.escapeHtml(p.name)}">${Utils.escapeHtml(p.name)}</option>`).join('')}</select></div>
                    <div class="form-group"><label>Date</label><input type="date" class="form-input" id="docDate" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
                <div class="form-group"><label>Notes</label><textarea class="form-input" id="docNotes" rows="2"></textarea></div>
            </form>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Construction.saveDocument()">Save Document</button>`
        );
    },

    saveDocument() {
        const name = document.getElementById('docName')?.value?.trim();
        if (!name) { App.showToast('Document name is required', 'error'); return; }
        const company = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        if (!DataStore.documents) DataStore.documents = [];
        DataStore.documents.push({
            id: Utils.generateId('DOC'),
            company,
            name,
            type: document.getElementById('docType')?.value || 'Other',
            project: document.getElementById('docProject')?.value || '',
            date: document.getElementById('docDate')?.value || new Date().toISOString().split('T')[0],
            notes: document.getElementById('docNotes')?.value?.trim() || '',
            createdAt: new Date().toISOString()
        });
        Database.save();
        App.closeModal();
        App.showToast('Document added successfully');
        this.renderDocuments(document.getElementById('mainContent'));
    },

    deleteDocument(id) {
        if (!confirm('Delete this document?')) return;
        DataStore.documents = (DataStore.documents || []).filter(d => d.id !== id);
        Database.save();
        App.showToast('Document removed');
        this.renderDocuments(document.getElementById('mainContent'));
    },

    renderCredit(container) {
        const coId = App.activeCompany === 'all' ? 'sjc' : App.activeCompany;
        const invoices = DataStore.invoices.filter(i => (i.companyId || i.company) === coId);
        const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
        const overdue = unpaid.filter(i => i.dueDate && new Date(i.dueDate) < new Date());
        const totalReceivables = unpaid.reduce((s, i) => s + (i.amount || i.total || 0), 0);
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Credit &amp; Collection</h2><p>Track receivables and collections</p></div>
            <button class="btn btn-primary" onclick="App.navigate('invoicing')"><i class="fas fa-plus"></i> New Invoice</button>
        </div>
        <div class="grid-3 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-hand-holding-usd"></i></div></div><div class="stat-value">${Utils.formatCurrency(totalReceivables)}</div><div class="stat-label">Total Receivables</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon red"><i class="fas fa-exclamation-circle"></i></div></div><div class="stat-value">${overdue.length}</div><div class="stat-label">Overdue Invoices</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check"></i></div></div><div class="stat-value">${invoices.filter(i=>i.status==='paid').length}</div><div class="stat-label">Collected</div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Outstanding Invoices</h3></div><div class="card-body no-padding">
            ${unpaid.length === 0 ? '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>All Collected</h3><p>No outstanding invoices.</p></div>' :
            Utils.buildTable([
                { label: 'Invoice #', render: r => `<strong>${Utils.escapeHtml(r.invoiceNumber || r.id)}</strong>` },
                { label: 'Client', render: r => Utils.escapeHtml(r.client || r.clientName || '-') },
                { label: 'Amount', render: r => Utils.formatCurrency(r.amount || r.total || 0) },
                { label: 'Due Date', render: r => r.dueDate ? Utils.formatDate(r.dueDate) : '-' },
                { label: 'Status', render: r => {
                    const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
                    const label = isOverdue ? 'Overdue' : (r.status === 'partial' ? 'Partial' : 'Pending');
                    const cls = isOverdue ? 'badge-danger' : (r.status === 'partial' ? 'badge-warning' : 'badge-neutral');
                    return `<span class="badge-tag ${cls}">${label}</span>`;
                }},
                { label: 'Actions', render: r => `<button class="btn btn-sm btn-success" onclick="Construction.markInvoicePaid('${r.id}')"><i class="fas fa-check"></i> Mark Paid</button>` }
            ], unpaid)}
        </div></div>`;
    },

    markInvoicePaid(id) {
        const inv = DataStore.invoices.find(i => i.id === id);
        if (!inv) return;
        if (!confirm(`Mark invoice ${inv.invoiceNumber || inv.id} as Paid?`)) return;
        inv.status = 'paid';
        inv.paidAt = new Date().toISOString();
        Database.save();
        App.showToast('Invoice marked as paid');
        this.renderCredit(document.getElementById('mainContent'));
    }
};

