import { json, ownerUser, requireOwner } from "../_store.js";

export default function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  const payload = requireOwner(req, res);
  if (!payload) return;
  return json(res, 200, { user: ownerUser() });
}
