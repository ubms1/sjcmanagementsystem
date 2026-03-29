/* ========================================
   SJC UBMS - Authentication Module
   ======================================== */

const Auth = {
    session: null,

    init() {
        const stored = localStorage.getItem('sjc_ubms_session');
        if (!stored) { window.location.href = 'login.html'; return false; }
        this.session = JSON.parse(stored);
        if (!this.session.isLoggedIn) { window.location.href = 'login.html'; return false; }
        return true;
    },

    getSession() { return this.session; },
    getRole() { return this.session?.role || 'staff'; },
    getCompany() { return this.session?.company || 'all'; },
    getName() { return this.session?.name || 'User'; },
    getUserId() { return this.session?.userId || null; },

    isSuperAdmin() { return this.session?.role === 'superadmin' || this.session?.isSuperAdmin === true; },
    isOwner() { return this.session?.role === 'owner' || this.isSuperAdmin(); },
    isManager() { return ['owner', 'manager', 'superadmin'].includes(this.session?.role); },
    canEditDelete() { return this.isSuperAdmin() || this.session?.role === 'owner'; },

    canAccessCompany(companyId) {
        if (this.isSuperAdmin() || this.isOwner()) return true;
        const companies = this.session?.companies || [this.session?.company];
        return companies.includes(companyId) || companies.includes('all');
    },

    canAccessModule(module) {
        const role = this.getRole();
        if (role === 'superadmin' || role === 'owner') return true;
        const allowedModules = this.session?.modules || [];
        if (allowedModules.includes('all')) return true;
        if (allowedModules.length === 0) return false; // no modules assigned = no access
        return allowedModules.includes(module);
    },

    async login(username, password, company) {
        const result = await Database.authenticate(username, password, company);
        if (!result.success) return result;
        const session = {
            userId: result.user.id, username: result.user.username, role: result.user.role,
            name: result.user.name, email: result.user.email, company: result.user.company,
            companies: result.user.companies, modules: result.user.modules,
            isSuperAdmin: result.user.isSuperAdmin, avatar: result.user.avatar,
            loginTime: new Date().toISOString(), isLoggedIn: true
        };
        localStorage.setItem('sjc_ubms_session', JSON.stringify(session));
        Database.addAuditEntry('Login', `${result.user.name} logged in as ${result.user.role}`, 'success');
        return { success: true };
    },

    async loginSuperAdmin(code) {
        const result = await Database.authenticateSuperAdmin(code);
        if (!result.success) return result;
        const session = {
            userId: result.user.id, username: result.user.username, role: 'superadmin',
            name: result.user.name, email: result.user.email, company: 'all',
            companies: ['all'], modules: ['all'], isSuperAdmin: true, avatar: 'SA',
            loginTime: new Date().toISOString(), isLoggedIn: true
        };
        localStorage.setItem('sjc_ubms_session', JSON.stringify(session));
        Database.addAuditEntry('Super Admin Login', 'Super Admin accessed the system', 'warning');
        return { success: true };
    },

    logout() {
        Database.addAuditEntry('Logout', `${this.getName()} logged out`);
        localStorage.removeItem('sjc_ubms_session');
        window.location.href = 'login.html';
    }
};
