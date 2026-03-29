/* ========================================
   SJC UBMS - Driving School Hub Module
   Mileage Dev't: Courses, Students, Enrollments, Instructors, Vehicles, Schedules, Certificates
   ======================================== */

const DrivingSchool = {
    renderCourses(container) {
        const courses = DataStore.drivingCourses;
        const categories = [...new Set(courses.map(c => c.category))];
        container.innerHTML = `
        <div class="section-header"><div><h2>Courses</h2><p>LTO-accredited driving courses &amp; heavy equipment training</p></div></div>

        ${categories.map(cat => `
            <h3 class="category-heading"><i class="fas ${cat==='TDC'?'fa-chalkboard':cat==='PDC'?'fa-car':cat==='Heavy Equipment'?'fa-truck-monster':'fa-shield-alt'}"></i>${cat}</h3>
            <div class="grid-3 mb-3">
                ${courses.filter(c => c.category === cat).map(c => `
                    <div class="card">
                        <div class="card-body">
                            <div class="service-card-top">
                                <span class="badge-tag badge-mileage">${c.category}</span>
                                <span class="service-price mileage">${Utils.formatCurrency(c.price)}</span>
                            </div>
                            <h4 class="service-name">${Utils.escapeHtml(c.name)}</h4>
                            <div class="service-meta">
                                <span><i class="fas fa-clock"></i> ${c.duration}</span>
                                <span><i class="fas fa-certificate"></i> ${c.ltoCompliant ? 'LTO Compliant' : 'Standard'}</span>
                            </div>
                            ${c.description ? `<p class="service-desc">${Utils.escapeHtml(c.description)}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}`;
    },

    renderStudents(container) {
        const students = DataStore.students;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Students</h2><p>${students.length} registered students</p></div>
            <button class="btn btn-primary" onclick="DrivingSchool.addStudent()"><i class="fas fa-plus"></i> Register Student</button>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${students.length === 0 ? '<div class="empty-state"><i class="fas fa-user-graduate"></i><h3>No Students Yet</h3></div>' :
            Utils.buildTable([
                { label: 'Student ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Name', render: r => Utils.escapeHtml(r.name) },
                { label: 'Contact', render: r => Utils.escapeHtml(r.phone || '-') },
                { label: 'Email', render: r => Utils.escapeHtml(r.email || '-') },
                { label: 'License Type', render: r => r.licenseType || '-' },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status||'active'}</span>` },
                { label: 'Registered', render: r => Utils.formatDate(r.dateRegistered || r.registeredDate) },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="DrivingSchool.editStudent('${r.id}')"><i class="fas fa-edit"></i></button>` }
            ], students)}
        </div></div>`;
    },

    addStudent() {
        App.showModal('Register Student', `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="stName" required></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="stPhone"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="stEmail"></div>
                <div class="form-group"><label>Address</label><input type="text" class="form-input" id="stAddress"></div>
                <div class="form-group"><label>Birthdate</label><input type="date" class="form-input" id="stBirth"></div>
                <div class="form-group"><label>License Type</label><select class="form-input" id="stLicense"><option>Student Permit</option><option>Non-Professional</option><option>Professional</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.saveStudent()">Register</button>`
        );
    },

    saveStudent() {
        const name = document.getElementById('stName')?.value?.trim();
        if (!name) { App.showToast('Name required', 'error'); return; }
        DataStore.students.push({
            id: Utils.generateId('STU'),
            name, phone: document.getElementById('stPhone')?.value?.trim() || '',
            email: document.getElementById('stEmail')?.value?.trim() || '',
            address: document.getElementById('stAddress')?.value?.trim() || '',
            birthdate: document.getElementById('stBirth')?.value || '',
            licenseType: document.getElementById('stLicense')?.value || 'Student Permit',
            status: 'active',
            registeredDate: new Date().toISOString()
        });
        Database.save(); App.closeModal(); App.showToast('Student registered');
        this.renderStudents(document.getElementById('mainContent'));
    },

    editStudent(id) {
        const s = DataStore.students.find(x => x.id === id);
        if (!s) return;
        App.showModal('Edit Student', `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="stName" value="${Utils.escapeHtml(s.name)}"></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="stPhone" value="${Utils.escapeHtml(s.phone||'')}"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-input" id="stEmail" value="${Utils.escapeHtml(s.email||'')}"></div>
                <div class="form-group"><label>License</label><select class="form-input" id="stLicense"><option ${s.licenseType==='Student Permit'?'selected':''}>Student Permit</option><option ${s.licenseType==='Non-Professional'?'selected':''}>Non-Professional</option><option ${s.licenseType==='Professional'?'selected':''}>Professional</option></select></div>
                <div class="form-group"><label>Status</label><select class="form-input" id="stStatus"><option value="active" ${s.status==='active'?'selected':''}>Active</option><option value="graduated" ${s.status==='graduated'?'selected':''}>Graduated</option><option value="inactive" ${s.status==='inactive'?'selected':''}>Inactive</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.updateStudent('${id}')">Update</button>`
        );
    },

    updateStudent(id) {
        const s = DataStore.students.find(x => x.id === id);
        if (!s) return;
        s.name = document.getElementById('stName')?.value?.trim() || s.name;
        s.phone = document.getElementById('stPhone')?.value?.trim() || '';
        s.email = document.getElementById('stEmail')?.value?.trim() || '';
        s.licenseType = document.getElementById('stLicense')?.value || s.licenseType;
        s.status = document.getElementById('stStatus')?.value || s.status;
        Database.save(); App.closeModal(); App.showToast('Student updated');
        this.renderStudents(document.getElementById('mainContent'));
    },

    renderEnrollments(container) {
        const enrollments = DataStore.enrollments;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Enrollments</h2><p>${enrollments.length} total enrollments</p></div>
            <button class="btn btn-primary" onclick="DrivingSchool.addEnrollment()"><i class="fas fa-plus"></i> New Enrollment</button>
        </div>
        <div class="grid-4 mb-3">
            <div class="stat-card"><div class="stat-header"><div class="stat-icon teal"><i class="fas fa-clipboard-check"></i></div></div><div class="stat-value">${enrollments.length}</div><div class="stat-label">Total</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon blue"><i class="fas fa-spinner"></i></div></div><div class="stat-value">${enrollments.filter(e=>e.status==='enrolled').length}</div><div class="stat-label">Active</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon green"><i class="fas fa-check"></i></div></div><div class="stat-value">${enrollments.filter(e=>e.status==='completed').length}</div><div class="stat-label">Completed</div></div>
            <div class="stat-card"><div class="stat-header"><div class="stat-icon orange"><i class="fas fa-peso-sign"></i></div></div><div class="stat-value">${Utils.formatCurrency(enrollments.reduce((s,e)=>s+(e.amountPaid||e.paid||0),0), true)}</div><div class="stat-label">Revenue</div></div>
        </div>
        <div class="card"><div class="card-body no-padding">
            ${Utils.buildTable([
                { label: 'ID', render: r => `<strong>${r.id}</strong>` },
                { label: 'Student', render: r => { const s = DataStore.students.find(st=>st.id===r.studentId); return s ? Utils.escapeHtml(s.name) : r.studentId; }},
                { label: 'Course', render: r => { const c = DataStore.drivingCourses.find(co=>co.id===r.courseId); return c ? Utils.escapeHtml(c.name) : r.courseId; }},
                { label: 'Instructor', render: r => { const i = DataStore.instructors.find(ins=>ins.id===r.instructorId); return i ? Utils.escapeHtml(i.name) : '-'; }},
                { label: 'Amount', render: r => Utils.formatCurrency(r.amountPaid || r.paid || 0) },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status}</span>` },
                { label: 'Date', render: r => Utils.formatDate(r.dateEnrolled) },
                { label: 'Actions', render: r => `<button class="btn btn-sm" onclick="DrivingSchool.editEnrollment('${r.id}')"><i class="fas fa-edit"></i></button>` }
            ], enrollments)}
        </div></div>`;
    },

    addEnrollment() {
        App.showModal('New Enrollment', `
            <div class="grid-2">
                <div class="form-group"><label>Student</label><select class="form-input" id="enStudent" required>${DataStore.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Course</label><select class="form-input" id="enCourse" required>${DataStore.drivingCourses.map(c=>`<option value="${c.id}">${c.name} (₱${c.price})</option>`).join('')}</select></div>
                <div class="form-group"><label>Instructor</label><select class="form-input" id="enInstructor"><option value="">Not Assigned</option>${DataStore.instructors.map(i=>`<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Amount Paid (₱)</label><input type="number" class="form-input" id="enAmount" min="0"></div>
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="enDate" value="${new Date().toISOString().split('T')[0]}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.saveEnrollment()">Enroll</button>`
        );
    },

    saveEnrollment() {
        const studentId = document.getElementById('enStudent')?.value;
        const courseId = document.getElementById('enCourse')?.value;
        if (!studentId || !courseId) { App.showToast('Student and course required', 'error'); return; }
        const amountPaid = parseFloat(document.getElementById('enAmount')?.value) || 0;
        const enrollDate = document.getElementById('enDate')?.value || new Date().toISOString().split('T')[0];
        DataStore.enrollments.push({
            id: Utils.generateId('ENR'),
            studentId, courseId,
            instructorId: document.getElementById('enInstructor')?.value || '',
            amountPaid,
            dateEnrolled: enrollDate,
            status: 'enrolled'
        });
        // Auto-create invoice for enrollment fee
        const student = DataStore.students.find(s => s.id === studentId);
        const course = DataStore.drivingCourses.find(c => c.id === courseId);
        if (student && amountPaid > 0) {
            const desc = course ? `Enrollment — ${course.name}` : 'Driving School Enrollment';
            DataStore.invoices.push({
                id: Utils.generateId('INV'),
                companyId: 'mileage',
                client: student.name,
                address: student.address || '',
                items: [{ description: desc, qty: 1, price: amountPaid, amount: amountPaid }],
                amount: amountPaid,
                status: 'unpaid',
                date: enrollDate,
                dueDate: enrollDate,
                createdAt: new Date().toISOString()
            });
        }
        Database.save(); App.closeModal(); App.showToast('Student enrolled');
        this.renderEnrollments(document.getElementById('mainContent'));
    },

    editEnrollment(id) {
        const e = DataStore.enrollments.find(x => x.id === id);
        if (!e) return;
        App.showModal('Update Enrollment', `
            <div class="grid-2">
                <div class="form-group"><label>Status</label><select class="form-input" id="enStatus">
                    <option value="enrolled" ${e.status==='enrolled'?'selected':''}>Enrolled</option>
                    <option value="in-progress" ${e.status==='in-progress'?'selected':''}>In Progress</option>
                    <option value="completed" ${e.status==='completed'?'selected':''}>Completed</option>
                    <option value="dropped" ${e.status==='dropped'?'selected':''}>Dropped</option>
                </select></div>
                <div class="form-group"><label>Instructor</label><select class="form-input" id="enInstructor"><option value="">Not Assigned</option>${DataStore.instructors.map(i=>`<option value="${i.id}" ${e.instructorId===i.id?'selected':''}>${i.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Amount Paid</label><input type="number" class="form-input" id="enAmount" value="${e.amountPaid||e.paid||0}"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.updateEnrollment('${id}')">Update</button>`
        );
    },

    updateEnrollment(id) {
        const e = DataStore.enrollments.find(x => x.id === id);
        if (!e) return;
        e.status = document.getElementById('enStatus')?.value || e.status;
        e.instructorId = document.getElementById('enInstructor')?.value || e.instructorId;
        e.amountPaid = parseFloat(document.getElementById('enAmount')?.value) || e.amountPaid;
        Database.save(); App.closeModal(); App.showToast('Enrollment updated');
        this.renderEnrollments(document.getElementById('mainContent'));
    },

    renderInstructors(container) {
        const instructors = DataStore.instructors;
        container.innerHTML = `
        <div class="section-header">
            <div><h2>Instructors</h2><p>${instructors.length} instructors</p></div>
            <button class="btn btn-primary" onclick="DrivingSchool.addInstructor()"><i class="fas fa-plus"></i> Add Instructor</button>
        </div>
        <div class="grid-3">
            ${instructors.length === 0 ? '<div class="card span-full"><div class="card-body"><div class="empty-state"><i class="fas fa-chalkboard-teacher"></i><h3>No Instructors</h3></div></div></div>' :
            instructors.map(i => `
                <div class="card">
                    <div class="card-body text-center">
                        <div class="avatar avatar-lg avatar-mileage"><i class="fas fa-user"></i></div>
                        <h4>${Utils.escapeHtml(i.name)}</h4>
                        <p class="text-sm text-muted">${Utils.escapeHtml(i.specialization || 'General')}</p>
                        <div class="card-actions-center">
                            <span class="badge-tag badge-neutral">${i.licenseNumber || 'N/A'}</span>
                            <span class="badge-tag ${Utils.getStatusClass(i.status)}">${i.status||'active'}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>`;
    },

    addInstructor() {
        App.showModal('Add Instructor', `
            <div class="grid-2">
                <div class="form-group"><label>Full Name</label><input type="text" class="form-input" id="insName" required></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-input" id="insPhone"></div>
                <div class="form-group"><label>License Number</label><input type="text" class="form-input" id="insLicense"></div>
                <div class="form-group"><label>Specialization</label><select class="form-input" id="insSpec"><option>TDC/PDC</option><option>Heavy Equipment</option><option>Motorcycle</option><option>Defensive Driving</option></select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.saveInstructor()">Save</button>`
        );
    },

    saveInstructor() {
        const name = document.getElementById('insName')?.value?.trim();
        if (!name) { App.showToast('Name required', 'error'); return; }
        DataStore.instructors.push({
            id: Utils.generateId('INS'),
            name, phone: document.getElementById('insPhone')?.value?.trim() || '',
            licenseNumber: document.getElementById('insLicense')?.value?.trim() || '',
            specialization: document.getElementById('insSpec')?.value || 'TDC/PDC',
            status: 'active'
        });
        Database.save(); App.closeModal(); App.showToast('Instructor added');
        this.renderInstructors(document.getElementById('mainContent'));
    },

    renderVehicles(container) {
        const vehicles = DataStore.trainingVehicles;
        container.innerHTML = `
        <div class="section-header"><div><h2>Training Vehicles</h2><p>${vehicles.length} vehicles in fleet</p></div>
            <button class="btn btn-primary" onclick="DrivingSchool.addVehicle()"><i class="fas fa-plus"></i> Add Vehicle</button></div>
        <div class="card"><div class="card-body no-padding">
            ${vehicles.length === 0 ? '<div class="empty-state"><i class="fas fa-bus"></i><h3>No Vehicles</h3><p>Register training vehicles here.</p></div>' :
            Utils.buildTable([
                { label: 'Vehicle', render: r => `<strong>${Utils.escapeHtml(r.name || r.make + ' ' + r.model)}</strong>` },
                { label: 'Plate', render: r => r.plateNumber || '-' },
                { label: 'Type', render: r => `<span class="badge-tag badge-neutral">${r.type||'-'}</span>` },
                { label: 'Year', render: r => r.year || '-' },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status||'available'}</span>` }
            ], vehicles)}
        </div></div>`;
    },

    addVehicle() {
        App.showModal('Add Training Vehicle', `
            <div class="grid-2">
                <div class="form-group"><label>Vehicle Name</label><input type="text" class="form-input" id="vhName" required></div>
                <div class="form-group"><label>Plate Number</label><input type="text" class="form-input" id="vhPlate"></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="vhType"><option>Motorcycle</option><option>Light Vehicle</option><option>Heavy Vehicle</option><option>Backhoe</option><option>Excavator</option><option>Bulldozer</option><option>Crane</option><option>Forklift</option></select></div>
                <div class="form-group"><label>Year</label><input type="number" class="form-input" id="vhYear" min="2000" max="2030"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.saveVehicle()">Save</button>`
        );
    },

    saveVehicle() {
        const name = document.getElementById('vhName')?.value?.trim();
        if (!name) { App.showToast('Name required', 'error'); return; }
        DataStore.trainingVehicles.push({
            id: Utils.generateId('VEH'),
            name, plateNumber: document.getElementById('vhPlate')?.value?.trim() || '',
            type: document.getElementById('vhType')?.value || 'Light Vehicle',
            year: document.getElementById('vhYear')?.value || '',
            status: 'available'
        });
        Database.save(); App.closeModal(); App.showToast('Vehicle added');
        this.renderVehicles(document.getElementById('mainContent'));
    },

    renderSchedules(container) {
        const schedules = DataStore.drivingSchedules;
        container.innerHTML = `
        <div class="section-header"><div><h2>Training Schedules</h2><p>${schedules.length} scheduled sessions</p></div>
            <button class="btn btn-primary" onclick="DrivingSchool.addSchedule()"><i class="fas fa-plus"></i> Add Schedule</button></div>
        <div class="card"><div class="card-body no-padding">
            ${schedules.length === 0 ? '<div class="empty-state"><i class="fas fa-calendar-alt"></i><h3>No Schedules</h3><p>Schedule training sessions for students.</p></div>' :
            Utils.buildTable([
                { label: 'Date', render: r => Utils.formatDate(r.date) },
                { label: 'Time', render: r => r.timeSlot || '-' },
                { label: 'Student', render: r => { const s = DataStore.students.find(st=>st.id===r.studentId); return s ? Utils.escapeHtml(s.name) : r.studentId||'-'; }},
                { label: 'Instructor', render: r => { const i = DataStore.instructors.find(ins=>ins.id===r.instructorId); return i ? Utils.escapeHtml(i.name) : '-'; }},
                { label: 'Type', render: r => r.sessionType || '-' },
                { label: 'Vehicle', render: r => r.vehicleId || '-' },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status||'scheduled'}</span>` }
            ], schedules)}
        </div></div>`;
    },

    addSchedule() {
        App.showModal('Add Schedule', `
            <div class="grid-2">
                <div class="form-group"><label>Date</label><input type="date" class="form-input" id="schDate" required></div>
                <div class="form-group"><label>Time</label><select class="form-input" id="schTime"><option>8:00 AM - 10:00 AM</option><option>10:00 AM - 12:00 PM</option><option>1:00 PM - 3:00 PM</option><option>3:00 PM - 5:00 PM</option></select></div>
                <div class="form-group"><label>Student</label><select class="form-input" id="schStudent">${DataStore.students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Instructor</label><select class="form-input" id="schInstructor">${DataStore.instructors.map(i=>`<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
                <div class="form-group"><label>Type</label><select class="form-input" id="schType"><option>TDC Classroom</option><option>PDC Behind-the-Wheel</option><option>Heavy Equipment Hands-on</option><option>Assessment</option></select></div>
                <div class="form-group"><label>Vehicle</label><select class="form-input" id="schVehicle"><option value="">N/A</option>${DataStore.trainingVehicles.map(v=>`<option value="${v.id}">${v.name}</option>`).join('')}</select></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.saveSchedule()">Save</button>`
        );
    },

    saveSchedule() {
        DataStore.drivingSchedules.push({
            id: Utils.generateId('SCH'),
            date: document.getElementById('schDate')?.value || '',
            timeSlot: document.getElementById('schTime')?.value || '',
            studentId: document.getElementById('schStudent')?.value || '',
            instructorId: document.getElementById('schInstructor')?.value || '',
            sessionType: document.getElementById('schType')?.value || '',
            vehicleId: document.getElementById('schVehicle')?.value || '',
            status: 'scheduled'
        });
        Database.save(); App.closeModal(); App.showToast('Schedule added');
        this.renderSchedules(document.getElementById('mainContent'));
    },

    renderCertificates(container) {
        const certs = DataStore.certificates || [];
        container.innerHTML = `
        <div class="section-header"><div><h2>Certificates</h2><p>${certs.length} certificates issued</p></div>
            <button class="btn btn-primary" onclick="DrivingSchool.issueCertificate()"><i class="fas fa-plus"></i> Issue Certificate</button></div>
        <div class="card"><div class="card-body no-padding">
            ${certs.length === 0 ? '<div class="empty-state"><i class="fas fa-certificate"></i><h3>No Certificates Issued</h3><p>Issue certificates for completed courses.</p></div>' :
            Utils.buildTable([
                { label: 'Cert No.', render: r => `<strong>${r.id}</strong>` },
                { label: 'Student', render: r => { const s = DataStore.students.find(st=>st.id===r.studentId); return s ? Utils.escapeHtml(s.name) : r.studentId; }},
                { label: 'Course', render: r => { const c = (DataStore.drivingCourses||DataStore.courses||[]).find(co=>co.id===r.courseId); return c ? Utils.escapeHtml(c.name) : r.courseId; }},
                { label: 'Issue Date', render: r => Utils.formatDate(r.issueDate) },
                { label: 'Expiry', render: r => r.expiryDate ? `<span class="badge-tag ${new Date(r.expiryDate) < new Date() ? 'badge-danger' : 'badge-success'}">${Utils.formatDate(r.expiryDate)}</span>` : '-' },
                { label: 'Status', render: r => `<span class="badge-tag ${Utils.getStatusClass(r.status)}">${r.status||'valid'}</span>` },
                { label: 'Actions', render: r => `
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="DrivingSchool.printLTOCertificate('${r.id}')" title="Print LTO Certificate"><i class="fas fa-print"></i></button>
                        <button class="btn btn-sm btn-secondary" onclick="DrivingSchool.revokeCertificate('${r.id}')" title="Revoke">${r.status==='revoked'?'<i class="fas fa-check"></i>':'<i class="fas fa-ban"></i>'}</button>
                    </div>` }
            ], certs)}
        </div></div>`;
    },

    issueCertificate() {
        const completedEnrollments = (DataStore.enrollments||[]).filter(e => e.status === 'completed');
        const courses = DataStore.drivingCourses || DataStore.courses || [];
        App.showModal('Issue LTO Driving Certificate', `
            <div class="grid-2">
                <div class="form-group"><label>Enrollment (Completed)</label>
                    <select class="form-input" id="certEnroll">
                        ${completedEnrollments.length === 0
                            ? '<option value="">No completed enrollments</option>'
                            : completedEnrollments.map(e => {
                                const s = DataStore.students.find(st=>st.id===e.studentId);
                                const c = courses.find(co=>co.id===e.courseId);
                                return `<option value="${e.id}" data-student="${e.studentId}" data-course="${e.courseId}">${s?.name||'?'} — ${c?.name||'?'}</option>`;
                            }).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Issue Date</label><input type="date" class="form-input" id="certDate" value="${Utils.today()}"></div>
                <div class="form-group"><label>Certificate Type</label>
                    <select class="form-input" id="certType">
                        <option value="TESDA-TDC">TESDA TDC — Theoretical Driving Course</option>
                        <option value="PDC">PDC — Practical Driving Course</option>
                        <option value="SMDC">SMDC — Defensive Driving Seminar</option>
                        <option value="completion">Completion Certificate</option>
                    </select>
                </div>
                <div class="form-group"><label>Validity (years)</label>
                    <select class="form-input" id="certValidity">
                        <option value="5">5 years</option>
                        <option value="3">3 years</option>
                        <option value="1">1 year</option>
                        <option value="0">No expiry</option>
                    </select>
                </div>
                <div class="form-group"><label>Instructor / Signatory</label><input type="text" class="form-input" id="certSignatory" placeholder="Name of authorized signatory"></div>
                <div class="form-group"><label>LTO Control No. (optional)</label><input type="text" class="form-input" id="certLTO" placeholder="e.g. LTO-2026-XXXXX"></div>
            </div>`,
            `<button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
             <button class="btn btn-primary" onclick="DrivingSchool.saveCertificate()">Issue Certificate</button>`
        );
    },

    saveCertificate() {
        const sel = document.getElementById('certEnroll');
        if (!sel?.value) { App.showToast('Select an enrollment.', 'error'); return; }
        const opt = sel.selectedOptions[0];
        const issueDate = document.getElementById('certDate')?.value || Utils.today();
        const validityYears = parseInt(document.getElementById('certValidity')?.value || '5');
        let expiryDate = '';
        if (validityYears > 0) {
            const d = new Date(issueDate);
            d.setFullYear(d.getFullYear() + validityYears);
            expiryDate = d.toISOString().split('T')[0];
        }
        if (!DataStore.certificates) DataStore.certificates = [];
        DataStore.certificates.push({
            id: Utils.generateId('CERT'),
            studentId: opt.dataset.student || '',
            courseId: opt.dataset.course || '',
            enrollmentId: sel.value,
            certType: document.getElementById('certType')?.value || 'completion',
            issueDate,
            expiryDate,
            signatory: document.getElementById('certSignatory')?.value?.trim() || '',
            ltoControlNo: document.getElementById('certLTO')?.value?.trim() || '',
            issuedBy: Auth.getName(),
            status: 'valid',
            createdAt: new Date().toISOString()
        });
        Database.save(); App.closeModal(); App.showToast('Certificate issued.');
        this.renderCertificates(document.getElementById('mainContent'));
    },

    revokeCertificate(id) {
        const cert = (DataStore.certificates||[]).find(c => c.id === id);
        if (!cert) return;
        if (cert.status === 'revoked') {
            cert.status = 'valid'; App.showToast('Certificate reinstated.', 'success');
        } else {
            if (!confirm('Revoke this certificate?')) return;
            cert.status = 'revoked'; App.showToast('Certificate revoked.', 'success');
        }
        Database.save();
        this.renderCertificates(document.getElementById('mainContent'));
    },

    printLTOCertificate(id) {
        const cert = (DataStore.certificates||[]).find(c => c.id === id);
        if (!cert) { App.showToast('Certificate not found.', 'error'); return; }
        const student = (DataStore.students||[]).find(s => s.id === cert.studentId);
        const courseList = DataStore.drivingCourses || DataStore.courses || [];
        const course = courseList.find(c => c.id === cert.courseId);
        const school = 'Mileage Development & Training Center Inc.';
        const schoolAddress = 'Tuguegarao City, Cagayan, Philippines';
        const certTypeLabel = {
            'TESDA-TDC': 'THEORETICAL DRIVING COURSE (TDC)',
            'PDC': 'PRACTICAL DRIVING COURSE (PDC)',
            'SMDC': 'SAFETY MANAGEMENT DRIVING COURSE (SMDC)',
            'completion': 'CERTIFICATE OF COMPLETION'
        }[cert.certType] || 'CERTIFICATE OF COMPLETION';

        const ltoRef = cert.ltoControlNo || cert.id;
        const html = `
<style>
  body { font-family: 'Times New Roman', serif; padding: 30px; background: #fff; }
  .cert-border { border: 12px double #1a3a6b; padding: 30px; min-height: 500px; position: relative; }
  .cert-inner { border: 2px solid #c8a415; padding: 20px; }
  .lto-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a3a6b; padding-bottom: 12px; margin-bottom: 16px; }
  .lto-logo { font-size: 28px; font-weight: 900; color: #1a3a6b; letter-spacing: 3px; }
  .school-name { text-align: center; font-size: 16px; font-weight: 700; color: #1a3a6b; line-height: 1.4; }
  .school-addr { text-align: center; font-size: 11px; color: #555; margin-bottom: 4px; }
  .cert-title { text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1a3a6b; margin: 20px 0 4px; text-transform: uppercase; }
  .cert-subtitle { text-align: center; font-size: 14px; letter-spacing: 2px; color: #c8a415; margin-bottom: 20px; border-top: 1px solid #c8a415; border-bottom: 1px solid #c8a415; padding: 6px 0; }
  .cert-body { text-align: center; font-size: 14px; line-height: 1.8; margin: 20px 0; }
  .recipient-name { font-size: 28px; font-weight: 700; font-style: italic; border-bottom: 2px solid #1a3a6b; display: inline-block; padding: 4px 40px; margin: 10px 0; color: #1a3a6b; }
  .course-name { font-size: 16px; font-weight: 700; text-transform: uppercase; margin: 10px 0; }
  .details-row { display: flex; justify-content: space-between; margin-top: 20px; font-size: 11px; }
  .sig-line { border-top: 1px solid #333; width: 180px; text-align: center; padding-top: 4px; }
  .controls { display: flex; justify-content: space-between; font-size: 10px; color: #888; margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; }
  .seal { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #1a3a6b; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #1a3a6b; text-align: center; line-height: 1.2; }
</style>
<div class="cert-border">
  <div class="cert-inner">
    <div class="lto-header">
      <div>
        <div class="lto-logo">LTO</div>
        <div style="font-size:9px;color:#555">Land Transportation Office<br>Accredited Driving School</div>
      </div>
      <div>
        <div class="school-name">${Utils.escapeHtml(school)}</div>
        <div class="school-addr">${Utils.escapeHtml(schoolAddress)}</div>
      </div>
      <div class="seal">OFFICIAL<br>SEAL</div>
    </div>

    <div class="cert-title">Certificate</div>
    <div class="cert-subtitle">of ${certTypeLabel}</div>

    <div class="cert-body">
      <p>This is to certify that</p>
      <div class="recipient-name">${student ? Utils.escapeHtml(student.name) : Utils.escapeHtml(cert.studentId)}</div>
      <p>has successfully completed the required ${Utils.escapeHtml(certTypeLabel)} pursuant to<br>
      <strong>Republic Act No. 10930</strong> (Road Safety Act) and <strong>DO 2017-39</strong><br>
      of the Land Transportation Office</p>
      ${course ? `<div class="course-name">${Utils.escapeHtml(course.name)} (${Utils.escapeHtml(course.code || '')})</div>` : ''}
      <p>on <strong>${new Date(cert.issueDate).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</strong></p>
      ${cert.expiryDate ? `<p style="font-size:12px;color:#c00">Valid until: <strong>${new Date(cert.expiryDate).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</strong></p>` : ''}
    </div>

    <div class="details-row">
      <div class="sig-line">
        <div style="height:40px;border-bottom:1px solid #333;margin-bottom:4px"></div>
        ${cert.signatory ? Utils.escapeHtml(cert.signatory) : 'School Director / Authorized Signatory'}
      </div>
      <div style="text-align:center;font-size:11px">
        <div><strong>LTO Control No.:</strong> ${Utils.escapeHtml(ltoRef)}</div>
        <div><strong>Certificate No.:</strong> ${Utils.escapeHtml(cert.id)}</div>
        ${student?.licenseNo ? `<div><strong>License No.:</strong> ${Utils.escapeHtml(student.licenseNo)}</div>` : ''}
      </div>
      <div class="sig-line">
        <div style="height:40px;border-bottom:1px solid #333;margin-bottom:4px"></div>
        Student Signature
      </div>
    </div>

    <div class="controls">
      <span>Issued by: ${Utils.escapeHtml(cert.issuedBy || 'Admin')}</span>
      <span>Generated: ${new Date().toLocaleDateString('en-PH')}</span>
    </div>
  </div>
</div>`;
        Utils.printPreview(html, `LTO Certificate — ${student?.name || cert.id}`, true);
    }
};
