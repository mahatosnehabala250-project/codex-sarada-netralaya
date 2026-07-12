import { buildStats, json, readAppointments, requireOwner } from "../_store.js";

export default async function handler(req, res) {
  const payload = requireOwner(req, res);
  if (!payload) return;
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const rows = (await readAppointments()).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return json(res, 200, { appointments: rows, stats: buildStats(rows), mode: "api" });
}
