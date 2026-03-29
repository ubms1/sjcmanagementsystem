/* ========================================
   SJC UBMS - Data Store
   Multi-tenant data for all 6 businesses
   ======================================== */

const DataStore = {
    // ============================================================
    //  COMPANIES
    // ============================================================
    companies: {
        sjc: {
            id: 'sjc', name: 'San Jacinto Construction', type: 'construction',
            address: 'Tuguegarao City, Cagayan Valley', phone: '(078) 844-1234',
            email: 'info@sanjacintoconstruction.com', tin: '000-000-000-000',
            color: '#1565c0', icon: 'fa-hard-hat',
            logo: 'San Jacinto Construction/SJC logo.jpg'
        },
        erlandia: {
            id: 'erlandia', name: 'Erlandia Homes Subdivision', type: 'subdivision',
            address: 'Tuguegarao City, Cagayan Valley', phone: '(078) 844-2345',
            email: 'info@erlandiahomes.com', tin: '000-000-000-001',
            color: '#2e7d32', icon: 'fa-house-chimney',
            logo: 'San Jacinto Construction/SJC logo.jpg',
            parent: 'sjc'
        },
        nancys: {
            id: 'nancys', name: "Nancy's Square Commercial Spaces", type: 'commercial',
            address: 'Tuguegarao City, Cagayan Valley', phone: '(078) 844-3456',
            email: 'info@nancyssquare.com', tin: '000-000-000-002',
            color: '#6a1b9a', icon: 'fa-store',
            logo: 'San Jacinto Construction/SJC logo.jpg',
            parent: 'sjc'
        },
        crushing: {
            id: 'crushing', name: 'Stationary Crushing Plant - Stones & Gravel Supplier', type: 'quarry',
            address: 'Tuguegarao City, Cagayan Valley', phone: '(078) 844-4567',
            email: 'info@sjcquarry.com', tin: '000-000-000-003',
            color: '#e65100', icon: 'fa-mountain',
            logo: 'San Jacinto Construction/SJC logo.jpg',
            parent: 'sjc'
        },
        mileage: {
            id: 'mileage', name: 'Mileage Development & Training Center Inc.', type: 'driving_school',
            address: 'Tuguegarao City, Cagayan Valley', phone: '(078) 844-5678',
            email: 'info@mileagedriving.com', tin: '000-000-000-004',
            color: '#00838f', icon: 'fa-car-side',
            logo: 'Mileage Development & Training Center Inc/MDTCI logo.jpg',
            accreditation: 'LTO Accredited Driving School & Heavy Equipment Training Center'
        },
        megatesting: {
            id: 'megatesting', name: 'Megatesting Center Inc. - Tuguegarao Branch', type: 'testing_lab',
            address: 'Tuguegarao City, Cagayan Valley', phone: '(078) 844-6789',
            email: 'info@megatesting.com', tin: '000-000-000-005',
            color: '#c62828', icon: 'fa-flask',
            logo: 'Megatesting Center Inc.-Tuguegarao Branch/MEGASTESTING logo.jpg',
            accreditation: 'DPWH Accredited Civil Engineering Laboratory & Testing Center'
        }
    },

    // ============================================================
    //  CRM - CUSTOMERS (Unified)
    // ============================================================
    customers: [],

    // ============================================================
    //  FINANCIAL - ACCOUNTS & TRANSACTIONS
    // ============================================================
    chartOfAccounts: [
        { code: '1000', name: 'Cash and Cash Equivalents', type: 'asset', company: 'all' },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', company: 'all' },
        { code: '1200', name: 'Inventory', type: 'asset', company: 'all' },
        { code: '2000', name: 'Accounts Payable', type: 'liability', company: 'all' },
        { code: '3000', name: "Owner's Equity", type: 'equity', company: 'all' },
        { code: '4000', name: 'Construction Revenue', type: 'revenue', company: 'sjc' },
        { code: '4100', name: 'Lot Sales Revenue', type: 'revenue', company: 'erlandia' },
        { code: '4200', name: 'Rental Income', type: 'revenue', company: 'nancys' },
        { code: '4300', name: 'Aggregates Sales Revenue', type: 'revenue', company: 'crushing' },
        { code: '4400', name: 'Driving Course Fees', type: 'revenue', company: 'mileage' },
        { code: '4500', name: 'Testing Service Revenue', type: 'revenue', company: 'megatesting' },
        { code: '5000', name: 'Cost of Goods Sold', type: 'expense', company: 'all' },
        { code: '6000', name: 'Operating Expenses', type: 'expense', company: 'all' },
        { code: '6100', name: 'Salaries & Wages', type: 'expense', company: 'all' },
        { code: '6200', name: 'Rent Expense', type: 'expense', company: 'all' },
        { code: '6300', name: 'Utilities', type: 'expense', company: 'all' }
    ],

    invoices: [],
    expenses: [],
    journalEntries: [],
    interactions: [],
    isoCAPAs: [],

    // ============================================================
    //  CONSTRUCTION - PROJECTS (SJC)
    // ============================================================
    projects: [],
    subcontractors: [],
    equipment: [],
    safetyRecords: [],
    documents: [],
    projectMilestones: [],

    // ============================================================
    //  ERLANDIA HOMES - SUBDIVISION MANAGEMENT
    // ============================================================
    lots: [],
    lotPayments: [],
    homeowners: [],
    subdivisionAmenities: [],

    // ============================================================
    //  NANCY'S SQUARE - COMMERCIAL SPACES
    // ============================================================
    commercialSpaces: [],
    tenants: [],
    leaseContracts: [],
    rentalPayments: [],

    // ============================================================
    //  CRUSHING PLANT - STONES & GRAVEL
    // ============================================================
    aggregateProducts: [
        { id: 'AGG-001', name: '3/4 Gravel', unit: 'cu.m', price: 950, category: 'Gravel', stock: 500 },
        { id: 'AGG-002', name: '1/2 Gravel', unit: 'cu.m', price: 900, category: 'Gravel', stock: 400 },
        { id: 'AGG-003', name: 'Sand (Washed)', unit: 'cu.m', price: 800, category: 'Sand', stock: 600 },
        { id: 'AGG-004', name: 'Sand (Unwashed)', unit: 'cu.m', price: 650, category: 'Sand', stock: 800 },
        { id: 'AGG-005', name: 'Boulders', unit: 'cu.m', price: 700, category: 'Stone', stock: 300 },
        { id: 'AGG-006', name: 'Base Course (Item 200)', unit: 'cu.m', price: 1100, category: 'Base', stock: 350 },
        { id: 'AGG-007', name: 'Sub-base (Item 201)', unit: 'cu.m', price: 850, category: 'Base', stock: 250 },
        { id: 'AGG-008', name: 'Aggregates Mix', unit: 'cu.m', price: 1050, category: 'Mix', stock: 200 },
        { id: 'AGG-009', name: 'Filling Materials', unit: 'cu.m', price: 500, category: 'Fill', stock: 1000 },
        { id: 'AGG-010', name: 'Riprap', unit: 'cu.m', price: 1200, category: 'Stone', stock: 150 }
    ],
    crushingOrders: [],
    crushingDeliveries: [],
    crushingProduction: [],

    // ============================================================
    //  MILEAGE - DRIVING SCHOOL & TRAINING
    // ============================================================
    drivingCourses: [
        { id: 'DC-001', name: 'Theoretical Driving Course (TDC)', duration: '15 hours', price: 3500, category: 'LTO Course', description: 'LTO required lecture for student permit applicants', type: 'classroom' },
        { id: 'DC-002', name: 'Practical Driving Course (PDC) - Motorcycle', duration: '8 hours', price: 4500, category: 'LTO Course', description: 'Hands-on motorcycle riding course', type: 'practical' },
        { id: 'DC-003', name: 'Practical Driving Course (PDC) - Light Vehicle', duration: '8 hours', price: 5500, category: 'LTO Course', description: 'Behind-the-wheel training for cars/light vehicles', type: 'practical' },
        { id: 'DC-004', name: 'Practical Driving Course (PDC) - Heavy Vehicle', duration: '15 hours', price: 8500, category: 'LTO Course', description: 'Training for trucks, buses, and heavy vehicles', type: 'practical' },
        { id: 'DC-005', name: 'Comprehensive Driving Course', duration: '23 hours', price: 7500, category: 'Package', description: 'TDC + PDC Light Vehicle combined', type: 'package' },
        { id: 'DC-006', name: 'Heavy Equipment Operation - Backhoe', duration: '40 hours', price: 15000, category: 'Heavy Equipment', description: 'Backhoe loader operation training', type: 'practical' },
        { id: 'DC-007', name: 'Heavy Equipment Operation - Excavator', duration: '40 hours', price: 18000, category: 'Heavy Equipment', description: 'Excavator operation and safety training', type: 'practical' },
        { id: 'DC-008', name: 'Heavy Equipment Operation - Bulldozer', duration: '40 hours', price: 16000, category: 'Heavy Equipment', description: 'Bulldozer/crawler operation training', type: 'practical' },
        { id: 'DC-009', name: 'Heavy Equipment Operation - Crane', duration: '40 hours', price: 20000, category: 'Heavy Equipment', description: 'Crane operation certification course', type: 'practical' },
        { id: 'DC-010', name: 'Forklift Operation', duration: '24 hours', price: 10000, category: 'Heavy Equipment', description: 'Forklift and warehouse equipment operation', type: 'practical' },
        { id: 'DC-011', name: 'Defensive Driving Course', duration: '8 hours', price: 3000, category: 'Advanced', description: 'Hazard perception & prevention techniques', type: 'classroom' },
        { id: 'DC-012', name: 'Fleet Driver Safety Training', duration: '16 hours', price: 6000, category: 'Corporate', description: 'For company fleet drivers — safety-focused training', type: 'classroom' }
    ],
    students: [],
    enrollments: [],
    instructors: [],
    trainingVehicles: [],
    drivingSchedules: [],
    certificates: [],

    // ============================================================
    //  MEGATESTING - TESTING CENTER
    // ============================================================
    testServices: [
        { id: 'TS-001', name: 'Concrete Compressive Strength Test', price: 450, category: 'Concrete', turnaround: '7 days', standard: 'ASTM C39', description: 'Cylinder/cube compressive strength testing' },
        { id: 'TS-002', name: 'Concrete Cylinder Curing & Testing', price: 600, category: 'Concrete', turnaround: '28 days', standard: 'ASTM C31/C39', description: 'Curing and testing of concrete cylinders at 7 & 28 days' },
        { id: 'TS-003', name: 'Soil CBR Test (California Bearing Ratio)', price: 3500, category: 'Soil', turnaround: '5 days', standard: 'ASTM D1883', description: 'Subgrade soil bearing capacity test' },
        { id: 'TS-004', name: 'Soil Compaction Test (Proctor)', price: 2500, category: 'Soil', turnaround: '3 days', standard: 'ASTM D698/D1557', description: 'Modified/Standard Proctor compaction test' },
        { id: 'TS-005', name: 'Sieve Analysis (Gradation)', price: 1200, category: 'Aggregates', turnaround: '2 days', standard: 'ASTM C136', description: 'Particle size distribution analysis' },
        { id: 'TS-006', name: 'Specific Gravity Test', price: 800, category: 'Aggregates', turnaround: '2 days', standard: 'ASTM C127/C128', description: 'Specific gravity and absorption of aggregates' },
        { id: 'TS-007', name: 'Los Angeles Abrasion Test', price: 2000, category: 'Aggregates', turnaround: '3 days', standard: 'ASTM C131', description: 'Aggregate resistance to abrasion & impact' },
        { id: 'TS-008', name: 'Steel Rebar Tensile Test', price: 1500, category: 'Steel', turnaround: '3 days', standard: 'ASTM A615', description: 'Tensile strength, yield, and elongation of rebar' },
        { id: 'TS-009', name: 'Steel Rebar Bend Test', price: 800, category: 'Steel', turnaround: '2 days', standard: 'ASTM A615', description: 'Cold bend test for deformed bars' },
        { id: 'TS-010', name: 'Asphalt Extraction Test', price: 2500, category: 'Asphalt', turnaround: '3 days', standard: 'ASTM D2172', description: 'Bitumen content and aggregate gradation' },
        { id: 'TS-011', name: 'Field Density Test (Sand Cone)', price: 1800, category: 'Soil', turnaround: '1 day', standard: 'ASTM D1556', description: 'In-place density of compacted soil' },
        { id: 'TS-012', name: 'Core Drilling & Testing', price: 3000, category: 'Concrete', turnaround: '5 days', standard: 'ASTM C42', description: 'Concrete core extraction and compressive test' },
        { id: 'TS-013', name: 'Water Quality Test', price: 2000, category: 'Water', turnaround: '5 days', standard: 'PNSDW', description: 'Physical, chemical, and bacteriological water testing' },
        { id: 'TS-014', name: 'Marshall Stability Test', price: 3500, category: 'Asphalt', turnaround: '5 days', standard: 'ASTM D6927', description: 'Asphalt mix stability and flow testing' },
        { id: 'TS-015', name: 'Atterberg Limits Test', price: 1500, category: 'Soil', turnaround: '3 days', standard: 'ASTM D4318', description: 'Liquid limit, plastic limit, plasticity index' }
    ],
    testOrders: [],
    testSamples: [],
    testResults: [],
    labEquipment: [],
    qualityReviews: [],

    // ============================================================
    //  EMPLOYEES & PAYROLL
    // ============================================================
    employees: [],
    payslips: [],
    attendanceRecords: [],
    payrollRecords: [],
    workSchedules: [],
    timesheets: [],
    performanceReviews: [],
    incidentReports: [],

    // ============================================================
    //  INVENTORY (Universal)
    // ============================================================
    inventoryItems: [],
    inventoryTransactions: [],
    posTransactions: [],
    birInvoices: [],

    // ============================================================
    //  ISO & QUALITY MANAGEMENT
    // ============================================================
    isoDocuments: [],
    isoAudits: [],
    isoNcrs: [],
    isoCAPAs: [],

    // ============================================================
    //  SYSTEM & LOGS
    // ============================================================
    activityLog: [],
    notifications: [],
    users: [],
    auditLog: [],
    interactions: [],

    // ============================================================
    //  FINANCIAL - CHART OF ACCOUNTS & REVENUE
    // ============================================================
    monthlyRevenue: {
        sjc: [0,0,0,0,0,0,0,0,0,0,0,0],
        erlandia: [0,0,0,0,0,0,0,0,0,0,0,0],
        nancys: [0,0,0,0,0,0,0,0,0,0,0,0],
        crushing: [0,0,0,0,0,0,0,0,0,0,0,0],
        mileage: [0,0,0,0,0,0,0,0,0,0,0,0],
        megatesting: [0,0,0,0,0,0,0,0,0,0,0,0]
    },

    activityLog: [],
    notifications: [],

    // ============================================================
    //  INVENTORY CATEGORIES
    // ============================================================
    inventoryCategories: {
        construction: ['Cement', 'Steel', 'Lumber', 'Sand & Gravel', 'Paint', 'Electrical', 'Plumbing', 'Tools', 'PPE', 'Office Supplies'],
        subdivision: ['Construction Materials', 'Landscaping', 'Electrical', 'Plumbing', 'Amenity Supplies'],
        commercial: ['Maintenance Supplies', 'Cleaning', 'Electrical', 'Office Supplies'],
        quarry: ['Fuel & Lubricants', 'Spare Parts', 'PPE', 'Tools', 'Office Supplies'],
        driving_school: ['Training Materials', 'Vehicle Parts', 'Fuel', 'Office Supplies', 'Safety Equipment'],
        testing_lab: ['Lab Chemicals', 'Lab Equipment Parts', 'Molds & Forms', 'Calibration Standards', 'Office Supplies', 'PPE']
    },

    // ============================================================
    //  FINANCIAL SUMMARY METHODS
    // ============================================================
    getFinancialSummary(company = 'all') {
        const filter = (items) => company === 'all' ? items : items.filter(i => (i.companyId || i.company) === company);
        const invs = filter(this.invoices);
        const exps = filter(this.expenses);
        const totalRevenue = invs.reduce((s, i) => s + (i.paid || 0), 0);
        const totalReceivable = invs.reduce((s, i) => s + ((i.amount || 0) - (i.paid || 0)), 0);
        const totalExpenses = exps.reduce((s, e) => s + (e.amount || 0), 0);
        return {
            totalRevenue, totalReceivable, totalExpenses,
            netIncome: totalRevenue - totalExpenses,
            invoiceCount: invs.length,
            paidInvoices: invs.filter(i => i.status === 'paid').length,
            unpaidInvoices: invs.filter(i => i.status === 'unpaid').length,
            partialInvoices: invs.filter(i => i.status === 'partial').length
        };
    },

    getCompanySummary(companyId) {
        const fin = this.getFinancialSummary(companyId);
        const company = this.companies[companyId];
        let extra = {};

        if (company.type === 'construction') {
            const projs = this.projects.filter(p => p.company === companyId);
            extra = {
                activeProjects: projs.filter(p => p.status === 'in-progress').length,
                totalProjects: projs.length,
                metricLabel: 'Active Projects',
                metricValue: projs.filter(p => p.status === 'in-progress').length
            };
        } else if (company.type === 'subdivision') {
            extra = {
                totalLots: this.lots.length,
                soldLots: this.lots.filter(l => l.status === 'sold').length,
                availableLots: this.lots.filter(l => l.status === 'available').length,
                metricLabel: 'Total Lots',
                metricValue: this.lots.length
            };
        } else if (company.type === 'commercial') {
            extra = {
                totalSpaces: this.commercialSpaces.length,
                occupiedSpaces: this.commercialSpaces.filter(s => s.status === 'occupied').length,
                vacantSpaces: this.commercialSpaces.filter(s => s.status === 'vacant').length,
                metricLabel: 'Occupied Spaces',
                metricValue: this.commercialSpaces.filter(s => s.status === 'occupied').length
            };
        } else if (company.type === 'quarry') {
            extra = {
                totalProducts: this.aggregateProducts.length,
                pendingOrders: this.crushingOrders.filter(o => o.status === 'pending').length,
                metricLabel: 'Product Types',
                metricValue: this.aggregateProducts.length
            };
        } else if (company.type === 'driving_school') {
            extra = {
                totalStudents: this.students.length,
                activeEnrollments: this.enrollments.filter(e => e.status === 'enrolled').length,
                coursesOffered: this.drivingCourses.length,
                metricLabel: 'Active Students',
                metricValue: this.enrollments.filter(e => e.status === 'enrolled').length
            };
        } else if (company.type === 'testing_lab') {
            extra = {
                totalOrders: this.testOrders.length,
                pendingTests: this.testOrders.filter(o => o.status === 'pending' || o.status === 'in-progress').length,
                completedTests: this.testOrders.filter(o => o.status === 'completed').length,
                metricLabel: 'Pending Tests',
                metricValue: this.testOrders.filter(o => o.status === 'pending' || o.status === 'in-progress').length
            };
        }
        return { ...fin, ...extra, company };
    }
};
