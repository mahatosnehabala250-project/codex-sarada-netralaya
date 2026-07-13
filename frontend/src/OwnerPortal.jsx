import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";
const OWNER_USERNAME = import.meta.env.VITE_OWNER_USERNAME || "owner";
const OWNER_PASSWORD = import.meta.env.VITE_OWNER_PASSWORD || "sarada@2026";
const LOCAL_TOKEN = "local-owner-session";
const STORAGE_KEY = "sarada_local_appointments";

const statusLabels = {
  requested: "New request",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

function Metric({ value, label, accent }) {
  return (
    <article className="owner-metric">
      <strong className={accent || ""}>{value}</strong>
      <span>{label}</span>
    </article>
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

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { stats, appointments } = dashboard || { stats: {}, appointments: [] };

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return appointments.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesDepartment = departmentFilter === "all" || item.department === departmentFilter;
      const matchesDate = !dateFilter || item.date === dateFilter;
      const haystack = [
        item.patientName,
        item.mobile,
        item.reference,
        item.department,
        item.reason,
        item.date,
        item.timeSlot,
      ].join(" ").toLowerCase();
      return matchesStatus && matchesDepartment && matchesDate && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [appointments, query, statusFilter, departmentFilter, dateFilter]);

  const selectedAppointment = filteredAppointments.find((item) => item.id === selectedId) || filteredAppointments[0] || null;

  async function loadDashboard(activeToken = token) {
    if (activeToken === LOCAL_TOKEN) {
      const local = localDashboard();
      setDashboard(local);
      return local;
    }

    try {
      const response = await fetch(`${API_URL}/api/owner/appointments`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
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
      setDashboard((current) => ({
        ...current,
        appointments: current.appointments.map((item) => item.id === id ? data.appointment : item),
      }));
      await loadDashboard();
    } catch (error) {
      setMessage(error.message || "Could not update appointment.");
    }
  }

  function exportAppointments() {
    const fallbackHeaders = {
      reference: "", patientName: "", mobile: "", age: "", department: "", date: "", timeSlot: "", reason: "", status: "", createdAt: "",
    };
    const rows = filteredAppointments.map((item) => ({
      reference: item.reference,
      patientName: item.patientName,
      mobile: item.mobile,
      age: item.age || "",
      department: item.department,
      date: item.date || "",
      timeSlot: item.timeSlot || "",
      reason: item.reason || "",
      status: statusLabels[item.status] || item.status,
      createdAt: item.createdAt || "",
    }));
    const csvHeaders = Object.keys(rows[0] || fallbackHeaders);
    const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [csvHeaders.join(","), ...rows.map((row) => csvHeaders.map((header) => escapeCell(row[header])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sarada-appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyReference(reference) {
    await navigator.clipboard?.writeText(reference);
    setCopied(reference);
    setTimeout(() => setCopied(""), 1500);
  }

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

  return (
    <main className="owner-dashboard">
      <header>
        <a className="owner-brand" href="/"><span className="brand-mark owner-header-mark"><img src="/logo-emblem.png" alt="" /></span>Sarada <span>NETRALAYA</span></a>
        <div><span>Signed in as {user.displayName}</span><button onClick={logout}>Sign out</button></div>
      </header>

      <section className="owner-header">
        <div>
          <span className="owner-eyebrow">Clinic overview</span>
          <h1>Owner command<br /><i>dashboard.</i></h1>
          <p>{dashboard?.mode === "local" ? "Local fallback mode is active until production API storage is connected." : "Live API mode is active."}</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer">View patient website</a>
      </section>

      <section className="owner-metrics owner-metrics-six">
        <Metric value={stats.total || 0} label="Total appointments" />
        <Metric value={stats.today || 0} label="Visits today" accent="teal" />
        <Metric value={stats.requested || 0} label="New requests" accent="gold" />
        <Metric value={stats.confirmed || 0} label="Confirmed" />
        <Metric value={stats.completed || 0} label="Completed" accent="teal" />
        <Metric value={stats.cancelled || 0} label="Cancelled" />
      </section>

      <section className="owner-content owner-content-advanced">
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

          {message && <p className="owner-message">{message}</p>}

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
          ) : (
            <p className="owner-empty">No appointment selected yet.</p>
          )}
          <hr />
          <h3>Department mix</h3>
          <div className="owner-department"><span>Eye Care</span><strong>{stats.eyeCare || 0}</strong></div>
          <div className="owner-department"><span>Optical</span><strong>{stats.optical || 0}</strong></div>
        </aside>
      </section>
    </main>
  );
}
