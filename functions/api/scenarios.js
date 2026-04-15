// CRUD for saved scenarios — Cloudflare Pages Function
// Auth via Cloudflare Zero Trust header (cf-access-authenticated-user-email)
// GET    /api/scenarios        → list all scenarios for current user
// POST   /api/scenarios        → create scenario
// PUT    /api/scenarios?id=... → update scenario
// DELETE /api/scenarios?id=... → delete scenario

function getUserId(context) {
  // Cloudflare Zero Trust injects this header after successful auth
  const email = context.request.headers.get("cf-access-authenticated-user-email");
  return email || "lucas"; // fallback for local dev
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function onRequestGet(context) {
  const userId = getUserId(context);

  const rows = await context.env.DB
    .prepare("SELECT * FROM scenarios WHERE user_id = ? ORDER BY updated_at DESC")
    .bind(userId)
    .all();

  const scenarios = rows.results.map(r => ({ ...r, inputs: JSON.parse(r.inputs) }));
  return new Response(JSON.stringify({ scenarios }), { headers: JSON_HEADERS });
}

export async function onRequestPost(context) {
  const userId = getUserId(context);
  const body = await context.request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    "INSERT INTO scenarios (id, user_id, name, address, inputs, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, userId, body.name, body.address || "", JSON.stringify(body.inputs), now, now).run();

  return new Response(JSON.stringify({ id }), { headers: JSON_HEADERS });
}

export async function onRequestPut(context) {
  const userId = getUserId(context);
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  const body = await context.request.json();
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    "UPDATE scenarios SET name=?, address=?, inputs=?, updated_at=? WHERE id=? AND user_id=?"
  ).bind(body.name, body.address || "", JSON.stringify(body.inputs), now, id, userId).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
}

export async function onRequestDelete(context) {
  const userId = getUserId(context);
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  await context.env.DB.prepare("DELETE FROM scenarios WHERE id=? AND user_id=?")
    .bind(id, userId).run();

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
}
