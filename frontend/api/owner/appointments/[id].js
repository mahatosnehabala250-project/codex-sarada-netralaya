import { json, readAppointments, requireOwner, writeAppointments } from "../../_store.js";

export default async function handler(req, res) {
  const payload = requireOwner(req, res);
  if (!payload) return;
  if (req.method !== "PATCH") return json(res, 405, { error: "Method not allowed" });
  const status = req.body?.status?.toString().trim() || "";
  if (!["requested", "confirmed", "completed", "cancelled"].includes(status)) {
    return json(res, 400, { error: "Invalid appointment status." });
  }
  const id = req.query?.id;
  const rows = await readAppointments();
  const index = rows.findIndex((item) => item.id === id);
  if (index === -1) return json(res, 404, { error: "Appointment not found." });
  rows[index] = { ...rows[index], status, updatedAt: new Date().toISOString() };
  await writeAppointments(rows);
  return json(res, 200, { appointment: rows[index] });
}
