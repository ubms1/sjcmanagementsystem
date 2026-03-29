/* ============================================================
   SJC UBMS — Database Layer  v3
   Primary store  : Firebase Firestore (cloud, real-time)
   Offline cache  : localStorage (device, instant)
   Passwords      : SHA-256 (Web Crypto API) — never plaintext in cloud
   ============================================================ */

const Database = {

    /* ── Keys & constants ───────────────────────────────────── */
    DB_KEY:          'sjc_ubms_database',
    USERS_KEY:       'sjc_ubms_users',
    AUDIT_KEY:       'sjc_ubms_audit',
    SESSION_KEY:     'sjc_ubms_session',
    INITIALIZED_KEY: 'sjc_ubms_initialized',
    DB_VERSION:      3,
    DEFAULT_SA_CODE: 'SJC-SA-2026-UBMS',
    SA_CODE_KEY:     'sjc_ubms_sa_code',
    FS_PREFIX:       'ubms_',

    ARRAY_KEYS: [
        'customers','invoices','expenses','projects','subcontractors',
        'equipment','safetyRecords','documents','lots','lotPayments','homeowners',
        'commercialSpaces','tenants','leaseContracts','rentalPayments',
        'crushingOrders','crushingDeliveries','crushingProduction',
        'students','enrollments','instructors','trainingVehicles',
        'drivingSchedules','certificates','testOrders','testSamples',
        'testResults','labEquipment','qualityReviews','employees',
        'payslips','attendanceRecords','workSchedules','timesheets',
        'performanceReviews','incidentReports','inventoryItems',
        'inventoryTransactions','posTransactions','birInvoices',
        'journalEntries','isoDocuments','isoAudits','isoNcrs',
        'activityLog','notifications','projectMilestones',
        'aggregateProducts','drivingCourses','testServices',
        'subdivisionAmenities','interactions','payrollRecords','isoCAPAs'
    ],

    CONFIG_KEYS: ['monthlyRevenue'],
    CATALOG_KEYS: ['aggregateProducts', 'drivingCourses', 'testServices'],

    _firestoreEnabled: false,
    _db:               null,
    _syncTimer:        null,
    _unsubListeners:   [],

    init() {
        this._firestoreEnabled = !!window.FIREBASE_ENABLED;
        this._db               = window.FIRESTORE || null;

        const savedVersion = parseInt(localStorage.getItem('sjc_ubms_db_version') || '0', 10);
        const isInit       = localStorage.getItem(this.INITIALIZED_KEY);

        if (isInit && savedVersion === this.DB_VERSION) {
            this._loadFromLocal();
        } else {
            this._clearTransactionalData();
            this._seedUsers();
            this._saveToLocal();
            localStorage.setItem(this.INITIALIZED_KEY, 'true');
            localStorage.setItem('sjc_ubms_db_version', String(this.DB_VERSION));
        }

        DataStore.users    = this._getUsersFromLocal();
        DataStore.auditLog = this._getAuditLogFromLocal();

        if (this._firestoreEnabled) {
            this._bootstrapFirestore();
        }

        this._startAutoSave();
        this._showConnectionBadge();
    },

    _saveToLocal() {
        try {
            const data = {};
            [...this.ARRAY_KEYS, ...this.CONFIG_KEYS].forEach(k => { data[k] = DataStore[k]; });
            localStorage.setItem(this.DB_KEY, JSON.stringify(data));
            if (DataStore.users) {
                localStorage.setItem(this.USERS_KEY, JSON.stringify(DataStore.users));
            }
        } catch (e) { console.error('[DB] localStorage save error:', e); }
    },

    _loadFromLocal() {
        try {
            const raw = localStorage.getItem(this.DB_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            [...this.ARRAY_KEYS, ...this.CONFIG_KEYS].forEach(k => {
                if (data[k] !== undefined) DataStore[k] = data[k];
            });
        } catch (e) { console.error('[DB] localStorage load error:', e); }
    },

    save() {
        this._saveToLocal();
        if (this._firestoreEnabled) {
            clearTimeout(this._syncTimer);
            this._syncTimer = setTimeout(() => this._syncToFirestore(), 1500);
        }
    },

    async _bootstrapFirestore() {
        try {
            await this._fetchAllFromFirestore();
            this._saveToLocal();
            this._triggerRerender();
            this._setupRealtimeListeners();
            this._showConnectionBadge(true);
        } catch (err) {
            console.error('[DB] Firestore bootstrap error:', err);
            this._showConnectionBadge(false);
        }
    },

    async _fetchAllFromFirestore() {
        if (!this._db) return;
        const fetches = [];

        for (const key of this.ARRAY_KEYS) {
            fetches.push(
                this._db.collection(this.FS_PREFIX + key).get()
                    .then(snap => {
                        const items = snap.docs.map(d => ({ ...d.data(), id: d.id }));
                        if (items.length > 0) {
                            DataStore[key] = items;
                        } else if (!DataStore[key]) {
                            DataStore[key] = [];
                        }
                    })
                    .catch(() => {})
            );
        }

        fetches.push(
            this._db.collection('ubms_config').doc('main').get()
                .then(doc => {
                    if (doc.exists) {
                        const d = doc.data();
                        if (d.monthlyRevenue) DataStore.monthlyRevenue = d.monthlyRevenue;
                    }
                })
                .catch(() => {})
        );

        fetches.push(
            this._db.collection('ubms_users').get()
                .then(snap => {
                    if (snap.docs.length > 0) {
                        const users = snap.docs.map(d => ({ ...d.data(), id: d.id }));
                        DataStore.users = users;
                        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
                    } else {
                        const local = this._getUsersFromLocal();
                        if (local.length > 0) this._syncUsersToFirestore(local);
                    }
                })
                .catch(() => {})
        );

        await Promise.all(fetches);
    },

    async _syncToFirestore() {
        if (!this._db) return;
        try {
            const tasks = [];
            for (const key of this.ARRAY_KEYS) {
                tasks.push(this._syncCollectionToFirestore(key, DataStore[key] || []));
            }
            tasks.push(
                this._db.collection('ubms_config').doc('main').set({
                    monthlyRevenue: DataStore.monthlyRevenue,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true })
            );
            tasks.push(this._syncUsersToFirestore(DataStore.users || []));
            await Promise.all(tasks);
        } catch (err) { console.error('[DB] Firestore sync error:', err); }
    },

    async _syncCollectionToFirestore(key, items) {
        if (!this._db || !Array.isArray(items) || items.length === 0) return;
        const collRef  = this._db.collection(this.FS_PREFIX + key);
        const BATCH_MAX = 400;
        for (let i = 0; i < items.length; i += BATCH_MAX) {
            const batch = this._db.batch();
            const chunk = items.slice(i, i + BATCH_MAX);
            chunk.forEach(item => {
                if (!item || !item.id) return;
                batch.set(collRef.doc(String(item.id)), item);
            });
            await batch.commit();
        }
    },

    async _syncUsersToFirestore(users) {
        if (!this._db || !users.length) return;
        const batch    = this._db.batch();
        const usersRef = this._db.collection('ubms_users');
        for (const rawUser of users) {
            const u = { ...rawUser };
            if (u.password && !u.passwordHash) {
                try { u.passwordHash = await this.hashPassword(u.password); } catch (_) {}
                delete u.password;
            }
            if (!u.id) continue;
            batch.set(usersRef.doc(u.id), u);
        }
        await batch.commit();
    },

    _setupRealtimeListeners() {
        if (!this._db) return;
        this._unsubListeners.forEach(fn => fn());
        this._unsubListeners = [];

        const watchKeys = [
            'customers','invoices','expenses','projects','lots',
            'commercialSpaces','students','enrollments','testOrders',
            'employees','payslips','inventoryItems','activityLog','notifications'
        ];

        watchKeys.forEach(key => {
            try {
                const unsub = this._db.collection(this.FS_PREFIX + key)
                    .onSnapshot(
                        { includeMetadataChanges: false },
                        snap => {
                            if (snap.metadata.hasPendingWrites) return;
                            DataStore[key] = snap.docs.map(d => ({ ...d.data(), id: d.id }));
                            this._saveToLocal();
                            this._triggerRerender();
                        },
                        err => console.warn('[DB] Listener error (' + key + '):', err.code)
                    );
                this._unsubListeners.push(unsub);
            } catch (_) {}
        });

        try {
            const unsub = this._db.collection('ubms_config').doc('main')
                .onSnapshot(doc => {
                    if (!doc.exists || doc.metadata.hasPendingWrites) return;
                    const d = doc.data();
                    if (d && d.monthlyRevenue) {
                        DataStore.monthlyRevenue = d.monthlyRevenue;
                        this._triggerRerender();
                    }
                }, () => {});
            this._unsubListeners.push(unsub);
        } catch (_) {}
    },

    _triggerRerender() {
        try {
            if (typeof App !== 'undefined' && App.activeModule) {
                App.navigate(App.activeModule, false);
            }
        } catch (_) {}
    },

    _showConnectionBadge(connected) {
        if (typeof document === 'undefined') return;
        const attach = () => {
            let badge = document.getElementById('dbStatusBadge');
            if (!badge) {
                badge = document.createElement('div');
                badge.id = 'dbStatusBadge';
                Object.assign(badge.style, {
                    position:'fixed', bottom:'16px', right:'16px',
                    padding:'6px 14px', borderRadius:'20px', fontSize:'11px',
                    fontWeight:'600', zIndex:'9999', display:'flex',
                    alignItems:'center', gap:'6px',
                    boxShadow:'0 2px 10px rgba(0,0,0,.25)',
                    transition:'opacity 1.5s ease', opacity:'1',
                    fontFamily:'Inter, sans-serif'
                });
                document.body.appendChild(badge);
            }
            if (connected === undefined) {
                badge.style.background = '#4b5563'; badge.style.color = '#fff';
                badge.innerHTML = '<i class="fas fa-circle-notch fa-spin" style="font-size:9px"></i>&nbsp;Connecting…';
                badge.style.opacity = '1';
            } else if (connected) {
                badge.style.background = '#059669'; badge.style.color = '#fff';
                badge.innerHTML = '<i class="fas fa-circle" style="font-size:8px"></i>&nbsp;Cloud Sync Active';
                badge.style.opacity = '1';
                setTimeout(() => { if (badge) badge.style.opacity = '0'; }, 4000);
            } else {
                badge.style.background = '#d97706'; badge.style.color = '#fff';
                badge.innerHTML = '<i class="fas fa-exclamation-circle" style="font-size:9px"></i>&nbsp;Offline Mode';
                badge.style.opacity = '1';
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attach);
        } else { attach(); }
    },

    _startAutoSave() { setInterval(() => this.save(), 30000); },

    async hashPassword(plaintext) {
        const SALT    = 'SJC_UBMS_PH_2026';
        const encoder = new TextEncoder();
        const data    = encoder.encode(plaintext + SALT);
        const buf     = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async authenticate(username, password, company) {
        const user = this.findUser(username);
        if (!user) return { success: false, error: 'Invalid username or password.' };
        if (user.status !== 'active') return { success: false, error: 'Account is deactivated. Contact your administrator.' };

        let match = false;
        if (user.passwordHash) {
            match = (await this.hashPassword(password)) === user.passwordHash;
        } else if (user.password) {
            match = user.password === password;
            if (match) {
                user.passwordHash = await this.hashPassword(password);
                delete user.password;
                this._persistUserUpdate(user);
            }
        }
        if (!match) return { success: false, error: 'Invalid username or password.' };

        if (company && company !== 'all'
            && !(user.companies || []).includes('all')
            && !(user.companies || []).includes(company)) {
            return { success: false, error: 'You do not have access to this business portal.' };
        }
        return { success: true, user };
    },

    async authenticateSuperAdmin(code) {
        const saCode = localStorage.getItem(this.SA_CODE_KEY) || this.DEFAULT_SA_CODE;
        if (code !== saCode) return { success: false, error: 'Invalid Super Admin access code.' };
        const sa = (DataStore.users || []).find(u => u.isSuperAdmin);
        return sa ? { success: true, user: sa } : { success: false, error: 'Super Admin account not found.' };
    },

    getSuperAdminCode() {
        return localStorage.getItem(this.SA_CODE_KEY) || this.DEFAULT_SA_CODE;
    },

    _getUsersFromLocal() {
        try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; } catch { return []; }
    },

    getUsers() { return DataStore.users || this._getUsersFromLocal(); },

    findUser(username) {
        return (DataStore.users || this._getUsersFromLocal()).find(u => u.username === username);
    },

    _persistUserUpdate(user) {
        const users = (DataStore.users || []).map(u => u.id === user.id ? user : u);
        DataStore.users = users;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        if (this._firestoreEnabled && this._db) {
            const { password: _pw, ...safe } = user;
            this._db.collection('ubms_users').doc(user.id).set(safe).catch(() => {});
        }
    },

    async addUser(userObj) {
        if (userObj.password) {
            userObj.passwordHash = await this.hashPassword(userObj.password);
            delete userObj.password;
        }
        const users = this._getUsersFromLocal();
        users.push(userObj);
        DataStore.users = users;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        if (this._firestoreEnabled && this._db) {
            await this._db.collection('ubms_users').doc(userObj.id).set(userObj).catch(() => {});
        }
    },

    async updateUser(userId, updates) {
        if (updates.password) {
            updates.passwordHash = await this.hashPassword(updates.password);
            delete updates.password;
        }
        const users = (DataStore.users || []).map(u => u.id === userId ? { ...u, ...updates } : u);
        DataStore.users = users;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        if (this._firestoreEnabled && this._db) {
            const { password: _pw, ...safe } = updates;
            await this._db.collection('ubms_users').doc(userId).update(safe).catch(() => {});
        }
    },

    deleteUser(userId) {
        const users = (DataStore.users || []).filter(u => u.id !== userId);
        DataStore.users = users;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        if (this._firestoreEnabled && this._db) {
            this._db.collection('ubms_users').doc(userId).delete().catch(() => {});
        }
    },

    addAuditEntry(action, details, type = 'info') {
        try {
            const entry = {
                id:   'AUD-' + Date.now(),
                action, details, type,
                user: (typeof Auth !== 'undefined' && Auth.getName?.()) || 'System',
                time: new Date().toISOString()
            };
            const log = this._getAuditLogFromLocal();
            log.unshift(entry);
            if (log.length > 500) log.length = 500;
            localStorage.setItem(this.AUDIT_KEY, JSON.stringify(log));
            DataStore.auditLog = log;
            if (this._firestoreEnabled && this._db) {
                this._db.collection('ubms_audit').doc(entry.id).set(entry).catch(() => {});
            }
        } catch (_) {}
    },

    _getAuditLogFromLocal() {
        try { return JSON.parse(localStorage.getItem(this.AUDIT_KEY) || '[]'); } catch { return []; }
    },

    getAuditLog() { return this._getAuditLogFromLocal(); },

    _clearTransactionalData() {
        this.ARRAY_KEYS.forEach(k => {
            if (!this.CATALOG_KEYS.includes(k)) { DataStore[k] = []; }
        });
        DataStore.monthlyRevenue = {
            sjc:[0,0,0,0,0,0,0,0,0,0,0,0], erlandia:[0,0,0,0,0,0,0,0,0,0,0,0],
            nancys:[0,0,0,0,0,0,0,0,0,0,0,0], crushing:[0,0,0,0,0,0,0,0,0,0,0,0],
            mileage:[0,0,0,0,0,0,0,0,0,0,0,0], megatesting:[0,0,0,0,0,0,0,0,0,0,0,0]
        };
    },

    _seedUsers() {
        const users = [
            { id:'USR-SA',  username:'superadmin',  password:'SJC@2026!',   name:'System Administrator', email:'admin@sjcgroup.com',         role:'superadmin', company:'all',        companies:['all'],                          modules:['all'], isSuperAdmin:true,  avatar:'SA', status:'active' },
            { id:'USR-001', username:'owner',        password:'owner123',    name:'SJC Owner',            email:'owner@sjcgroup.com',          role:'owner',      company:'all',        companies:['all'],                          modules:['all'], isSuperAdmin:false, avatar:'OW', status:'active' },
            { id:'USR-002', username:'manager',      password:'manager123',  name:'SJC Manager',          email:'manager@sjcgroup.com',        role:'manager',    company:'sjc',        companies:['sjc','erlandia','nancys','crushing'], modules:['all'], isSuperAdmin:false, avatar:'MG', status:'active' },
            { id:'USR-003', username:'mileage',      password:'mileage123',  name:'Mileage Manager',      email:'manager@mileagedriving.com',  role:'manager',    company:'mileage',    companies:['mileage'],                      modules:['all'], isSuperAdmin:false, avatar:'ML', status:'active' },
            { id:'USR-004', username:'megatesting',  password:'mega123',     name:'Megatesting Manager',  email:'manager@megatesting.com',     role:'manager',    company:'megatesting',companies:['megatesting'],                  modules:['all'], isSuperAdmin:false, avatar:'MT', status:'active' }
        ];
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        DataStore.users = users;
    },

    exportData() {
        const data = { version: this.DB_VERSION, exportedAt: new Date().toISOString() };
        [...this.ARRAY_KEYS, ...this.CONFIG_KEYS].forEach(k => { data[k] = DataStore[k]; });
        data.users = (DataStore.users || []).map(({ password: _pw, ...safe }) => safe);
        return JSON.stringify(data, null, 2);
    },

    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            [...this.ARRAY_KEYS, ...this.CONFIG_KEYS].forEach(k => {
                if (data[k] !== undefined) DataStore[k] = data[k];
            });
            if (data.users) { DataStore.users = data.users; localStorage.setItem(this.USERS_KEY, JSON.stringify(data.users)); }
            this.save();
            return { success: true };
        } catch (e) { return { success: false, error: e.message }; }
    },

    /* Legacy compat */
    load()           { this._loadFromLocal(); },
    seedUsers()      { this._seedUsers(); },
    seedSampleData() { /* intentionally empty — no mock data */ }
};
