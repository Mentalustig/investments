// GitHub OAuth flow — Cloudflare Pages Function
// GET  /api/auth?code=... → exchanges code for token, stores session
// GET  /api/auth?action=logout → clears session
// GET  /api/auth?action=me → returns current user

const GITHUB_CLIENT_ID = "REPLACE_WITH_GITHUB_CLIENT_ID";
const GITHUB_CLIENT_SECRET = "REPLACE_WITH_GITHUB_CLIENT_SECRET";
// Allowed GitHub user IDs (your GitHub numeric ID — find at api.github.com/user)
const ALLOWED_USERS = ["REPLACE_WITH_YOUR_GITHUB_USER_ID"];

async function getGithubUser(token) {
  const r = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "immobilien-kalkulator" },
  });
  if (!r.ok) return null;
  return r.json();
}

function makeSessionToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const action = url.searchParams.get("action");

  // ── Logout ────────────────────────────────────────────────────────────────
  if (action === "logout") {
    const sessionId = getCookie(context.request, "session");
    if (sessionId && context.env.DB) {
      await context.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      },
    });
  }

  // ── Me (current user from session) ───────────────────────────────────────
  if (action === "me") {
    const sessionId = getCookie(context.request, "session");
    if (!sessionId || !context.env.DB) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    const row = await context.env.DB
      .prepare("SELECT user_json FROM sessions WHERE id = ? AND expires_at > ?")
      .bind(sessionId, Date.now())
      .first();
    const user = row ? JSON.parse(row.user_json) : null;
    return new Response(JSON.stringify({ user }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── OAuth callback (code exchange) ───────────────────────────────────────
  if (code) {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return Response.redirect("/?auth=error", 302);
    }

    const ghUser = await getGithubUser(accessToken);
    if (!ghUser) return Response.redirect("/?auth=error", 302);

    // Check allowlist
    if (!ALLOWED_USERS.includes(String(ghUser.id))) {
      return Response.redirect("/?auth=forbidden", 302);
    }

    const user = { id: String(ghUser.id), login: ghUser.login, name: ghUser.name, avatar: ghUser.avatar_url };
    const sessionId = makeSessionToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    if (context.env.DB) {
      await context.env.DB.prepare(
        "INSERT OR REPLACE INTO sessions (id, user_id, user_json, expires_at) VALUES (?, ?, ?, ?)"
      ).bind(sessionId, user.id, JSON.stringify(user), expiresAt).run();
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 3600}`,
      },
    });
  }

  // ── Initiate OAuth (redirect to GitHub) ──────────────────────────────────
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user`;
  return Response.redirect(githubUrl, 302);
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(name + "="));
  return match ? match.split("=")[1] : null;
}
