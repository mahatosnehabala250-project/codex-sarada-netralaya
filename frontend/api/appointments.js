import crypto from "node:crypto";
import { json, normalizeText, readAppointments, writeAppointments } from "./_store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  const patientName = normalizeText(req.body?.patientName);
  const mobile = normalizeText(req.body?.mobile);
  const age = Number(req.body?.age);
  const department = normalizeText(req.body?.department);
  const date = normalizeText(req.body?.date);
  const timeSlot = normalizeText(req.body?.timeSlot);
  const reason = normalizeText(req.body?.reason);

  if (!patientName || !mobile || !age || !department || !date || !timeSlot) {
    return json(res, 400, { error: "Please complete all required appointment fields." });
  }
  if (!["Eye Care", "Optical"].includes(department)) {
    return json(res, 400, { error: "Please choose Eye Care or Optical." });
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
  const rows = await readAppointments();
  rows.unshift(appointment);
  await writeAppointments(rows);
  return json(res, 201, { ok: true, reference: appointment.reference, appointment, notification: { skipped: true } });
}
