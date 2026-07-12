import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const statusLabels = {
  requested: "New request",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { stats, appointments } = dashboard || { stats: {}, appointments: [] };

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return appointments.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const haystack = [
        item.patientName,
        item.mobile,
        item.reference,
        item.department,
        item.reason,
        item.date,
        item.timeSlot,
      ].join(" ").toLowerCase();
      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [appointments, query, statusFilter]);

  async function loadDashboard(activeToken = token) {
    const response = await fetch(`${API_URL}/api/owner/appointments`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load appointments.");
    setDashboard(data);
  }

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/auth/me`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.user.role !== "admin") throw new Error("Owner access required.");
        setUser(data.user);
        return loadDashboard(token);
      })
      .catch(() => logout());
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
      if (!response.ok || data.user.role !== "admin") {
        throw new Error("Only the hospital owner can access this dashboard.");
      }
      localStorage.setItem("sarada_owner_token", data.token);
      setToken(data.token);
      setUser(data.user);
      await loadDashboard(data.token);
    } catch (error) {
      setMessage(error.message || "Login failed.");
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
      reference: "",
      patientName: "",
      mobile: "",
      age: "",
      department: "",
      date: "",
      timeSlot: "",
      reason: "",
      status: "",
      createdAt: "",
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
    const csv = [
      csvHeaders.join(","),
      ...rows.map((row) => csvHeaders.map((header) => escapeCell(row[header])).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sarada-appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!user) {
    return (
      <main className="owner-login">
        <a className="owner-back" href="/">Back to website</a>
        <section>
          <span className="owner-eyebrow">Sarada Netralaya</span>
          <h1>Owner <i>dashboard</i></h1>
          <p>Review incoming appointments and keep your clinic day organised.</p>
          <form onSubmit={login}>
            <label>
              Username
              <input
                required
                autoComplete="username"
                value={credentials.username}
                onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={credentials.password}
                onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              />
            </label>
            <button disabled={busy}>{busy ? "Signing in..." : "Sign in securely"} &rarr;</button>
            {message && <small>{message}</small>}
          </form>
        </section>
        <aside>
          <span>Private access</span>
          <strong>Everything the hospital owner needs, in one clear view.</strong>
          <p>New booking requests, patient details, upcoming visits, and appointment status.</p>
        </aside>
      </main>
    );
  }

  return (
    <main className="owner-dashboard">
      <header>
        <a className="owner-brand" href="/">Sarada <span>NETRALAYA</span></a>
        <div>
          <span>Signed in as {user.displayName}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <section className="owner-header">
        <div>
          <span className="owner-eyebrow">Clinic overview</span>
          <h1>Good morning,<br /><i>{user.displayName}.</i></h1>
          <p>Here is your appointment desk at a glance.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer">View patient website</a>
      </section>

      <section className="owner-metrics">
        <Metric value={stats.total || 0} label="Total appointments" />
        <Metric value={stats.today || 0} label="Visits today" accent="teal" />
        <Metric value={stats.requested || 0} label="New requests" accent="gold" />
        <Metric value={stats.confirmed || 0} label="Confirmed visits" />
      </section>

      <section className="owner-content">
        <div className="owner-table-wrap">
          <div className="owner-table-heading">
            <div>
              <span className="owner-eyebrow">Appointment desk</span>
              <h2>Patient requests</h2>
            </div>
            <div className="owner-actions">
              <button onClick={() => loadDashboard()}>Refresh</button>
              <button onClick={exportAppointments} disabled={!filteredAppointments.length}>Export CSV</button>
              <button onClick={() => window.print()}>Print</button>
            </div>
          </div>

          <div className="owner-filters">
            <label>
              Search patient
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, mobile, reference" />
            </label>
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          </div>

          {message && <p className="owner-message">{message}</p>}

          <div className="owner-table">
            <div className="owner-table-row owner-labels">
              <span>Patient</span>
              <span>Visit</span>
              <span>Reason</span>
              <span>Status</span>
            </div>
            {filteredAppointments.length ? filteredAppointments.map((item) => (
              <div className="owner-table-row" key={item.id}>
                <div>
                  <strong>{item.patientName}</strong>
                  <small>{item.mobile} - {item.age ? `${item.age} yrs` : "Age not provided"}</small>
                  <em>{item.reference}</em>
                </div>
                <div>
                  <strong>{item.department}</strong>
                  <small>{item.date || "Date to confirm"}</small>
                  <small>{item.timeSlot}</small>
                </div>
                <p>{item.reason || "No reason provided"}</p>
                <select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} className={`status-${item.status}`}>
                  {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </div>
            )) : <p className="owner-empty">No matching appointment requests found.</p>}
          </div>
        </div>

        <aside className="owner-side">
          <span className="owner-eyebrow">At a glance</span>
          <h2>Department mix</h2>
          <div className="owner-department"><span>Eye Care</span><strong>{stats.eyeCare || 0}</strong></div>
          <div className="owner-department"><span>Optical</span><strong>{stats.optical || 0}</strong></div>
          <hr />
          <h3>How to use this desk</h3>
          <ol>
            <li>Review every new request.</li>
            <li>Call the patient to confirm their slot.</li>
            <li>Change status to Confirmed.</li>
            <li>Mark completed after the visit.</li>
          </ol>
        </aside>
      </section>
    </main>
  );
}
