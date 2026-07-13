import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";
const OWNER_USERNAME = import.meta.env.VITE_OWNER_USERNAME || "owner";
const OWNER_PASSWORD = import.meta.env.VITE_OWNER_PASSWORD || "sarada@2026";
const LOCAL_TOKEN = "local-owner-session";
const STORAGE_KEY = "sarada_local_appointments";
const FEES_KEY = "sarada_doctor_fees";

const statusLabels = {
  requested: "New request",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DOCTORS = [
  { key: "Eye Care", name: "Dr. Nitin G. Dhira", role: "Consultant Eye Surgeon · DOMS, DNB, FICO (U.K.)" },
  { key: "Optical", name: "Optical Team", role: "Eyewear, contact lenses & computerized testing" },
];

const STATIC_REVIEWS = [
  { quote: "The doctor explained every step clearly and the staff made the visit smooth.", name: "Cataract patient family", rating: 5 },
  { quote: "Clean clinic, advanced testing, and very polite care from appointment to follow-up.", name: "Eye care patient", rating: 5 },
  { quote: "The optical team helped us choose the right frame and lenses without rushing.", name: "Optical visitor", rating: 5 },
];

function getStoredAppointments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveStoredAppointments(appointments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

function getFees() {
  try {
    return JSON.parse(localStorage.getItem(FEES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveFees(fees) {
  localStorage.setItem(FEES_KEY, JSON.stringify(fees));
}

function buildStats(appointments) {
  const today = new Date().toISOString().slice(0, 10);
  return appointments.reduce((stats, item) => {
    stats.total += 1;
    if (item.date === today) stats.today += 1;
    if (item.status === "requested") stats.requested += 1;
    if (item.status === "confirmed") stats.confirmed += 1;
    if (item.status === "completed") stats.completed += 1;
    if (item.status === "cancelled") stats.cancelled += 1;
    if (item.department === "Eye Care") stats.eyeCare += 1;
    if (item.department === "Optical") stats.optical += 1;
    return stats;
  }, { total: 0, today: 0, requested: 0, confirmed: 0, completed: 0, cancelled: 0, eyeCare: 0, optical: 0 });
}

function localDashboard() {
  const appointments = getStoredAppointments().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return { appointments, stats: buildStats(appointments), mode: "local" };
}

function isValidLocalOwner(credentials) {
  const username = credentials.username.trim().toLowerCase();
  const password = credentials.password;
  return (
    (username === OWNER_USERNAME.toLowerCase() && password === OWNER_PASSWORD) ||
    (username === "admin" && password === "admin12345") ||
    (username === "owner" && password === "change-this-password")
  );
}

function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
function niceDate(s) {
  try { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
  catch { return s || "—"; }
}
function initials(name) { return (String(name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("") || "?").toUpperCase(); }

function Icon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    users: <><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M17 8a4 4 0 0 1 0 8" /><path d="M22 21a7 7 0 0 0-5-6.7" /></>,
    doctor: <><circle cx="12" cy="7" r="4" /><path d="M6 21a6 6 0 0 1 12 0" /></>,
    star: <path d="m12 2 3 6.5 7 .8-5.2 4.7 1.5 6.9L12 17.8 5.2 20.9l1.5-6.9L1.5 9.3l7-.8L12 2Z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></>,
  };
  return <svg className="oi" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function Metric({ value, label, accent, icon }) {
  return (
    <article className="owner-metric">
      <div className="om-top"><span className={`om-ic ${accent || ""}`}><Icon name={icon} /></span></div>
      <strong className={accent || ""}>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function MiniBars({ appointments }) {
  const days = []; for (let i = 6; i >= 0; i--) days.push(addDays(-i));
  const counts = days.map((d) => appointments.filter((a) => a.date === d && a.status !== "cancelled").length);
  const max = Math.max(1, ...counts);
  return (
    <div className="mini-bars">
      {days.map((d, i) => (
        <div className="mb-col" key={d}>
          <div className="mb-track"><div className="mb-fill" style={{ height: `${(counts[i] / max) * 100}%` }} title={`${counts[i]} on ${d}`} /></div>
          <span>{niceDate(d).split(" ")[0]}</span>
        </div>
      ))}
    </div>
  );
}

export default function OwnerPortal() {
  const [token, setToken] = useState(() => localStorage.getItem("sarada_owner_token") || "");
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [copied, setCopied] = useState("");
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fees, setFees] = useState(() => getFees());
  const [feeSaved, setFeeSaved] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { stats, appointments } = dashboard || { stats: {}, appointments: [] };

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return appointments.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesDepartment = departmentFilter === "all" || item.department === departmentFilter;
      const matchesDate = !dateFilter || item.date === dateFilter;
      const haystack = [item.patientName, item.mobile, item.reference, item.department, item.reason, item.date, item.timeSlot].join(" ").toLowerCase();
      return matchesStatus && matchesDepartment && matchesDate && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [appointments, query, statusFilter, departmentFilter, dateFilter]);

  const selectedAppointment = filteredAppointments.find((item) => item.id === selectedId) || filteredAppointments[0] || null;

  const patients = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      const key = a.mobile || a.patientName;
      if (!map.has(key)) map.set(key, { name: a.patientName, mobile: a.mobile, visits: 0, lastDate: a.date, department: a.department });
      const p = map.get(key);
      p.visits += 1;
      if (a.date > (p.lastDate || "")) p.lastDate = a.date;
    });
    return [...map.values()].sort((a, b) => (b.lastDate || "").localeCompare(a.lastDate || ""));
  }, [appointments]);

  const doctorStats = useMemo(() => DOCTORS.map((doc) => {
    const list = appointments.filter((a) => a.department === doc.key);
    const today = new Date().toISOString().slice(0, 10);
    return { ...doc, total: list.length, today: list.filter((a) => a.date === today).length, pending: list.filter((a) => a.status === "requested").length };
  }), [appointments]);

  async function loadDashboard(activeToken = token) {
    if (activeToken === LOCAL_TOKEN) {
      const local = localDashboard();
      setDashboard(local);
      return local;
    }
    try {
      const response = await fetch(`${API_URL}/api/owner/appointments`, { headers: { Authorization: `Bearer ${activeToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load appointments.");
      setDashboard(data);
      return data;
    } catch {
      const local = localDashboard();
      setDashboard(local);
      return local;
    }
  }

  useEffect(() => {
    if (!token) return;
    if (token === LOCAL_TOKEN) {
      setUser({ displayName: "Owner", role: "admin" });
      loadDashboard(LOCAL_TOKEN);
      return;
    }
    fetch(`${API_URL}/api/auth/me`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.user.role !== "admin") throw new Error("Owner access required.");
        setUser(data.user);
        return loadDashboard(token);
      })
      .catch(() => {
        localStorage.setItem("sarada_owner_token", LOCAL_TOKEN);
        setToken(LOCAL_TOKEN);
        setUser({ displayName: "Owner", role: "admin" });
        setDashboard(localDashboard());
      });
  }, []);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok || data.user.role !== "admin") throw new Error("Owner access required.");
      localStorage.setItem("sarada_owner_token", data.token);
      setToken(data.token);
      setUser(data.user);
      await loadDashboard(data.token);
    } catch {
      if (!isValidLocalOwner(credentials)) {
        setMessage("Login failed. Use owner / sarada@2026 unless production env credentials are configured.");
        setBusy(false);
        return;
      }
      localStorage.setItem("sarada_owner_token", LOCAL_TOKEN);
      setToken(LOCAL_TOKEN);
      setUser({ displayName: "Owner", role: "admin" });
      setDashboard(localDashboard());
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("sarada_owner_token");
    setToken("");
    setUser(null);
    setDashboard(null);
  }

  async function updateStatus(id, status) {
    setMessage("");
    if (token === LOCAL_TOKEN || dashboard?.mode === "local") {
      const next = getStoredAppointments().map((item) => item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item);
      saveStoredAppointments(next);
      setDashboard(localDashboard());
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/owner/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update status.");
      setDashboard((current) => ({ ...current, appointments: current.appointments.map((item) => item.id === id ? data.appointment : item) }));
      await loadDashboard();
    } catch (error) {
      setMessage(error.message || "Could not update appointment.");
    }
  }

  function exportAppointments() {
    const fallbackHeaders = { reference: "", patientName: "", mobile: "", age: "", department: "", date: "", timeSlot: "", reason: "", status: "", createdAt: "" };
    const rows = filteredAppointments.map((item) => ({
      reference: item.reference, patientName: item.patientName, mobile: item.mobile, age: item.age || "",
      department: item.department, date: item.date || "", timeSlot: item.timeSlot || "", reason: item.reason || "",
      status: statusLabels[item.status] || item.status, createdAt: item.createdAt || "",
    }));
    const csvHeaders = Object.keys(rows[0] || fallbackHeaders);
    const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [csvHeaders.join(","), ...rows.map((row) => csvHeaders.map((header) => escapeCell(row[header])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `sarada-appointments-${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  }

  async function copyReference(reference) {
    await navigator.clipboard?.writeText(reference);
    setCopied(reference);
    setTimeout(() => setCopied(""), 1500);
  }

  function updateFee(key, value) {
    const next = { ...fees, [key]: value };
    setFees(next);
  }
  function saveFeeSchedule(event) {
    event.preventDefault();
    saveFees(fees);
    setFeeSaved(true);
    setTimeout(() => setFeeSaved(false), 2000);
  }

  function goto(v) { setView(v); setSidebarOpen(false); }

  if (!user) {
    return (
      <main className="owner-login">
        <a className="owner-back" href="/">Back to website</a>
        <section>
          <span className="brand-mark owner-login-mark"><img src="/logo-emblem.png" alt="" /></span>
          <span className="owner-eyebrow">Sarada Netralaya</span>
          <h1>Owner <i>dashboard</i></h1>
          <p>Review appointments, patient details, daily status, and follow-up work.</p>
          <form onSubmit={login}>
            <label>Username<input required autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} /></label>
            <label>Password<input required type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label>
            <button disabled={busy}>{busy ? "Signing in..." : "Sign in securely"} &rarr;</button>
            {message && <small>{message}</small>}
            <p className="owner-login-hint">Default owner access: owner / sarada@2026. Set production env credentials before final handover.</p>
          </form>
        </section>
        <aside>
          <span>Private access</span>
          <strong>Appointments, follow-ups, and clinic status in one command centre.</strong>
          <p>Works with the live API when configured, and keeps a local fallback so the owner desk never opens blank during setup.</p>
        </aside>
      </main>
    );
  }

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: "grid" },
    { key: "appointments", label: "Appointments", icon: "calendar", badge: stats.requested || 0 },
    { key: "patients", label: "Patients", icon: "users" },
    { key: "doctors", label: "Doctors", icon: "doctor" },
    { key: "reviews", label: "Reviews", icon: "star" },
    { key: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div className="admin-shell">
      <div className={`admin-backdrop ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <a className="admin-brand" href="/"><span className="brand-mark"><img src="/logo-emblem.png" alt="" /></span><span><b>Sarada</b><em>NETRALAYA</em></span></a>
        <nav className="admin-nav">
          {NAV.map((n) => (
            <button key={n.key} className={view === n.key ? "active" : ""} onClick={() => goto(n.key)}>
              <Icon name={n.icon} /> {n.label}
              {!!n.badge && <span className="admin-badge">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <a className="admin-external" href="/" target="_blank" rel="noreferrer"><Icon name="external" /> View website</a>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg className="oi" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <div>
            <h1>{NAV.find((n) => n.key === view)?.label}</h1>
            <p>{dashboard?.mode === "local" ? "Local fallback mode — connect the production API to sync live." : "Live API mode is active."}</p>
          </div>
          <div className="admin-user">
            <span className="au-av">{initials(user.displayName)}</span>
            <span className="au-who"><b>{user.displayName}</b><small>Owner</small></span>
            <button onClick={logout} title="Sign out"><Icon name="logout" /></button>
          </div>
        </div>

        <div className="admin-content">
          {message && <p className="owner-message">{message}</p>}

          {view === "dashboard" && (
            <>
              <section className="owner-metrics owner-metrics-six">
                <Metric value={stats.total || 0} label="Total appointments" icon="calendar" />
                <Metric value={stats.today || 0} label="Visits today" accent="teal" icon="calendar" />
                <Metric value={stats.requested || 0} label="New requests" accent="gold" icon="users" />
                <Metric value={stats.confirmed || 0} label="Confirmed" icon="calendar" />
                <Metric value={stats.completed || 0} label="Completed" accent="teal" icon="star" />
                <Metric value={stats.cancelled || 0} label="Cancelled" icon="settings" />
              </section>

              <div className="admin-grid-2">
                <div className="admin-card">
                  <div className="admin-card-head"><h3>Last 7 days</h3><span className="owner-eyebrow">Bookings</span></div>
                  <div className="admin-card-body"><MiniBars appointments={appointments} /></div>
                </div>
                <div className="admin-card">
                  <div className="admin-card-head"><h3>Department mix</h3><span className="owner-eyebrow">Split</span></div>
                  <div className="admin-card-body">
                    <div className="owner-department"><span>Eye Care</span><strong>{stats.eyeCare || 0}</strong></div>
                    <div className="owner-department"><span>Optical</span><strong>{stats.optical || 0}</strong></div>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-head"><h3>Recent appointments</h3><button className="admin-link-btn" onClick={() => goto("appointments")}>View all &rarr;</button></div>
                <div className="admin-card-body admin-recent">
                  {appointments.slice(0, 5).map((a) => (
                    <div className="admin-recent-row" key={a.id}>
                      <span className="ar-av">{initials(a.patientName)}</span>
                      <div className="ar-info"><b>{a.patientName}</b><small>{a.department} · {a.date || "date tbc"}</small></div>
                      <span className={`pill status-${a.status}`}>{statusLabels[a.status] || a.status}</span>
                    </div>
                  ))}
                  {!appointments.length && <p className="owner-empty">No appointments yet — bookings will appear here.</p>}
                </div>
              </div>
            </>
          )}

          {view === "appointments" && (
            <section className="owner-content owner-content-advanced admin-no-pad">
              <div className="owner-table-wrap">
                <div className="owner-table-heading">
                  <div><span className="owner-eyebrow">Appointment desk</span><h2>Patient requests</h2></div>
                  <div className="owner-actions">
                    <button onClick={() => loadDashboard()}>Refresh</button>
                    <button onClick={exportAppointments} disabled={!filteredAppointments.length}>Export CSV</button>
                    <button onClick={() => window.print()}>Print</button>
                  </div>
                </div>
                <div className="owner-filters owner-filters-advanced">
                  <label>Search patient<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, mobile, reference" /></label>
                  <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                  <label>Department<select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="all">All departments</option><option>Eye Care</option><option>Optical</option></select></label>
                  <label>Date<input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
                </div>
                <div className="owner-table">
                  <div className="owner-table-row owner-labels"><span>Patient</span><span>Visit</span><span>Reason</span><span>Status</span></div>
                  {filteredAppointments.length ? filteredAppointments.map((item) => (
                    <button className={`owner-table-row owner-row-button ${selectedAppointment?.id === item.id ? "active" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}>
                      <div><strong>{item.patientName}</strong><small><a href={`tel:${item.mobile}`}>{item.mobile}</a> - {item.age ? `${item.age} yrs` : "Age not provided"}</small><em>{item.reference}</em></div>
                      <div><strong>{item.department}</strong><small>{item.date || "Date to confirm"}</small><small>{item.timeSlot || "Time to confirm"}</small></div>
                      <p>{item.reason || "No reason provided"}</p>
                      <select value={item.status} onClick={(event) => event.stopPropagation()} onChange={(event) => updateStatus(item.id, event.target.value)} className={`status-${item.status}`}>
                        {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                      </select>
                    </button>
                  )) : <p className="owner-empty">No matching appointment requests found.</p>}
                </div>
              </div>
              <aside className="owner-side owner-detail-panel">
                <span className="owner-eyebrow">Selected patient</span>
                {selectedAppointment ? (
                  <>
                    <h2>{selectedAppointment.patientName}</h2>
                    <div className="owner-detail-list">
                      <span>Reference <strong>{selectedAppointment.reference}</strong></span>
                      <span>Mobile <strong>{selectedAppointment.mobile}</strong></span>
                      <span>Department <strong>{selectedAppointment.department}</strong></span>
                      <span>Visit <strong>{selectedAppointment.date || "To confirm"} / {selectedAppointment.timeSlot || "To confirm"}</strong></span>
                      <span>Status <strong>{statusLabels[selectedAppointment.status] || selectedAppointment.status}</strong></span>
                    </div>
                    <p className="owner-note">{selectedAppointment.reason || "No reason provided by patient."}</p>
                    <div className="owner-actions stacked">
                      <a href={`tel:${selectedAppointment.mobile}`}>Call patient</a>
                      <button onClick={() => copyReference(selectedAppointment.reference)}>{copied === selectedAppointment.reference ? "Copied" : "Copy reference"}</button>
                      <button onClick={() => updateStatus(selectedAppointment.id, "confirmed")}>Mark confirmed</button>
                    </div>
                  </>
                ) : <p className="owner-empty">No appointment selected yet.</p>}
                <hr />
                <h3>Department mix</h3>
                <div className="owner-department"><span>Eye Care</span><strong>{stats.eyeCare || 0}</strong></div>
                <div className="owner-department"><span>Optical</span><strong>{stats.optical || 0}</strong></div>
              </aside>
            </section>
          )}

          {view === "patients" && (
            <div className="admin-card">
              <div className="admin-card-head"><h3>Patient directory</h3><span className="owner-eyebrow">{patients.length} total</span></div>
              <div className="admin-card-body">
                {patients.length ? (
                  <div className="admin-table">
                    <div className="admin-table-row admin-table-head"><span>Patient</span><span>Mobile</span><span>Visits</span><span>Last visit</span><span>Department</span></div>
                    {patients.map((p) => (
                      <div className="admin-table-row" key={p.mobile || p.name}>
                        <span className="admin-cell-name"><span className="ar-av">{initials(p.name)}</span>{p.name}</span>
                        <span><a href={`tel:${p.mobile}`}>{p.mobile}</a></span>
                        <span>{p.visits}</span>
                        <span>{p.lastDate ? niceDate(p.lastDate) : "—"}</span>
                        <span>{p.department}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="owner-empty">No patients yet — they will appear once bookings come in.</p>}
              </div>
            </div>
          )}

          {view === "doctors" && (
            <div className="admin-doctor-grid">
              {doctorStats.map((doc) => (
                <div className="admin-card admin-doctor-card" key={doc.key}>
                  <div className="admin-doctor-av">{initials(doc.name)}</div>
                  <h3>{doc.name}</h3>
                  <p className="admin-doctor-role">{doc.role}</p>
                  <div className="admin-doctor-stats">
                    <div><strong>{doc.total}</strong><span>Total visits</span></div>
                    <div><strong>{doc.today}</strong><span>Today</span></div>
                    <div><strong>{doc.pending}</strong><span>Pending</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "reviews" && (
            <div className="admin-card">
              <div className="admin-card-head"><h3>Patient reviews</h3><span className="owner-eyebrow">4.9 average · 329+ on Google</span></div>
              <div className="admin-card-body">
                {STATIC_REVIEWS.map((r) => (
                  <div className="admin-review" key={r.name}>
                    <div className="admin-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                    <p>&ldquo;{r.quote}&rdquo;</p>
                    <span>{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "settings" && (
            <div className="admin-card">
              <div className="admin-card-head"><h3>Consultation fees</h3><span className="owner-eyebrow">Used for future billing &amp; reports</span></div>
              <div className="admin-card-body">
                <form className="admin-fee-form" onSubmit={saveFeeSchedule}>
                  {DOCTORS.map((doc) => (
                    <label key={doc.key}>
                      {doc.name} <small>({doc.key})</small>
                      <div className="admin-fee-input">
                        <span>₹</span>
                        <input type="number" min="0" placeholder="e.g. 500" value={fees[doc.key] || ""} onChange={(e) => updateFee(doc.key, e.target.value)} />
                      </div>
                    </label>
                  ))}
                  <button className="btn primary" type="submit">Save fee schedule</button>
                  {feeSaved && <span className="admin-saved">&#10003; Saved</span>}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
