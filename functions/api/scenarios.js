// CRUD for saved scenarios — Cloudflare Pages Function
// GET    /api/scenarios        → list all scenarios for current user
// POST   /api/scenarios        → create scenario
// PUT    /api/scenarios?id=... → update scenario
// DELETE /api/scenarios?id=... → delete scenario

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}

async function getUser(context) {
  const sessionId = getCookie(context.request, "session");
  if (!sessionId || !context.env.DB) return null;
  const row = await context.env.DB
    .prepare("SELECT user_json FROM sessions WHERE id = ? AND expires_at > ?")
    .bind(sessionId, Date.now())
    .first();
  return row ? JSON.parse(row.user_json) : null;
}

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export async function onRequestGet(context) {
  const user = await getUser(context);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

  const rows = await context.env.DB
    .prepare("SELECT * FROM scenarios WHERE user_id = ? ORDER BY updated_at DESC")
    .bind(user.id)
    .all();

  const scenarios = rows.results.map(r => ({
    ...r,
    inputs: JSON.parse(r.inputs),
  }));

  return new Response(JSON.stringify({ scenarios }), { headers: CORS });
}

export async function onRequestPost(context) {
  const user = await getUser(context);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

  const body = await context.request.json();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    "INSERT INTO scenarios (id, user_id, name, address, inputs, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, user.id, body.name, body.address || "", JSON.stringify(body.inputs), now, now).run();

  return new Response(JSON.stringify({ id }), { headers: CORS });
}

export async function onRequestPut(context) {
  const user = await getUser(context);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");
  const body = await context.request.json();
  const now = new Date().toISOString();

  await context.env.DB.prepare(
    "UPDATE scenarios SET name=?, address=?, inputs=?, updated_at=? WHERE id=? AND user_id=?"
  ).bind(body.name, body.address || "", JSON.stringify(body.inputs), now, id, user.id).run();

  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

export async function onRequestDelete(context) {
  const user = await getUser(context);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  await context.env.DB.prepare("DELETE FROM scenarios WHERE id=? AND user_id=?").bind(id, user.id).run();

  return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
