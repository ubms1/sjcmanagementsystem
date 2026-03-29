/* ========================================
   SJC UBMS - Settings Module
   System settings and configuration
   ======================================== */

const Settings = {
    render(container) {
        const session = Auth.getSession();
        container.innerHTML = `
        <div class="section-header"><div><h2>Settings</h2><p>System configuration and preferences</p></div></div>

        <div class="grid-2">
            <div class="card mb-3"><div class="card-body">
                <h3 class="section-heading"><i class="fas fa-palette"></i> Appearance</h3>
                <div class="form-group">
                    <label>Theme</label>
                    <select class="form-input" id="setTheme" onchange="Settings.changeTheme()">
                        <option value="light" ${!document.body.classList.contains('dark-theme')?'selected':''}>Light</option>
                        <option value="dark" ${document.body.classList.contains('dark-theme')?'selected':''}>Dark</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sidebar Default</label>
                    <select class="form-input" id="setSidebar" onchange="Settings.savePref('sidebarCollapsed',this.value)">
                        <option value="expanded">Expanded</option>
                        <option value="collapsed">Collapsed</option>
                    </select>
                </div>
            </div></div>

            <div class="card mb-3"><div class="card-body">
                <h3 class="section-heading"><i class="fas fa-building"></i> Company Defaults</h3>
                <div class="form-group">
                    <label>Default Company</label>
                    <select class="form-input" id="setDefaultCo" onchange="Settings.savePref('defaultCompany',this.value)">
                        <option value="">All Companies</option>
                        ${Object.values(DataStore.companies).map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Currency</label>
                    <input type="text" class="form-input" value="₱ PHP (Philippine Peso)" disabled>
                </div>
                <div class="form-group">
                    <label>Date Format</label>
                    <select class="form-input" disabled>
                        <option>MM/DD/YYYY</option>
                    </select>
                </div>
            </div></div>

            <div class="card mb-3"><div class="card-body">
                <h3 class="section-heading"><i class="fas fa-user"></i> Account</h3>
                <div class="info-list mb-2">
                    <div><strong>Username:</strong> ${session?.username || '-'}</div>
                    <div><strong>Role:</strong> <span class="badge-tag badge-primary">${session?.role || '-'}</span></div>
                    <div><strong>Companies:</strong> ${(session?.companies || []).join(', ') || 'All'}</div>
                </div>
                <button class="btn btn-secondary" onclick="Settings.changePassword()"><i class="fas fa-key"></i> Change Password</button>
            </div></div>

            <div class="card mb-3"><div class="card-body">
                <h3 class="section-heading"><i class="fas fa-database"></i> Data Management</h3>
                <div class="btn-stack">
                    <button class="btn btn-secondary" onclick="Settings.exportData()"><i class="fas fa-download"></i> Export All Data (JSON)</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()"><i class="fas fa-upload"></i> Import Data</button>
                    <input type="file" id="importFile" accept=".json" class="hidden" onchange="Settings.importData(event)">
                    <button class="btn btn-secondary btn-text-danger" onclick="Settings.clearData()"><i class="fas fa-trash"></i> Clear Transactional Data</button>
                </div>
                <div class="help-text">
                    <div>Storage Used: ${(JSON.stringify(localStorage.getItem('sjc_ubms_database') || '').length / 1024).toFixed(1)} KB</div>
                    <div>Last Saved: ${Utils.formatRelative(new Date())}</div>
                </div>
            </div></div>
        </div>`;

        // Load saved preferences
        const prefs = Utils.loadFromStorage('sjc_ubms_preferences') || {};
        if (prefs.defaultCompany) { const el = document.getElementById('setDefaultCo'); if (el) el.value = prefs.defaultCompany; }
    },

    changeTheme() {
        const theme = document.getElementById('setTheme')?.value;
        if (theme === 'dark') document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
        Utils.saveToStorage('sjc_ubms_theme', theme);
    },

    savePref(key, value) {
        const prefs = Utils.loadFromStorage('sjc_ubms_preferences') || {};
        prefs[key] = value;
        Utils.saveToStorage('sjc_ubms_preferences', prefs);
        App.showToast('Preference saved');
    },

    changePassword() {
        App.showModal('Change Password', `
            <div class="form-group"><label>Current Password</label><input type="password" class="form-input" id="cpCurrent"></div>
            <div class="form-group"><label>New Password</label><input type="password" class="form-input" id="cpNew"></div>
            <div class="form-group"><label>Confirm New Password</label><input type="password" class="form-input" id="cpConfirm"></div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="Settings.savePassword()">Change Password</button>`
        );
    },

    savePassword() {
        const current = document.getElementById('cpCurrent')?.value;
        const newPw = document.getElementById('cpNew')?.value;
        const confirm = document.getElementById('cpConfirm')?.value;
        if (!current || !newPw) { App.showToast('Fill all fields', 'error'); return; }
        if (newPw !== confirm) { App.showToast('Passwords do not match', 'error'); return; }
        if (newPw.length < 6) { App.showToast('Password must be at least 6 characters', 'error'); return; }
        const session = Auth.getSession();
        const user = DataStore.users?.find(u => u.username === session?.username);
        if (!user || user.password !== current) { App.showToast('Current password incorrect', 'error'); return; }
        user.password = newPw;
        Database.save(); App.closeModal(); App.showToast('Password changed successfully');
    },

    exportData() {
        const data = JSON.stringify(DataStore, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `sjc-ubms-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(url);
        App.showToast('Data exported');
    },

    importData(event) {
        const file = event.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (!imported.companies) { App.showToast('Invalid backup file', 'error'); return; }
                App.confirmAction('Import will overwrite current data. Continue?', () => {
                    Object.assign(DataStore, imported);
                    Database.save();
                    App.showToast('Data imported successfully');
                    location.reload();
                });
            } catch (err) { App.showToast('Invalid JSON file', 'error'); }
        };
        reader.readAsText(file);
    },

    clearData() {
        App.confirmAction('This will clear all transactional data (invoices, expenses, etc.) but keep master data. Continue?', () => {
            Database.clearTransactionalData();
            App.showToast('Transactional data cleared');
            location.reload();
        });
    }
};
