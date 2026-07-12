import { appointments, json, requireOwner } from "../../_store.js";

export default function handler(req, res) {
  const payload = requireOwner(req, res);
  if (!payload) return;
  if (req.method !== "PATCH") return json(res, 405, { error: "Method not allowed" });
  const status = req.body?.status?.toString().trim() || "";
  if (!["requested", "confirmed", "completed", "cancelled"].includes(status)) {
    return json(res, 400, { error: "Invalid appointment status." });
  }
  const id = req.query?.id;
  const index = appointments().findIndex((item) => item.id === id);
  if (index === -1) return json(res, 404, { error: "Appointment not found." });
  appointments()[index] = { ...appointments()[index], status, updatedAt: new Date().toISOString() };
  return json(res, 200, { appointment: appointments()[index] });
}
