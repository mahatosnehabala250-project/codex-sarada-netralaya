import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const APP_SECRET = process.env.APP_SECRET || "sarada-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "owner";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "Owner";
const APPOINTMENT_NOTIFICATION_URL = process.env.APPOINTMENT_NOTIFICATION_URL || "";
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIST = path.resolve(__dirname, "../../frontend/dist");
const APPOINTMENTS_PATH = path.resolve(__dirname, "../data/appointments.json");

app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
app.use(express.json());

function normalizeText(value) {
  return value?.toString().trim() || "";
}

function readAppointments() {
  if (!fs.existsSync(APPOINTMENTS_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(APPOINTMENTS_PATH, "utf8"));
  } catch {
    return [];
  }
}

function writeAppointments(appointments) {
  fs.mkdirSync(path.dirname(APPOINTMENTS_PATH), { recursive: true });
  fs.writeFileSync(APPOINTMENTS_PATH, JSON.stringify(appointments, null, 2));
}

function createSignature(value) {
  return crypto.createHmac("sha256", APP_SECRET).update(value).digest("hex");
}

function createToken() {
  const payload = {
    sub: "owner",
    username: ADMIN_USERNAME,
    role: "admin",
    displayName: ADMIN_DISPLAY_NAME,
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${createSignature(encodedPayload)}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = createSignature(encodedPayload);
  if (expected.length !== signature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

function requireOwner(req, res, next) {
  const header = req.headers.authorization?.toString() || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") return res.status(401).json({ error: "Unauthorized" });
  req.user = payload;
  return next();
}

function serializeAppointment(appointment) {
  return {
    id: appointment.id,
    reference: appointment.reference,
    patientName: appointment.patientName,
    mobile: appointment.mobile,
    age: appointment.age,
    department: appointment.department,
    date: appointment.date,
    timeSlot: appointment.timeSlot,
    reason: appointment.reason,
    status: appointment.status || "requested",
    createdAt: appointment.createdAt,
  };
}

function buildStats(appointments) {
  const today = new Date().toISOString().slice(0, 10);
  return appointments.reduce((stats, appointment) => {
    stats.total += 1;
    if (appointment.date === today) stats.today += 1;
    if (appointment.status === "requested") stats.requested += 1;
    if (appointment.status === "confirmed") stats.confirmed += 1;
    if (appointment.department === "Eye Care") stats.eyeCare += 1;
    if (appointment.department === "Optical") stats.optical += 1;
    return stats;
  }, { total: 0, today: 0, requested: 0, confirmed: 0, eyeCare: 0, optical: 0 });
}

async function notifyOwner(appointment) {
  if (!APPOINTMENT_NOTIFICATION_URL) return { skipped: true };
  const response = await fetch(APPOINTMENT_NOTIFICATION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "appointment.booked", appointment }),
  });
  return { forwarded: response.ok, status: response.status };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "sarada-netralaya" });
});

app.post("/api/auth/login", (req, res) => {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);
  if (username.toLowerCase() !== ADMIN_USERNAME.toLowerCase() || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  res.json({
    token: createToken(),
    user: { id: "owner", username: ADMIN_USERNAME, displayName: ADMIN_DISPLAY_NAME, role: "admin" },
  });
});

app.get("/api/auth/me", requireOwner, (req, res) => {
  res.json({
    user: { id: "owner", username: req.user.username, displayName: req.user.displayName, role: "admin" },
  });
});

app.post("/api/appointments", async (req, res) => {
  const patientName = normalizeText(req.body.patientName);
  const mobile = normalizeText(req.body.mobile);
  const age = Number(req.body.age);
  const department = normalizeText(req.body.department);
  const date = normalizeText(req.body.date);
  const timeSlot = normalizeText(req.body.timeSlot);
  const reason = normalizeText(req.body.reason);

  if (!patientName || !mobile || !age || !department || !date || !timeSlot) {
    return res.status(400).json({ error: "Please complete all required appointment fields." });
  }
  if (!["Eye Care", "Optical"].includes(department)) {
    return res.status(400).json({ error: "Please choose Eye Care or Optical." });
  }

  const appointment = {
    id: crypto.randomUUID(),
    reference: `SN-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomInt(1000, 9999)}`,
    patientName,
    mobile,
    age,
    department,
    date,
    timeSlot,
    reason,
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  const appointments = readAppointments();
  appointments.push(appointment);
  writeAppointments(appointments);

  let notification = { skipped: true };
  try {
    notification = await notifyOwner(appointment);
  } catch (error) {
    notification = { forwarded: false, error: error.message };
  }

  res.status(201).json({ ok: true, reference: appointment.reference, appointment, notification });
});

app.get("/api/owner/appointments", requireOwner, (_req, res) => {
  const appointments = readAppointments()
    .map(serializeAppointment)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ appointments, stats: buildStats(appointments) });
});

app.patch("/api/owner/appointments/:id", requireOwner, (req, res) => {
  const status = normalizeText(req.body.status);
  if (!["requested", "confirmed", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid appointment status." });
  }
  const appointments = readAppointments();
  const index = appointments.findIndex((appointment) => appointment.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Appointment not found." });

  appointments[index] = { ...appointments[index], status, updatedAt: new Date().toISOString() };
  writeAppointments(appointments);
  res.json({ appointment: serializeAppointment(appointments[index]) });
});

if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Sarada Netralaya backend running on http://localhost:${PORT}`);
});
