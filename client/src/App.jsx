import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users, CalendarCheck, LayoutDashboard, Plus, Search, Pencil, Trash2,
  X, CheckCircle2, AlertCircle, RefreshCw, Building2, Wallet, UserRound
} from "lucide-react";

const API = "http://localhost:5000/api";
const emptyForm = { name: "", email: "", department: "Engineering", position: "", salary: "", joiningDate: "" };
const today = () => new Date().toLocaleDateString("en-CA");

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(today());
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const notify = (text, isError = false) => {
    setMessage(isError ? "" : text);
    setError(isError ? text : "");
    window.setTimeout(() => { setMessage(""); setError(""); }, 3500);
  };

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setEmployees(await request("/employees"));
    } catch (e) {
      notify(`${e.message}. Check that backend is running on port 5000.`, true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    try {
      setAttendance(await request(`/attendance?date=${encodeURIComponent(attendanceDate)}`));
    } catch (e) {
      notify(e.message, true);
    }
  }, [attendanceDate]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const attendanceByEmployee = useMemo(() => {
    const map = new Map();
    attendance.forEach((r) => {
      const id = r.employee?._id || r.employee;
      if (id) map.set(String(id), r);
    });
    return map;
  }, [attendance]);

  const filteredEmployees = employees.filter((e) =>
    [e.name, e.email, e.department, e.position].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, joiningDate: today() });
    setShowForm(true);
  };

  const openEdit = (employee) => {
    setEditing(employee._id);
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      department: employee.department || "Engineering",
      position: employee.position || "",
      salary: employee.salary ?? "",
      joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : ""
    });
    setShowForm(true);
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...form, salary: Number(form.salary) };
      if (payload.joiningDate) payload.joiningDate = new Date(`${payload.joiningDate}T00:00:00`).toISOString();
      else delete payload.joiningDate;
      if (editing) await request(`/employees/${editing}`, { method: "PUT", body: JSON.stringify(payload) });
      else await request("/employees", { method: "POST", body: JSON.stringify(payload) });
      setShowForm(false);
      notify(editing ? "Employee updated successfully." : "Employee added successfully.");
      await loadEmployees();
    } catch (e) { notify(e.message, true); }
  };

  const deleteEmployee = async (employee) => {
    if (!window.confirm(`Delete ${employee.name}? This also deletes their attendance records.`)) return;
    try {
      await request(`/employees/${employee._id}`, { method: "DELETE" });
      notify("Employee deleted.");
      await loadEmployees();
      await loadAttendance();
    } catch (e) { notify(e.message, true); }
  };

  const markAttendance = async (employeeId, status) => {
    try {
      await request("/attendance", {
        method: "POST",
        body: JSON.stringify({ employeeId, date: attendanceDate, status })
      });
      await loadAttendance();
      notify("Attendance saved.");
    } catch (e) { notify(e.message, true); }
  };

  const presentCount = attendance.filter((r) => r.status === "Present").length;
  const absentCount = attendance.filter((r) => r.status === "Absent").length;
  const leaveCount = attendance.filter((r) => r.status === "On Leave").length;

  const nav = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Employees", icon: Users },
    { name: "Attendance", icon: CalendarCheck }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><Users size={22} /></div><div><strong>StaffSync</strong><small>PEOPLE MANAGEMENT</small></div></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{nav.map(({ name, icon: Icon }) => (
          <button key={name} className={`nav-item ${page === name ? "active" : ""}`} onClick={() => setPage(name)}>
            <Icon size={18} /><span>{name}</span>{name === "Employees" && <span className="nav-count">{employees.length}</span>}
          </button>
        ))}</nav>
        <div className="sidebar-bottom"><div className="avatar">HR</div><div><strong>HR Admin</strong><small>Administrator</small></div><span className="online-dot" /></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          <div className="top-actions"><span className="status-dot" /> <span>System online</span><div className="top-avatar">HR</div></div>
        </header>

        <div className="content">
          {(message || error) && <div className={`toast ${error ? "toast-error" : ""}`}><span>{error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}</span>{error || message}<button onClick={() => { setMessage(""); setError(""); }}><X size={16} /></button></div>}

          <div className="page-heading">
            <div><div className="eyebrow">HUMAN RESOURCES</div><h1>{page === "Dashboard" ? "Good to see you, HR Admin" : page === "Employees" ? "Employee directory" : "Attendance management"}</h1>
            <p>{page === "Dashboard" ? "Here's what's happening across your organization today." : page === "Employees" ? "Manage your people, roles, and employee information." : "Record and review daily employee attendance."}</p></div>
            {page === "Employees" && <button className="primary-btn" onClick={openAdd}><Plus size={18} /> Add employee</button>}
          </div>

          {page === "Dashboard" && <>
            <div className="stats-grid">
              <StatCard icon={Users} label="Total employees" value={employees.length} hint="Active employee records" tone="blue" />
              <StatCard icon={CalendarCheck} label="Present today" value={presentCount} hint={`${attendanceDate} attendance`} tone="green" />
              <StatCard icon={Building2} label="Departments" value={new Set(employees.map(e => e.department)).size} hint="Across the organization" tone="purple" />
              <StatCard icon={Wallet} label="Monthly payroll" value={formatMoney(employees.reduce((sum, e) => sum + Number(e.salary || 0), 0))} hint="Sum of listed salaries" tone="orange" />
            </div>
            <div className="dashboard-grid">
              <section className="panel"><div className="panel-heading"><div><h2>Recent employees</h2><p>Your latest employee records</p></div><button className="text-btn" onClick={() => setPage("Employees")}>View all</button></div>
                {employees.length === 0 ? <EmptyState title="No employees yet" detail="Add your first employee to get started." action={openAdd} /> :
                  <div className="recent-list">{employees.slice(0, 5).map(e => <div className="recent-row" key={e._id}><div className="person-avatar">{initials(e.name)}</div><div className="person-info"><strong>{e.name}</strong><small>{e.position} · {e.department}</small></div><span className="pill pill-active">Active</span></div>)}</div>}
              </section>
              <section className="panel"><div className="panel-heading"><div><h2>Today's attendance</h2><p>Daily team overview</p></div><button className="icon-btn" onClick={loadAttendance} title="Refresh"><RefreshCw size={17} /></button></div>
                <div className="attendance-summary"><div><span className="summary-mark present-mark">✓</span><span>Present</span><strong>{presentCount}</strong></div><div><span className="summary-mark absent-mark">×</span><span>Absent</span><strong>{absentCount}</strong></div><div><span className="summary-mark leave-mark">•</span><span>On leave</span><strong>{leaveCount}</strong></div></div>
                <button className="secondary-btn full-btn" onClick={() => setPage("Attendance")}>Manage attendance <CalendarCheck size={16} /></button>
              </section>
            </div>
          </>}

          {page === "Employees" && <section className="panel">
            <div className="table-toolbar"><div><h2>All employees <span className="count-chip">{employees.length}</span></h2><p>Search and manage employee details</p></div><div className="search-box"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." /></div></div>
            {loading ? <div className="loading"><RefreshCw className="spin" /> Loading employees...</div> : filteredEmployees.length === 0 ? <EmptyState title="No employees found" detail={employees.length ? "Try a different search." : "Add an employee to populate this list."} action={openAdd} /> :
              <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>POSITION</th><th>SALARY</th><th>JOINING DATE</th><th>ACTIONS</th></tr></thead><tbody>
                {filteredEmployees.map(e => <tr key={e._id}><td><div className="table-person"><div className="person-avatar">{initials(e.name)}</div><div><strong>{e.name}</strong><small>{e.email}</small></div></div></td><td>{e.department}</td><td>{e.position}</td><td>{formatMoney(e.salary)}</td><td>{formatDate(e.joiningDate)}</td><td><div className="action-group"><button className="icon-btn edit-btn" onClick={() => openEdit(e)} title="Edit"><Pencil size={16} /></button><button className="icon-btn delete-btn" onClick={() => deleteEmployee(e)} title="Delete"><Trash2 size={16} /></button></div></td></tr>)}
              </tbody></table></div>}
          </section>}

          {page === "Attendance" && <section className="panel">
            <div className="attendance-toolbar"><div><h2>Daily attendance</h2><p>Select a date and set a status for each employee.</p></div><label className="date-field"><CalendarCheck size={17} /><input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></label></div>
            <div className="attendance-cards"><div className="attendance-card"><span className="mini-icon green"><CheckCircle2 size={17} /></span><div><small>Present</small><strong>{presentCount}</strong></div></div><div className="attendance-card"><span className="mini-icon red"><X size={17} /></span><div><small>Absent</small><strong>{absentCount}</strong></div></div><div className="attendance-card"><span className="mini-icon amber"><CalendarCheck size={17} /></span><div><small>On leave</small><strong>{leaveCount}</strong></div></div></div>
            {employees.length === 0 ? <EmptyState title="No employees available" detail="Add employees first, then mark attendance." action={openAdd} /> :
              <div className="table-wrap"><table><thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>DATE</th><th>STATUS</th><th>MARK ATTENDANCE</th></tr></thead><tbody>
                {employees.map(e => { const rec = attendanceByEmployee.get(String(e._id)); return <tr key={e._id}><td><div className="table-person"><div className="person-avatar">{initials(e.name)}</div><div><strong>{e.name}</strong><small>{e.email}</small></div></div></td><td>{e.department}</td><td>{formatDate(attendanceDate)}</td><td><span className={`status-pill ${rec ? statusClass(rec.status) : "status-unmarked"}`}>{rec?.status || "Not marked"}</span></td><td><div className="status-actions"><button className={`status-btn present ${rec?.status === "Present" ? "selected" : ""}`} onClick={() => markAttendance(e._id, "Present")}>Present</button><button className={`status-btn absent ${rec?.status === "Absent" ? "selected" : ""}`} onClick={() => markAttendance(e._id, "Absent")}>Absent</button><button className={`status-btn leave ${rec?.status === "On Leave" ? "selected" : ""}`} onClick={() => markAttendance(e._id, "On Leave")}>On Leave</button></div></td></tr>; })}
              </tbody></table></div>}
          </section>}
          <footer>© 2026 StaffSync <span>Built for better people management</span></footer>
        </div>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
        <div className="modal"><div className="modal-heading"><div><div className="eyebrow">{editing ? "UPDATE RECORD" : "NEW RECORD"}</div><h2>{editing ? "Edit employee" : "Add employee"}</h2><p>Fill in the employee's information below.</p></div><button className="icon-btn" onClick={() => setShowForm(false)}><X size={19} /></button></div>
          <form onSubmit={saveEmployee}><div className="form-grid">
            <label>Full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rahul Sharma" /></label>
            <label>Email address<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" /></label>
            <label>Department<select required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}><option>Engineering</option><option>Human Resources</option><option>Finance</option><option>Marketing</option><option>Sales</option><option>Operations</option><option>Design</option><option>IT</option></select></label>
            <label>Position<input required value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="e.g. Software Developer" /></label>
            <label>Monthly salary (₹)<input required type="number" min="0" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="30000" /></label>
            <label>Joining date<input type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} /></label>
          </div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-btn">{editing ? "Save changes" : "Add employee"}</button></div></form>
        </div>
      </div>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>;
}
function EmptyState({ title, detail, action }) {
  return <div className="empty-state"><div className="empty-icon"><UserRound size={24} /></div><h3>{title}</h3><p>{detail}</p>{action && <button className="primary-btn" onClick={action}><Plus size={17} /> Add employee</button>}</div>;
}
function initials(name = "") { return name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "??"; }
function formatMoney(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0); }
function formatDate(value) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
function statusClass(status) { return status === "Present" ? "status-present" : status === "Absent" ? "status-absent" : "status-leave"; }
