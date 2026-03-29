/* ========================================
   SJC UBMS - Main Application Controller
   Navigation, routing, company switching
   ======================================== */

const App = {
    activeCompany: 'all',
    activeModule: 'dashboard',
    charts: {},
    sidebarOpen: false,

    get currentCompany() {
        return this.activeCompany === 'all' ? null : this.activeCompany;
    },

    init() {
        Database.init();
        if (!Auth.init()) return;

        this.activeCompany = Utils.loadFromStorage('sjc_ubms_activeCompany') || 'all';
        this.setupNavigation();
        this.setupCompanySelector();
        this.setupProfileDropdown();
        this.setupSidebar();
        this.updateNavVisibility();
        this.updateSidebarBrand(this.activeCompany);
        this.navigate('dashboard');
        this.updateProfileUI();

        // Auto-save
        setInterval(() => Database.save(), 30000);
    },

    setupNavigation() {
        document.querySelectorAll('.nav-link[data-module]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const mod = link.dataset.module;
                this.navigate(mod);
                if (window.innerWidth < 1024) this.closeSidebar();
            });
        });
    },

    setupCompanySelector() {
        const sel = document.getElementById('activeCompany');
        if (!sel) return;
        sel.value = this.activeCompany;
        sel.addEventListener('change', () => {
            this.switchCompany(sel.value);
        });
        // Filter by role
        if (!Auth.isSuperAdmin() && !Auth.isOwner()) {
            const allowedCompanies = Auth.session?.companies || [];
            Array.from(sel.options).forEach(opt => {
                if (opt.value !== 'all' && !allowedCompanies.includes(opt.value)) {
                    opt.disabled = true;
                }
            });
        }
    },

    setupProfileDropdown() {
        const btn = document.getElementById('profileBtn');
        const menu = document.getElementById('profileMenu');
        if (!btn || !menu) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });
        document.addEventListener('click', () => menu.classList.remove('show'));
    },

    setupSidebar() {
        const toggle = document.getElementById('sidebarToggle');
        const collapse = document.getElementById('sidebarCollapseBtn');
        if (toggle) toggle.addEventListener('click', (e) => { e.stopPropagation(); this.toggleSidebar(); });
        if (collapse) collapse.addEventListener('click', (e) => { e.stopPropagation(); this.toggleSidebar(); });

        // Outside click closes sidebar on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.sidebarOpen) {
                const sidebar = document.getElementById('sidebar');
                const sidebarToggle = document.getElementById('sidebarToggle');
                if (sidebar && !sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });

        // Nav group collapsing
        document.querySelectorAll('.nav-group > .nav-group-title').forEach(title => {
            title.addEventListener('click', () => {
                title.parentElement.classList.toggle('collapsed');
            });
        });

        // Restore persisted collapsed state on desktop
        if (window.innerWidth > 768 && Utils.loadFromStorage('sjc_ubms_sidebar_collapsed') === '1') {
            document.getElementById('sidebar')?.classList.add('collapsed');
        }
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar) return;
        if (window.innerWidth <= 768) {
            // Mobile: slide in/out
            sidebar.classList.toggle('open');
            overlay?.classList.toggle('show');
            this.sidebarOpen = sidebar.classList.contains('open');
        } else {
            // Desktop: collapse/expand icon-only mode
            sidebar.classList.toggle('collapsed');
            Utils.saveToStorage('sjc_ubms_sidebar_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
        }
    },

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sidebar) return;
        sidebar.classList.remove('open');
        overlay?.classList.remove('show');
        this.sidebarOpen = false;
    },

    updateSidebarBrand(companyId) {
        const map = {
            all:         { logo: 'San Jacinto Construction/SJC logo.jpg',                                      alt: 'SJC Group',    title: 'SJC UBMS',        subtitle: 'Unified Business System' },
            sjc:         { logo: 'San Jacinto Construction/SJC logo.jpg',                                      alt: 'SJC',          title: 'San Jacinto',     subtitle: 'Construction Corp.' },
            erlandia:    { logo: 'San Jacinto Construction/SJC logo.jpg',                                      alt: 'Erlandia',     title: 'Erlandia Homes',  subtitle: 'Subdivision' },
            nancys:      { logo: 'San Jacinto Construction/SJC logo.jpg',                                      alt: "Nancy's",      title: "Nancy's Square",  subtitle: 'Commercial Spaces' },
            crushing:    { logo: 'San Jacinto Construction/SJC logo.jpg',                                      alt: 'SJC Crushing', title: 'SJC Crushing',    subtitle: 'Stones & Gravel' },
            mileage:     { logo: 'Mileage Development & Training Center Inc/MDTCI logo.jpg',                   alt: 'MDTCI',        title: 'Mileage Dev\'t',  subtitle: 'Training Center' },
            megatesting: { logo: 'Megatesting Center Inc.-Tuguegarao Branch/MEGASTESTING logo.jpg',            alt: 'Megatesting',  title: 'Megatesting',     subtitle: 'Center Inc.' },
        };
        const brand = map[companyId] || map['all'];
        const img = document.getElementById('sidebarLogo');
        const titleEl = document.getElementById('sidebarBrandTitle');
        const subtitleEl = document.getElementById('sidebarBrandSubtitle');
        if (img) { img.src = brand.logo; img.alt = brand.alt; }
        if (titleEl) titleEl.textContent = brand.title;
        if (subtitleEl) subtitleEl.textContent = brand.subtitle;
    },

    switchCompany(companyId) {
        this.activeCompany = companyId;
        Utils.saveToStorage('sjc_ubms_activeCompany', companyId);
        this.updateNavVisibility();
        this.updateSidebarBrand(companyId);
        this.navigate(this.activeModule);
        // Update selector
        const sel = document.getElementById('activeCompany');
        if (sel) sel.value = companyId;
    },

    updateNavVisibility() {
        const co = this.activeCompany;
        const companyObj = co === 'all' ? null : DataStore.companies[co];
        const type = co === 'all' ? 'all' : (companyObj?.type || 'all');
        const navGroups = {
            'nav-construction': ['all', 'construction'],
            'nav-subdivision': ['all', 'subdivision'],
            'nav-commercial': ['all', 'commercial'],
            'nav-quarry': ['all', 'quarry'],
            'nav-driving': ['all', 'driving_school'],
            'nav-testing': ['all', 'testing_lab']
        };
        Object.entries(navGroups).forEach(([groupId, types]) => {
            const el = document.getElementById(groupId);
            if (el) el.style.display = types.includes(type) ? '' : 'none';
        });

        // Enforce individual module visibility based on user's module permissions
        if (!Auth.isSuperAdmin() && !Auth.isOwner()) {
            document.querySelectorAll('.nav-link[data-module]').forEach(link => {
                if (!Auth.canAccessModule(link.dataset.module)) {
                    link.style.display = 'none';
                } else {
                    link.style.display = '';
                }
            });
        } else {
            // SuperAdmin/Owner always see all links
            document.querySelectorAll('.nav-link[data-module]').forEach(link => {
                link.style.display = '';
            });
        }
    },

    navigate(module) {
        this.activeModule = module;
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-module="${module}"]`);
        if (activeLink) activeLink.classList.add('active');
        // Update page title
        const title = activeLink?.querySelector('.nav-text')?.textContent || module.charAt(0).toUpperCase() + module.slice(1);
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = title;

        const main = document.getElementById('mainContent');
        if (!main) return;

        main.innerHTML = '<div class="page-loading"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';

        // Access gate — block restricted modules for non-superadmin/owner users
        if (!Auth.isSuperAdmin() && !Auth.isOwner() && !Auth.canAccessModule(module)) {
            main.innerHTML = '<div class="empty-state"><i class="fas fa-lock"></i><h3>Access Restricted</h3><p>You do not have permission to access this module. Contact your administrator.</p></div>';
            return;
        }

        try {
            switch (module) {
                case 'dashboard': Dashboard.render(main); break;
                case 'projects': if (typeof Construction !== 'undefined') Construction.renderProjects(main); break;
                case 'project-monitoring': if (typeof Construction !== 'undefined') Construction.renderMonitoring(main); break;
                case 'job-costing': if (typeof Construction !== 'undefined') Construction.renderJobCosting(main); break;
                case 'subcontractors': if (typeof Construction !== 'undefined') Construction.renderSubcontractors(main); break;
                case 'equipment': if (typeof Construction !== 'undefined') Construction.renderEquipment(main); break;
                case 'safety': if (typeof Construction !== 'undefined') Construction.renderSafety(main); break;
                case 'documents': if (typeof Construction !== 'undefined') Construction.renderDocuments(main); break;
                case 'credit-collection': if (typeof Construction !== 'undefined') Construction.renderCredit(main); break;
                case 'lots': if (typeof Subdivision !== 'undefined') Subdivision.renderLots(main); break;
                case 'homeowners': if (typeof Subdivision !== 'undefined') Subdivision.renderHomeowners(main); break;
                case 'lot-payments': if (typeof Subdivision !== 'undefined') Subdivision.renderPayments(main); break;
                case 'amenities': if (typeof Subdivision !== 'undefined') Subdivision.renderAmenities(main); break;
                case 'spaces': if (typeof Commercial !== 'undefined') Commercial.renderSpaces(main); break;
                case 'tenants': if (typeof Commercial !== 'undefined') Commercial.renderTenants(main); break;
                case 'leases': if (typeof Commercial !== 'undefined') Commercial.renderLeases(main); break;
                case 'rental-payments': if (typeof Commercial !== 'undefined') Commercial.renderPayments(main); break;
                case 'quarry-products': if (typeof Crushing !== 'undefined') Crushing.renderProducts(main); break;
                case 'quarry-orders': if (typeof Crushing !== 'undefined') Crushing.renderOrders(main); break;
                case 'quarry-deliveries': if (typeof Crushing !== 'undefined') Crushing.renderDeliveries(main); break;
                case 'quarry-production': if (typeof Crushing !== 'undefined') Crushing.renderProduction(main); break;
                case 'courses': if (typeof DrivingSchool !== 'undefined') DrivingSchool.renderCourses(main); break;
                case 'students': if (typeof DrivingSchool !== 'undefined') DrivingSchool.renderStudents(main); break;
                case 'enrollments': if (typeof DrivingSchool !== 'undefined') DrivingSchool.renderEnrollments(main); break;
                case 'instructors': if (typeof DrivingSchool !== 'undefined') DrivingSchool.renderInstructors(main); break;
                case 'vehicles': if (typeof DrivingSchool !== 'undefined') DrivingSchool.renderVehicles(main); break;
                case 'schedules': if (typeof DrivingSchool !== 'undefined') DrivingSchool.renderSchedules(main); break;
                case 'certificates': if (typeof DrivingSchool !== 'undefined') DrivingSchool.renderCertificates(main); break;
                case 'test-services': if (typeof TestingLab !== 'undefined') TestingLab.renderServices(main); break;
                case 'test-orders': if (typeof TestingLab !== 'undefined') TestingLab.renderOrders(main); break;
                case 'test-samples': if (typeof TestingLab !== 'undefined') TestingLab.renderSamples(main); break;
                case 'test-results': if (typeof TestingLab !== 'undefined') TestingLab.renderResults(main); break;
                case 'lab-equipment': if (typeof TestingLab !== 'undefined') TestingLab.renderEquipment(main); break;
                case 'quality-reviews': if (typeof TestingLab !== 'undefined') TestingLab.renderQualityReviews(main); break;
                case 'crm': if (typeof CRM !== 'undefined') CRM.render(main); break;
                case 'financial': if (typeof Financial !== 'undefined') Financial.render(main); break;
                case 'reports': if (typeof Reports !== 'undefined') Reports.render(main); break;
                case 'financial-analysis': if (typeof FinancialAnalysis !== 'undefined') FinancialAnalysis.render(main); break;
                case 'invoicing': if (typeof Invoicing !== 'undefined') Invoicing.render(main); break;
                case 'payroll': if (typeof Payroll !== 'undefined') Payroll.render(main); break;
                case 'inventory': if (typeof Inventory !== 'undefined') Inventory.render(main); break;
                case 'pos': if (typeof POS !== 'undefined') POS.render(main); break;
                case 'iso': if (typeof ISO !== 'undefined') ISO.render(main); break;
                case 'admin': if (typeof Admin !== 'undefined') Admin.render(main); break;
                case 'settings': if (typeof Settings !== 'undefined') Settings.render(main); break;
                default:
                    main.innerHTML = `<div class="empty-state"><i class="fas fa-cog"></i><h3>${title}</h3><p>This module is being configured.</p></div>`;
            }
        } catch (err) {
            console.error('Module render error:', err);
            main.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Module Error</h3><p>${Utils.escapeHtml(err.message)}</p></div>`;
        }
    },

    updateProfileUI() {
        const name = document.getElementById('profileName');
        const role = document.getElementById('profileRole');
        if (name) name.textContent = Auth.getName();
        if (role) role.textContent = Auth.getRole();
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${Utils.escapeHtml(message)}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    showModal(title, body, actions) {
        let modal = document.getElementById('appModal');
        if (modal) modal.remove();
        modal = document.createElement('div');
        modal.id = 'appModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${Utils.escapeHtml(title)}</h3>
                    <button class="modal-close" onclick="App.closeModal()">&times;</button>
                </div>
                <div class="modal-body">${body}</div>
                ${actions ? `<div class="modal-footer">${actions}</div>` : ''}
            </div>`;
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) App.closeModal();
        });
    },

    closeModal() {
        const modal = document.getElementById('appModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    },

    confirmAction(message, onConfirm) {
        this.showModal('Confirm Action',
            `<p class="modal-text">${Utils.escapeHtml(message)}</p>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-danger" onclick="App.closeModal();(${onConfirm.toString()})()">Confirm</button>`
        );
    },

    logout() {
        Auth.logout();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
