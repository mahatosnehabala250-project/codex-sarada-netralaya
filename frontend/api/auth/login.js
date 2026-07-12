import { createToken, json, normalizeText, ownerUser, validateOwner } from "../_store.js";

export default function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  const username = normalizeText(req.body?.username);
  const password = normalizeText(req.body?.password);
  if (!validateOwner(username, password)) return json(res, 401, { error: "Invalid username or password" });
  return json(res, 200, { token: createToken(), user: ownerUser() });
}
