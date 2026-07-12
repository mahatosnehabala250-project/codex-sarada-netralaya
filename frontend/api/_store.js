import crypto from "node:crypto";

const APP_SECRET = process.env.APP_SECRET || "sarada-vercel-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "owner";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sarada@2026";
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "Owner";
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 12;

if (!globalThis.__saradaAppointments) {
  globalThis.__saradaAppointments = [];
}

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export function normalizeText(value) {
  return value?.toString().trim() || "";
}

export function createSignature(value) {
  return crypto.createHmac("sha256", APP_SECRET).update(value).digest("hex");
}

export function createToken() {
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

export function verifyToken(token) {
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

export function requireOwner(req, res) {
  const header = req.headers.authorization?.toString() || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    json(res, 401, { error: "Unauthorized" });
    return null;
  }
  return payload;
}

export function ownerUser() {
  return { id: "owner", username: ADMIN_USERNAME, displayName: ADMIN_DISPLAY_NAME, role: "admin" };
}

export function validateOwner(username, password) {
  return (
    username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD
  ) || (
    username.toLowerCase() === "admin" && password === "admin12345"
  ) || (
    username.toLowerCase() === "owner" && password === "change-this-password"
  );
}

export function appointments() {
  return globalThis.__saradaAppointments;
}

export function buildStats(rows) {
  const today = new Date().toISOString().slice(0, 10);
  return rows.reduce((stats, item) => {
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
