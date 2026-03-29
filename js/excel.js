/* ========================================
   SJC UBMS - Excel Export / Import Module
   Uses SheetJS (xlsx) loaded via CDN in index.html
   ======================================== */

const Excel = {

    // ── Entity definitions: label, DataStore key, and columns to export ──
    EXPORTS: {
        employees: {
            label: 'Employees',
            columns: ['id','name','position','department','companyId','payFrequency','monthlyRate','dailyRate','dateHired','phone','email','sssNo','philhealthNo','pagibigNo','tin','status']
        },
        payslips: {
            label: 'Payslips',
            columns: ['id','employeeId','companyId','period','basicPay','overtime','allowances','absences','sss','philhealth','pagibig','withholdingTax','grossPay','totalDeductions','netPay','date']
        },
        attendanceRecords: {
            label: 'Attendance',
            columns: ['id','employeeId','date','timeIn','timeOut','hoursWorked','overtimeHours','status','notes']
        },
        timesheets: {
            label: 'Timesheets',
            columns: ['id','employeeId','weekStart','weekEnd','regularHours','overtimeHours','status','remarks']
        },
        performanceReviews: {
            label: 'Performance Reviews',
            columns: ['id','employeeId','period','reviewDate','overallRating','recommendation','comments','reviewerName']
        },
        incidentReports: {
            label: 'Incidents',
            columns: ['id','employeeId','date','type','severity','description','correctiveAction','status','filedBy']
        },
        customers: {
            label: 'Customers',
            columns: ['id','name','companyId','phone','email','address','tin','type','status','createdAt']
        },
        invoices: {
            label: 'Invoices',
            columns: ['id','customerId','companyId','invoiceNo','date','dueDate','amount','tax','total','status','description']
        },
        expenses: {
            label: 'Expenses',
            columns: ['id','companyId','category','amount','date','description','reference']
        },
        projects: {
            label: 'Projects',
            columns: ['id','name','companyId','client','startDate','endDate','budget','status','description']
        },
        lots: {
            label: 'Lots',
            columns: ['id','lotNo','block','phase','companyId','area','price','status','notes']
        },
        homeowners: {
            label: 'Homeowners',
            columns: ['id','name','lotId','companyId','phone','email','dateAcquired','status']
        },
        lotPayments: {
            label: 'Lot Payments',
            columns: ['id','homeownerId','lotId','companyId','amount','date','type','reference']
        },
        spaces: {
            label: 'Rental Spaces',
            columns: ['id','name','companyId','floor','area','monthlyRate','status']
        },
        tenants: {
            label: 'Tenants',
            columns: ['id','name','companyId','phone','email','business','status']
        },
        leases: {
            label: 'Leases',
            columns: ['id','tenantId','spaceId','companyId','startDate','endDate','monthlyRent','deposit','status']
        },
        rentalPayments: {
            label: 'Rental Payments',
            columns: ['id','leaseId','tenantId','companyId','amount','date','forMonth','type','reference']
        },
        quarryProducts: {
            label: 'Quarry Products',
            columns: ['id','name','companyId','unit','pricePerUnit','category','stock']
        },
        quarryOrders: {
            label: 'Quarry Orders',
            columns: ['id','customerId','companyId','orderDate','deliveryDate','products','total','status']
        },
        students: {
            label: 'Students',
            columns: ['id','name','companyId','phone','email','licenseNo','birthday','address','status','createdAt']
        },
        enrollments: {
            label: 'Enrollments',
            columns: ['id','studentId','courseId','companyId','enrollDate','startDate','endDate','fee','status']
        },
        courses: {
            label: 'Courses',
            columns: ['id','name','companyId','code','duration','fee','description','status']
        },
        inventoryItems: {
            label: 'Inventory',
            columns: ['id','name','companyId','category','unit','costPrice','sellingPrice','quantity','reorderPoint','location']
        },
        testOrders: {
            label: 'Lab Test Orders',
            columns: ['id','clientId','companyId','orderDate','dueDate','tests','total','status']
        },
    },

    // ── Export one entity to Excel ────────────────────────────────
    exportSheet(key) {
        if (typeof XLSX === 'undefined') { App.showToast('SheetJS not loaded.', 'error'); return; }
        const def = this.EXPORTS[key];
        if (!def) { App.showToast('Unknown entity.', 'error'); return; }
        const company = App.currentCompany;
        let data = DataStore[key] || [];
        if (company) data = data.filter(r => r.companyId === company || !r.companyId);
        if (data.length === 0) { App.showToast(`No ${def.label} data to export.`, 'info'); return; }

        const rows = data.map(r => {
            const row = {};
            def.columns.forEach(col => { row[this._colLabel(col)] = r[col] !== undefined ? r[col] : ''; });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, def.label.substring(0, 31));
        const filename = `${def.label}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        App.showToast(`${def.label} exported: ${data.length} rows.`, 'success');
    },

    // ── Export ALL entities to a multi-sheet workbook ─────────────
    exportAll() {
        if (typeof XLSX === 'undefined') { App.showToast('SheetJS not loaded.', 'error'); return; }
        const company = App.currentCompany;
        const wb = XLSX.utils.book_new();
        let sheetsAdded = 0;

        Object.entries(this.EXPORTS).forEach(([key, def]) => {
            let data = DataStore[key] || [];
            if (company) data = data.filter(r => r.companyId === company || !r.companyId);
            if (data.length === 0) return;

            const rows = data.map(r => {
                const row = {};
                def.columns.forEach(col => { row[this._colLabel(col)] = r[col] !== undefined ? r[col] : ''; });
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, def.label.substring(0, 31));
            sheetsAdded++;
        });

        if (sheetsAdded === 0) { App.showToast('No data to export.', 'info'); return; }
        const companyLabel = company ? (DataStore.companies[company]?.name || company) : 'AllCompanies';
        const filename = `UBMS_Export_${companyLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        App.showToast(`Exported ${sheetsAdded} sheets.`, 'success');
    },

    // ── Import from Excel file ────────────────────────────────────
    importSheet(key, callback) {
        if (typeof XLSX === 'undefined') { App.showToast('SheetJS not loaded.', 'error'); return; }
        const def = this.EXPORTS[key];
        if (!def) { App.showToast('Unknown entity.', 'error'); return; }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => {
                try {
                    const wb2 = XLSX.read(new Uint8Array(evt.target.result), { type: 'array' });
                    const ws2 = wb2.Sheets[wb2.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(ws2, { defval: '' });
                    if (jsonData.length === 0) { App.showToast('No rows found in file.', 'error'); return; }
                    // Map back to camelCase keys
                    const labelToKey = {};
                    def.columns.forEach(col => { labelToKey[this._colLabel(col)] = col; });
                    const mapped = jsonData.map(r => {
                        const obj = { id: Utils.generateId(key.substring(0, 3).toUpperCase()) };
                        Object.entries(r).forEach(([label, val]) => {
                            const col = labelToKey[label] || label;
                            obj[col] = val;
                        });
                        return obj;
                    });

                    const mode = confirm(`Import ${mapped.length} rows into ${def.label}?\n\nOK = Append to existing\nCancel = Do nothing`);
                    if (!mode) return;

                    if (!DataStore[key]) DataStore[key] = [];
                    DataStore[key] = [...DataStore[key], ...mapped];
                    Database.save();
                    App.showToast(`Imported ${mapped.length} ${def.label} records.`, 'success');
                    if (callback) callback(mapped.length);
                } catch (err) {
                    App.showToast('Import failed: ' + err.message, 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    },

    // ── Show a modal with export/import options for a module ──────
    openExportDialog(entityKeys, title) {
        const items = (Array.isArray(entityKeys) ? entityKeys : [entityKeys]).filter(k => this.EXPORTS[k]);
        if (items.length === 0) { App.showToast('No exportable data defined for this module.', 'info'); return; }

        const rows = items.map(k => {
            const def = this.EXPORTS[k];
            const count = (DataStore[k] || []).length;
            return `
                <tr>
                    <td>${Utils.escapeHtml(def.label)}</td>
                    <td><span class="badge-tag badge-neutral">${count} records</span></td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-success" onclick="Excel.exportSheet('${k}')"><i class="fas fa-file-excel"></i> Export XLS</button>
                            <button class="btn btn-sm btn-secondary" onclick="Excel.importSheet('${k}', () => App.closeModal())"><i class="fas fa-upload"></i> Import</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        App.showModal(`Excel Export / Import — ${Utils.escapeHtml(title)}`, `
            <table style="width:100%;border-collapse:collapse">
                <thead><tr style="background:var(--bg-secondary)">
                    <th style="padding:8px;text-align:left">Entity</th>
                    <th style="padding:8px;text-align:left">Records</th>
                    <th style="padding:8px;text-align:left">Actions</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Close</button>
             <button class="btn btn-primary" onclick="Excel.exportAll()"><i class="fas fa-file-excel"></i> Export All (Full Backup)</button>`
        );
    },

    // ── Convenience: export a flat array as Excel immediately ─────
    exportArray(data, columns, filename) {
        if (typeof XLSX === 'undefined') { App.showToast('SheetJS not loaded.', 'error'); return; }
        if (!data || data.length === 0) { App.showToast('No data to export.', 'info'); return; }
        const rows = data.map(r => {
            const row = {};
            columns.forEach(col => {
                const key = col.key || col;
                const label = col.label || this._colLabel(key);
                row[label] = r[key] !== undefined ? r[key] : '';
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, filename || 'export.xlsx');
        App.showToast(`Exported ${data.length} rows.`, 'success');
    },

    // ── Internal: convert camelCase key to Title Case label ───────
    _colLabel(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    }
};
