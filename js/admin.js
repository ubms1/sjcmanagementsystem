/* ========================================
   SJC UBMS - Admin Module
   User management, audit logs, system administration
   ======================================== */

const Admin = {

    // ============================================================
    //  MODULE MASTER LIST  — keyed by business / category group
    // ============================================================
    MODULE_GROUPS: [
        {
            id: 'core', label: 'Core Modules', icon: 'fa-th-large', color: '#1565c0',
            modules: [
                { id: 'dashboard',         label: 'Dashboard' },
                { id: 'crm',               label: 'CRM' },
                { id: 'financial',         label: 'Financial' },
                { id: 'reports',           label: 'Reports' },
                { id: 'financial-analysis',label: 'Financial Analysis' }
            ]
        },
        {
            id: 'construction', label: 'SJC Construction', icon: 'fa-hard-hat', color: '#1565c0',
            modules: [
                { id: 'projects',          label: 'Projects' },
                { id: 'project-monitoring',label: 'Project Monitoring' },
                { id: 'job-costing',       label: 'Job Costing' },
                { id: 'subcontractors',    label: 'Subcontractors' },
                { id: 'equipment',         label: 'Equipment & Fleet' },
                { id: 'safety',            label: 'Safety / QHSE' },
                { id: 'documents',         label: 'Documents' },
                { id: 'credit-collection', label: 'Credit & Collection' }
            ]
        },
        {
            id: 'subdivision', label: 'Erlandia Homes (Subdivision)', icon: 'fa-home', color: '#2e7d32',
            modules: [
                { id: 'lots',              label: 'Lot Management' },
                { id: 'homeowners',        label: 'Homeowners' },
                { id: 'lot-payments',      label: 'Lot Payments' },
                { id: 'amenities',         label: 'Amenities' }
            ]
        },
        {
            id: 'commercial', label: "Nancy's Square (Commercial)", icon: 'fa-store', color: '#6a1b9a',
            modules: [
                { id: 'spaces',            label: 'Spaces' },
                { id: 'tenants',           label: 'Tenants' },
                { id: 'leases',            label: 'Leases' },
                { id: 'rental-payments',   label: 'Rental Payments' }
            ]
        },
        {
            id: 'quarry', label: 'Crushing Plant (Quarry)', icon: 'fa-mountain', color: '#e65100',
            modules: [
                { id: 'quarry-products',   label: 'Products' },
                { id: 'quarry-orders',     label: 'Orders' },
                { id: 'quarry-deliveries', label: 'Deliveries' },
                { id: 'quarry-production', label: 'Production' }
            ]
        },
        {
            id: 'driving_school', label: 'Mileage Driving School', icon: 'fa-car-side', color: '#00838f',
            modules: [
                { id: 'courses',           label: 'Courses' },
                { id: 'students',          label: 'Students' },
                { id: 'enrollments',       label: 'Enrollments' },
                { id: 'instructors',       label: 'Instructors' },
                { id: 'vehicles',          label: 'Vehicles' },
                { id: 'schedules',         label: 'Schedules' },
                { id: 'certificates',      label: 'Certificates' }
            ]
        },
        {
            id: 'testing_lab', label: 'Megatesting Center (Lab)', icon: 'fa-flask', color: '#c62828',
            modules: [
                { id: 'test-services',     label: 'Test Services' },
                { id: 'test-orders',       label: 'Test Orders' },
                { id: 'test-samples',      label: 'Samples' },
                { id: 'test-results',      label: 'Results' },
                { id: 'lab-equipment',     label: 'Lab Equipment' },
                { id: 'quality-reviews',   label: 'Quality Reviews' }
            ]
        },
        {
            id: 'operations', label: 'Operations', icon: 'fa-cogs', color: '#37474f',
            modules: [
                { id: 'invoicing',         label: 'Invoicing' },
                { id: 'payroll',           label: 'Payroll' },
                { id: 'inventory',         label: 'Inventory' },
                { id: 'pos',               label: 'Point of Sale' },
                { id: 'iso',               label: 'ISO Management' }
            ]
        },
        {
            id: 'management', label: 'Management', icon: 'fa-user-shield', color: '#424242',
            modules: [
                { id: 'admin',             label: 'Admin Panel' },
                { id: 'settings',          label: 'Settings' }
            ]
        }
    ],

    render(container) {
        if (!Auth.isSuperAdmin() && !Auth.isOwner()) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>Access Denied</h3><p>Admin access required.</p></div>';
            return;
        }
        const users = DataStore.users || [];
        const logs = DataStore.auditLog || [];
        container.innerHTML = `
        <div class="section-header"><div><h2>Administration</h2><p>User management, audit logs, and system admin</p></div></div>

        <div class="tabs mb-3">
            <button class="tab-btn active" onclick="Admin.switchTab(this,'usersTab')">Users</button>
            <button class="tab-btn" onclick="Admin.switchTab(this,'modulePermTab')"><i class="fas fa-shield-alt"></i> Module Permissions</button>
            <button class="tab-btn" onclick="Admin.switchTab(this,'dataTab')"><i class="fas fa-database"></i> Data Manager</button>
            <button class="tab-btn" onclick="Admin.switchTab(this,'auditTab')">Audit Log</button>
            <button class="tab-btn" onclick="Admin.switchTab(this,'systemTab')">System Info</button>
        </div>

        <div id="usersTab">
            <div class="section-header mb-2"><div><p>${users.length} users</p></div><button class="btn btn-primary" onclick="Admin.addUser()"><i class="fas fa-plus"></i> Add User</button></div>
            <div class="card"><div class="card-body no-padding">
                ${Utils.buildTable([
                    { label: 'Username', render: r => `<strong>${Utils.escapeHtml(r.username)}</strong>` },
                    { label: 'Full Name', render: r => Utils.escapeHtml(r.fullName || r.name || '-') },
                    { label: 'Role', render: r => `<span class="badge-tag badge-primary">${r.role}</span>` },
                    { label: 'Companies', render: r => (r.companies||[]).includes('all') ? '<span class="badge-tag badge-teal">All</span>' : (r.companies||[]).map(c=>`<span class="badge-tag badge-neutral">${c}</span>`).join('') },
                    { label: 'Modules', render: r => {
                        if (r.role === 'superadmin' || r.role === 'owner') return '<span class="badge-tag badge-teal">All</span>';
                        const mods = r.modules || [];
                        if (mods.includes('all')) return '<span class="badge-tag badge-teal">All</span>';
                        return `<span class="badge-tag badge-neutral">${mods.length} module${mods.length!==1?'s':''}</span>`;
                    }},
                    { label: 'Status', render: r => `<span class="badge-tag ${r.status==='active'?'badge-success':'badge-warning'}">${r.status||'active'}</span>` },
                    { label: 'Actions', render: r => r.role !== 'superadmin' ? `
                        <button class="btn btn-sm" title="Edit user" onclick="Admin.editUser('${r.username}')"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm" title="Manage modules" onclick="Admin.openModulePermissions('${r.username}')"><i class="fas fa-shield-alt"></i></button>
                        <button class="btn btn-sm" title="Toggle status" onclick="Admin.toggleUser('${r.username}')"><i class="fas fa-power-off"></i></button>` : '<span class="text-xxs text-muted">Protected</span>' }
                ], users)}
            </div></div>
        </div>

        <div id="modulePermTab" class="hidden">
            <div class="card mb-3">
                <div class="card-body">
                    <div class="flex-between">
                        <div>
                            <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">Module Permissions</h3>
                            <p style="font-size:12px;color:var(--text-secondary)">Assign which modules each manager or staff can access. SuperAdmin and Owner always have full access.</p>
                        </div>
                    </div>
                    <div class="form-group mt-2" style="max-width:400px">
                        <label>Select User</label>
                        <select class="form-input" id="mpUserSelect" onchange="Admin.loadUserModuleForm(this.value)">
                            <option value="">-- Choose a user --</option>
                            ${users.filter(u => u.role !== 'superadmin' && u.role !== 'owner').map(u =>
                                `<option value="${Utils.escapeHtml(u.username)}">${Utils.escapeHtml(u.fullName || u.name || u.username)} (${u.role})</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>
            <div id="mpFormArea"></div>
        </div>

        <div id="dataTab" class="hidden">${Admin._renderDataManagerHTML()}</div>

        <div id="auditTab" class="hidden">
            <div class="card"><div class="card-body no-padding">                ${logs.length === 0 ? '<div class="empty-state"><i class="fas fa-history"></i><h3>No Audit Logs</h3></div>' :
                Utils.buildTable([
                    { label: 'Timestamp', render: r => Utils.formatDate(r.timestamp) + ' ' + new Date(r.timestamp).toLocaleTimeString() },
                    { label: 'User', render: r => `<strong>${Utils.escapeHtml(r.user || '-')}</strong>` },
                    { label: 'Action', render: r => `<span class="badge-tag badge-neutral">${r.action||'-'}</span>` },
                    { label: 'Details', render: r => Utils.escapeHtml((r.details||'').substring(0,80)) },
                    { label: 'IP/Source', render: r => r.source || '-' }
                ], logs.slice().reverse().slice(0, 100))}
            </div></div>
        </div>

        <div id="systemTab" class="hidden">
            <div class="grid-2">
                <div class="card"><div class="card-body">
                    <h3 class="section-heading"><i class="fas fa-info-circle"></i> System Information</h3>
                    <div class="info-list">
                        <div><strong>System:</strong> SJC Unified Business Management System</div>
                        <div><strong>Version:</strong> 1.0.0</div>
                        <div><strong>Companies:</strong> ${Object.keys(DataStore.companies).length}</div>
                        <div><strong>Users:</strong> ${users.length}</div>
                        <div><strong>Storage:</strong> ${(JSON.stringify(localStorage.getItem('sjc_ubms_database')||'').length/1024).toFixed(1)} KB</div>
                        <div><strong>Browser:</strong> ${navigator.userAgent.split(') ').pop()}</div>
                    </div>
                </div></div>
                <div class="card"><div class="card-body">
                    <h3 class="section-heading"><i class="fas fa-chart-bar"></i> Data Summary</h3>
                    <div class="info-list">
                        <div><strong>Projects:</strong> ${(DataStore.projects||[]).length}</div>
                        <div><strong>Invoices:</strong> ${(DataStore.invoices||[]).length}</div>
                        <div><strong>Expenses:</strong> ${(DataStore.expenses||[]).length}</div>
                        <div><strong>Employees:</strong> ${(DataStore.employees||[]).length}</div>
                        <div><strong>Customers:</strong> ${(DataStore.customers||[]).length}</div>
                        <div><strong>Inventory Items:</strong> ${(DataStore.inventoryItems||[]).length}</div>
                        <div><strong>Audit Entries:</strong> ${logs.length}</div>
                    </div>
                </div></div>
            </div>
        </div>`;
    },

    switchTab(btn, tabId) {
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['usersTab','modulePermTab','dataTab','auditTab','systemTab'].forEach(t => { const el = document.getElementById(t); if (el) el.classList.toggle('hidden', t !== tabId); });
    },

    // ── Open Module Permissions tab and pre-select a user ──────────
    openModulePermissions(username) {
        const tabBtn = document.querySelector('.tab-btn[onclick*="modulePermTab"]');
        if (tabBtn) tabBtn.click();
        setTimeout(() => {
            const sel = document.getElementById('mpUserSelect');
            if (sel) { sel.value = username; this.loadUserModuleForm(username); }
        }, 50);
    },

    // ── Render the checkbox form for a selected user ───────────────
    loadUserModuleForm(username) {
        const area = document.getElementById('mpFormArea');
        if (!area) return;
        if (!username) { area.innerHTML = ''; return; }
        const user = DataStore.users.find(u => u.username === username);
        if (!user) return;
        const userMods = user.modules || [];
        const allGranted = userMods.includes('all');

        const groupCards = this.MODULE_GROUPS.map(group => {
            const groupAllChecked = allGranted || group.modules.every(m => userMods.includes(m.id));
            const checkboxes = group.modules.map(m => {
                const checked = allGranted || userMods.includes(m.id);
                return `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer">
                    <input type="checkbox" class="mp-mod mp-group-${group.id}" value="${m.id}" ${checked?'checked':''}>
                    ${Utils.escapeHtml(m.label)}
                </label>`;
            }).join('');
            return `
            <div class="card">
                <div class="card-body" style="padding:14px">
                    <div class="flex-between mb-2">
                        <span style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px">
                            <i class="fas ${group.icon}" style="color:${group.color};width:16px"></i>
                            ${Utils.escapeHtml(group.label)}
                        </span>
                        <label style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--text-secondary);cursor:pointer">
                            <input type="checkbox" class="mp-group-toggle" data-group="${group.id}" ${groupAllChecked?'checked':''}>
                            All
                        </label>
                    </div>
                    <div style="border-top:1px solid var(--border);padding-top:10px">${checkboxes}</div>
                </div>
            </div>`;
        }).join('');

        area.innerHTML = `
        <div class="card mb-2" style="border:2px solid var(--secondary)">
            <div class="card-body" style="padding:14px">
                <div class="flex-between">
                    <div>
                        <span style="font-size:14px;font-weight:700">
                            <i class="fas fa-user" style="margin-right:6px;color:var(--secondary)"></i>
                            ${Utils.escapeHtml(user.fullName || user.name || user.username)}
                        </span>
                        <span class="badge-tag badge-primary" style="margin-left:8px">${user.role}</span>
                    </div>
                    <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;cursor:pointer">
                        <input type="checkbox" id="mpGrantAll" ${allGranted?'checked':''} style="width:16px;height:16px">
                        Grant All Module Access
                    </label>
                </div>
            </div>
        </div>
        <div class="grid-3 mb-3" id="mpGroupGrid">${groupCards}</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding-bottom:8px">
            <button class="btn btn-secondary" onclick="document.getElementById('mpUserSelect').value='';document.getElementById('mpFormArea').innerHTML=''">Clear</button>
            <button class="btn btn-primary" onclick="Admin.saveModulePermissions('${Utils.escapeHtml(username)}')">
                <i class="fas fa-save"></i> Save Permissions
            </button>
        </div>`;

        // Wire up the "Grant All" master checkbox
        document.getElementById('mpGrantAll').addEventListener('change', e => {
            const on = e.target.checked;
            document.querySelectorAll('.mp-mod,.mp-group-toggle').forEach(cb => cb.checked = on);
        });

        // Wire up group-level toggles
        document.querySelectorAll('.mp-group-toggle').forEach(toggle => {
            toggle.addEventListener('change', e => {
                const groupId = e.target.dataset.group;
                const on = e.target.checked;
                document.querySelectorAll(`.mp-group-${groupId}`).forEach(cb => cb.checked = on);
                this._syncGrantAll();
            });
        });

        // Wire up individual checkboxes to sync group & grant-all
        document.querySelectorAll('.mp-mod').forEach(cb => {
            cb.addEventListener('change', () => this._syncGroupToggles());
        });
    },

    _syncGroupToggles() {
        this.MODULE_GROUPS.forEach(group => {
            const allChecked = group.modules.every(m => {
                const cb = document.querySelector(`.mp-group-${group.id}[value="${m.id}"]`);
                return cb ? cb.checked : false;
            });
            const toggle = document.querySelector(`.mp-group-toggle[data-group="${group.id}"]`);
            if (toggle) toggle.checked = allChecked;
        });
        this._syncGrantAll();
    },

    _syncGrantAll() {
        const allChecked = [...document.querySelectorAll('.mp-mod')].every(cb => cb.checked);
        const ga = document.getElementById('mpGrantAll');
        if (ga) ga.checked = allChecked;
    },

    // ── Save module permissions for a user ─────────────────────────
    saveModulePermissions(username) {
        const user = DataStore.users.find(u => u.username === username);
        if (!user) return;
        const grantAll = document.getElementById('mpGrantAll')?.checked;
        if (grantAll) {
            user.modules = ['all'];
        } else {
            user.modules = [...document.querySelectorAll('.mp-mod:checked')].map(cb => cb.value);
        }
        Database.save();
        // If this is the currently logged-in user, update the live session
        if (Auth.session && Auth.session.username === username) {
            Auth.session.modules = user.modules;
            localStorage.setItem('sjc_ubms_session', JSON.stringify(Auth.session));
            App.updateNavVisibility();
        }
        Database.addAuditEntry('Module Permissions Updated', `${Auth.getName()} updated modules for ${username}`, 'warning');
        App.showToast(`Module permissions saved for ${Utils.escapeHtml(user.fullName || user.name || username)}`);
        // Re-render admin panel then re-open the module permissions tab
        this.render(document.getElementById('mainContent'));
        this.openModulePermissions(username);
    },

    addUser() {
        App.showModal('Add User', `
            <div class="grid-2">
                <div class="form-group"><label>Username</label><input type="text" class="form-input" id="auUsername" required></div>
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="auFullName"></div>
                <div class="form-group"><label>Password</label><input type="password" class="form-input" id="auPassword" required></div>
                <div class="form-group"><label>Role</label><select class="form-input" id="auRole"><option value="staff">Staff</option><option value="manager">Manager</option><option value="owner">Owner</option></select></div>
            </div>
            <div class="form-group"><label>Company Access</label>
                <div class="checkbox-list">
                    ${Object.values(DataStore.companies).map(c => `<label><input type="checkbox" class="au-company" value="${c.id}"> ${Utils.escapeHtml(c.name)}</label>`).join('')}
                </div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Admin.saveUser()">Create User</button>`
        );
    },

    async saveUser() {
        const username = document.getElementById('auUsername')?.value?.trim();
        const password = document.getElementById('auPassword')?.value;
        if (!username || !password) { App.showToast('Username and password required', 'error'); return; }
        if (password.length < 6) { App.showToast('Password must be at least 6 characters', 'error'); return; }
        if (DataStore.users.find(u => u.username === username)) { App.showToast('Username already exists', 'error'); return; }
        const companies = [...document.querySelectorAll('.au-company:checked')].map(cb => cb.value);
        const role = document.getElementById('auRole')?.value || 'staff';
        const newUser = {
            id: 'USR-' + Date.now(),
            username,
            name: document.getElementById('auFullName')?.value?.trim() || username,
            fullName: document.getElementById('auFullName')?.value?.trim() || '',
            role,
            company: companies[0] || 'all',
            companies: companies.length > 0 ? companies : Object.keys(DataStore.companies),
            modules: (role === 'owner') ? ['all'] : [],
            isSuperAdmin: false, avatar: username.slice(0,2).toUpperCase(), status: 'active'
        };
        await Database.addUser({ ...newUser, password }); // Database.addUser hashes the password
        App.closeModal(); App.showToast('User created');
        this.render(document.getElementById('mainContent'));
    },

    editUser(username) {
        const user = DataStore.users.find(u => u.username === username);
        if (!user) return;
        App.showModal('Edit User', `
            <div class="grid-2">
                <div class="form-group"><label>Username</label><input type="text" class="form-input" value="${Utils.escapeHtml(user.username)}" disabled></div>
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="euFullName" value="${Utils.escapeHtml(user.fullName||'')}"></div>
                <div class="form-group"><label>Role</label><select class="form-input" id="euRole"><option value="staff" ${user.role==='staff'?'selected':''}>Staff</option><option value="manager" ${user.role==='manager'?'selected':''}>Manager</option><option value="owner" ${user.role==='owner'?'selected':''}>Owner</option></select></div>
                <div class="form-group"><label>New Password (leave blank to keep)</label><input type="password" class="form-input" id="euPassword"></div>
            </div>
            <div class="form-group"><label>Company Access</label>
                <div class="checkbox-list">
                    ${Object.values(DataStore.companies).map(c => `<label><input type="checkbox" class="eu-company" value="${c.id}" ${(user.companies||[]).includes(c.id)?'checked':''}> ${Utils.escapeHtml(c.name)}</label>`).join('')}
                </div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Admin.updateUser('${username}')">Update</button>`
        );
    },

    async updateUser(username) {
        const user = DataStore.users.find(u => u.username === username);
        if (!user) return;
        const newPw = document.getElementById('euPassword')?.value;
        const updates = {
            fullName: document.getElementById('euFullName')?.value?.trim() || '',
            role: document.getElementById('euRole')?.value || user.role,
            companies: [...document.querySelectorAll('.eu-company:checked')].map(cb => cb.value)
        };
        if (updates.companies.length === 0) updates.companies = Object.keys(DataStore.companies);
        if (newPw && newPw.length >= 6) updates.password = newPw; // Database.updateUser will hash it
        await Database.updateUser(user.id, updates);
        Database.save(); App.closeModal(); App.showToast('User updated');
        this.render(document.getElementById('mainContent'));
    },

    toggleUser(username) {
        const user = DataStore.users.find(u => u.username === username);
        if (!user) return;
        user.status = user.status === 'active' ? 'inactive' : 'active';
        Database.save(); App.showToast(`User ${user.status === 'active' ? 'activated' : 'deactivated'}`);
        this.render(document.getElementById('mainContent'));
    },

    // ============================================================
    //  DATA MANAGER  (SuperAdmin only)
    // ============================================================

    // Data entity definitions — label, DataStore key, icon
    DATA_ENTITIES: [
        { key: 'customers',         label: 'Customers',            icon: 'fa-users',           color: '#1565c0' },
        { key: 'employees',         label: 'Employees',            icon: 'fa-id-badge',        color: '#2e7d32' },
        { key: 'invoices',          label: 'Invoices',             icon: 'fa-file-invoice',    color: '#6a1b9a' },
        { key: 'expenses',          label: 'Expenses',             icon: 'fa-receipt',         color: '#e65100' },
        { key: 'payslips',          label: 'Payslips',             icon: 'fa-file-invoice-dollar', color: '#00838f' },
        { key: 'projects',          label: 'Projects',             icon: 'fa-hard-hat',        color: '#1565c0' },
        { key: 'inventoryItems',    label: 'Inventory Items',      icon: 'fa-boxes',           color: '#37474f' },
        { key: 'inventoryTransactions', label: 'Inventory Txns',  icon: 'fa-exchange-alt',    color: '#37474f' },
        { key: 'lots',              label: 'Lots',                 icon: 'fa-map',             color: '#2e7d32' },
        { key: 'homeowners',        label: 'Homeowners',           icon: 'fa-home',            color: '#2e7d32' },
        { key: 'lotPayments',       label: 'Lot Payments',         icon: 'fa-money-bill',      color: '#2e7d32' },
        { key: 'spaces',            label: 'Rental Spaces',        icon: 'fa-store',           color: '#6a1b9a' },
        { key: 'tenants',           label: 'Tenants',              icon: 'fa-user-tie',        color: '#6a1b9a' },
        { key: 'leases',            label: 'Leases',               icon: 'fa-file-contract',   color: '#6a1b9a' },
        { key: 'rentalPayments',    label: 'Rental Payments',      icon: 'fa-money-check',     color: '#6a1b9a' },
        { key: 'quarryProducts',    label: 'Quarry Products',      icon: 'fa-mountain',        color: '#e65100' },
        { key: 'quarryOrders',      label: 'Quarry Orders',        icon: 'fa-truck',           color: '#e65100' },
        { key: 'students',          label: 'Students',             icon: 'fa-graduation-cap',  color: '#00838f' },
        { key: 'enrollments',       label: 'Enrollments',          icon: 'fa-clipboard-list',  color: '#00838f' },
        { key: 'courses',           label: 'Courses',              icon: 'fa-book',            color: '#00838f' },
        { key: 'testOrders',        label: 'Lab Test Orders',      icon: 'fa-flask',           color: '#c62828' },
        { key: 'testResults',       label: 'Lab Test Results',     icon: 'fa-vial',            color: '#c62828' },
        { key: 'attendanceRecords', label: 'Attendance Records',   icon: 'fa-calendar-check',  color: '#2e7d32' },
        { key: 'performanceReviews',label: 'Performance Reviews',  icon: 'fa-star',            color: '#2e7d32' },
        { key: 'incidentReports',   label: 'Incident Reports',     icon: 'fa-exclamation-triangle', color: '#c62828' },
        { key: 'workSchedules',     label: 'Work Schedules',       icon: 'fa-calendar-alt',   color: '#2e7d32' },
        { key: 'timesheets',        label: 'Timesheets',           icon: 'fa-clock',           color: '#2e7d32' },
        { key: 'auditLog',          label: 'Audit Log',            icon: 'fa-history',         color: '#424242' },
    ],

    _renderDataManagerHTML() {
        if (!Auth.isSuperAdmin()) return '<div class="empty-state"><i class="fas fa-lock"></i><h3>SuperAdmin only</h3></div>';
        const cards = this.DATA_ENTITIES.map(e => {
            const count = (DataStore[e.key] || []).length;
            return `
            <div class="card">
                <div class="card-body" style="padding:14px">
                    <div class="flex-between mb-2">
                        <span style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px">
                            <i class="fas ${e.icon}" style="color:${e.color}"></i>
                            ${Utils.escapeHtml(e.label)}
                        </span>
                        <span class="badge-tag badge-neutral">${count}</span>
                    </div>
                    <div class="btn-group" style="flex-wrap:wrap;gap:4px">
                        <button class="btn btn-sm btn-secondary" onclick="Admin.viewEntityData('${e.key}','${e.label}')"><i class="fas fa-eye"></i> View</button>
                        <button class="btn btn-sm btn-danger" onclick="Admin.clearEntityData('${e.key}','${e.label}')"><i class="fas fa-trash"></i> Clear</button>
                    </div>
                </div>
            </div>`;
        }).join('');

        return `
            <div class="card mb-3" style="border:2px solid var(--danger)">
                <div class="card-body">
                    <div class="flex-between">
                        <div>
                            <h3 style="color:var(--danger);margin:0"><i class="fas fa-exclamation-triangle"></i> Danger Zone</h3>
                            <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0">These actions affect the entire database. Proceed with caution.</p>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-secondary" onclick="Admin.exportJSON()"><i class="fas fa-download"></i> Export JSON Backup</button>
                            <button class="btn btn-sm btn-secondary" onclick="Admin.importJSON()"><i class="fas fa-upload"></i> Import JSON</button>
                            <button class="btn btn-sm btn-secondary" onclick="Admin.bulkDeleteByCompany()"><i class="fas fa-building"></i> Bulk Delete by Company</button>
                            <button class="btn btn-sm btn-danger" onclick="Admin.clearAllTransactional()"><i class="fas fa-bomb"></i> Clear All Transactional Data</button>
                            <button class="btn btn-sm btn-danger" onclick="Admin.factoryReset()"><i class="fas fa-skull-crossbones"></i> Factory Reset</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid-4">${cards}</div>`;
    },

    viewEntityData(key, label) {
        const data = DataStore[key];
        if (!data || data.length === 0) { App.showToast(`No ${label} data.`, 'info'); return; }
        const sample = data[0];
        const columns = Object.keys(sample).slice(0, 7).map(k => ({
            label: k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
            render: r => Utils.escapeHtml(String(r[k] || '').substring(0, 50))
        }));
        App.showModal(`${label} Data (${data.length} records)`,
            `<div style="max-height:60vh;overflow:auto">${Utils.buildTable(columns, data.slice(0, 200))}</div>
             ${data.length > 200 ? `<p class="text-muted text-center">Showing first 200 of ${data.length} records.</p>` : ''}`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>`
        );
    },

    clearEntityData(key, label) {
        if (!confirm(`Delete ALL ${label} records? This cannot be undone.`)) return;
        DataStore[key] = [];
        Database.save();
        Database.addAuditEntry('Data Cleared', `${Auth.getName()} cleared all ${label} records`, 'danger');
        App.showToast(`All ${label} records deleted.`, 'success');
        this.render(document.getElementById('mainContent'));
        // Re-open data tab
        setTimeout(() => { const dataBtn = document.querySelector('.tab-btn[onclick*="dataTab"]'); if (dataBtn) dataBtn.click(); }, 50);
    },

    clearAllTransactional() {
        if (!Auth.isSuperAdmin()) { App.showToast('SuperAdmin access required.', 'error'); return; }
        if (!confirm('This will delete ALL transactional data (invoices, expenses, payslips, payroll, orders, etc.) but keep master data (users, companies, employees, courses, etc.). Continue?')) return;
        Database.clearTransactionalData();
        Database.addAuditEntry('Transactional Data Cleared', `${Auth.getName()} cleared all transactional data`, 'danger');
        App.showToast('All transactional data cleared.', 'success');
        this.render(document.getElementById('mainContent'));
    },

    factoryReset() {
        if (!Auth.isSuperAdmin()) { App.showToast('SuperAdmin access required.', 'error'); return; }
        const code = prompt('Factory reset will delete ALL data including users. Type "RESET" to confirm:');
        if (code !== 'RESET') { App.showToast('Reset cancelled.', 'info'); return; }
        localStorage.removeItem('sjc_ubms_database');
        localStorage.removeItem('sjc_ubms_session');
        App.showToast('Factory reset complete. Reloading...', 'success');
        setTimeout(() => location.reload(), 1500);
    },

    exportJSON() {
        const data = localStorage.getItem('sjc_ubms_database') || '{}';
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sjc_ubms_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Database.addAuditEntry('Data Exported', `${Auth.getName()} exported JSON backup`, 'info');
        App.showToast('Backup downloaded.', 'success');
    },

    importJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => {
                try {
                    const parsed = JSON.parse(evt.target.result);
                    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid format');
                    if (!confirm(`Import this backup? Current data will be replaced. File: ${file.name}`)) return;
                    localStorage.setItem('sjc_ubms_database', JSON.stringify(parsed));
                    Database.load();
                    App.showToast('Data imported successfully. Reloading...', 'success');
                    setTimeout(() => location.reload(), 1500);
                } catch (err) {
                    App.showToast('Invalid JSON file: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    bulkDeleteByCompany() {
        App.showModal('Bulk Delete by Company', `
            <div class="form-group">
                <label>Select Company to Delete All Data For</label>
                <select class="form-input" id="bdCompany">
                    ${Object.values(DataStore.companies).map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('')}
                </select>
            </div>
            <p class="text-danger"><i class="fas fa-exclamation-triangle"></i> This deletes all records linked to the selected company, including invoices, expenses, employees, payslips, projects, etc.</p>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-danger" onclick="Admin.executeBulkDeleteByCompany()">Delete All Company Data</button>`
        );
    },

    executeBulkDeleteByCompany() {
        const companyId = document.getElementById('bdCompany')?.value;
        if (!companyId) return;
        const companyName = DataStore.companies[companyId]?.name || companyId;
        if (!confirm(`Delete ALL data for "${companyName}"? This cannot be undone.`)) return;

        const filterKeys = ['invoices','expenses','customers','employees','payslips','projects','lots','homeowners',
            'lotPayments','spaces','tenants','leases','rentalPayments','quarryOrders','quarryProducts',
            'students','enrollments','testOrders','testResults','attendanceRecords','performanceReviews',
            'incidentReports','workSchedules','timesheets'];
        let deletedTotal = 0;
        filterKeys.forEach(key => {
            const arr = DataStore[key];
            if (Array.isArray(arr)) {
                const before = arr.length;
                DataStore[key] = arr.filter(r => r.companyId !== companyId);
                deletedTotal += before - DataStore[key].length;
            }
        });
        Database.save();
        Database.addAuditEntry('Bulk Delete by Company', `${Auth.getName()} deleted ${deletedTotal} records for ${companyName}`, 'danger');
        App.closeModal();
        App.showToast(`Deleted ${deletedTotal} records for ${companyName}.`, 'success');
        this.render(document.getElementById('mainContent'));
    }
};
