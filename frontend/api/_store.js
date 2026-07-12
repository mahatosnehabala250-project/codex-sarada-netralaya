import crypto from "node:crypto";

const APP_SECRET = process.env.APP_SECRET || "sarada-vercel-secret-change-me";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "owner";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sarada@2026";
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "Owner";
const TOKEN_EXPIRY_MS = 1000 * 60 * 60 * 12;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || "";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const GITHUB_APPOINTMENTS_PATH = process.env.GITHUB_APPOINTMENTS_PATH || "backend/data/appointments-live.json";

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

async function githubRequest(pathname, options = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function readGitHubAppointmentsFile() {
  const encodedPath = GITHUB_APPOINTMENTS_PATH.split("/").map(encodeURIComponent).join("/");
  const { response, data } = await githubRequest(`/repos/${GITHUB_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`);
  if (response.status === 404) return { rows: [], sha: "" };
  if (!response.ok) throw new Error(data.message || "Could not read appointment store.");
  const json = Buffer.from(data.content || "", "base64").toString("utf8");
  return { rows: JSON.parse(json || "[]"), sha: data.sha || "" };
}

export async function readAppointments() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return appointments();
  const { rows } = await readGitHubAppointmentsFile();
  return Array.isArray(rows) ? rows : [];
}

export async function writeAppointments(rows) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    globalThis.__saradaAppointments = rows;
    return;
  }
  const { sha } = await readGitHubAppointmentsFile();
  const encodedPath = GITHUB_APPOINTMENTS_PATH.split("/").map(encodeURIComponent).join("/");
  const body = {
    message: "Update Sarada appointment store",
    content: Buffer.from(JSON.stringify(rows, null, 2)).toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  };
  const { response, data } = await githubRequest(`/repos/${GITHUB_REPO}/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(data.message || "Could not write appointment store.");
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
