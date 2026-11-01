import { Hono } from "hono";
import { getUserById, getUserByUsername, saveUser, UserModel } from "../utilites/database";
import { sessions } from "../utilites/MatchmakingFunctions";
import { xmppClients } from "../ws/xmpp/xmpp";
import logger from "../utilites/logger";

const admin = new Hono();

admin.get("/dashboard", async (c) => {
  let userCount = 0;
  try {
    userCount = await UserModel.countDocuments();
  } catch (e) {
    userCount = 1;
  }

  const onlineXmpp = Array.from(xmppClients.values()).filter((cl) => cl.authenticated).length;
  const activeSessions = Array.from(sessions.values());

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Zero Backend - Control Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #0d1117;
      --card: #161b22;
      --border: #30363d;
      --primary: #58a6ff;
      --accent: #238636;
      --danger: #da3633;
      --text: #c9d1d9;
      --muted: #8b949e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 2rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    h1 { margin: 0; font-size: 1.8rem; color: #fff; }
    .status-pill {
      background: rgba(46, 160, 67, 0.15);
      border: 1px solid #2ea043;
      color: #3fb950;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
    }
    .card-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
    .card-value {
      font-size: 2rem;
      font-weight: 700;
      color: #fff;
    }
    .full-width { grid-column: 1 / -1; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      text-align: left;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
      font-size: 0.95rem;
    }
    th { color: var(--muted); font-size: 0.85rem; }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      text-decoration: none;
      color: #fff;
      background: #21262d;
      border: 1px solid var(--border);
    }
    .btn-primary { background: var(--accent); border-color: rgba(240, 246, 252, 0.1); }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Zero Backend Control Panel</h1>
      <div style="color: var(--muted); font-size: 0.9rem; margin-top: 0.25rem;">Universal Fortnite v11.50 Service</div>
    </div>
    <div class="status-pill">SYSTEM ONLINE</div>
  </header>

  <div class="grid">
    <div class="card">
      <div class="card-title">Registered Accounts</div>
      <div class="card-value">${userCount}</div>
    </div>
    <div class="card">
      <div class="card-title">Live XMPP Players</div>
      <div class="card-value">${onlineXmpp}</div>
    </div>
    <div class="card">
      <div class="card-title">Dedicated Game Servers</div>
      <div class="card-value">${activeSessions.length}</div>
    </div>
    <div class="card">
      <div class="card-title">Target Build</div>
      <div class="card-value" style="font-size: 1.4rem; padding-top: 0.5rem;">v11.50 (Chapter 2)</div>
    </div>

    <div class="card full-width">
      <h2 style="margin-top: 0; font-size: 1.2rem;">Registered Matchmaking Sessions</h2>
      <table>
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Server Address</th>
            <th>Port</th>
            <th>Playlist</th>
            <th>Players</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            activeSessions.length > 0
              ? activeSessions
                  .map(
                    (s) => `
            <tr>
              <td style="font-family: monospace;">${s.id.substring(0, 16)}...</td>
              <td>${s.serverAddress}</td>
              <td>${s.serverPort}</td>
              <td>${s.attributes?.PLAYLISTNAME_s || "Playlist_DefaultSolo"}</td>
              <td>${s.totalPlayers} / ${s.maxPublicPlayers}</td>
              <td><span style="color: #3fb950; font-weight: 600;">ACTIVE</span></td>
            </tr>`
                  )
                  .join("")
              : `<tr><td colspan="6" style="color: var(--muted); text-align: center;">No external dedicated servers registered. Using default internal session.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;

  return c.html(html);
});

admin.post("/api/admin/ban/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const user = await getUserById(accountId);
  if (!user) return c.json({ error: "User not found" }, 404);

  user.banned = true;
  await saveUser(user);
  logger.info(`Admin banned account: ${user.username} (${accountId})`);
  return c.json({ success: true, banned: true, accountId });
});

admin.post("/api/admin/unban/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const user = await getUserById(accountId);
  if (!user) return c.json({ error: "User not found" }, 404);

  user.banned = false;
  await saveUser(user);
  logger.info(`Admin unbanned account: ${user.username} (${accountId})`);
  return c.json({ success: true, banned: false, accountId });
});

admin.get("/fortnite/api/game/v2/tryPlay/eula", (c) => {
  return c.body(null, 204);
});

admin.get("/fortnite/api/game/v2/privacy/account/:accountId", (c) => {
  return c.json({
    accountId: c.req.param("accountId"),
    optOutOfPublicLeaderboards: false
  });
});

admin.post("/fortnite/api/game/v2/privacy/account/:accountId", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}
  return c.json({
    accountId: c.req.param("accountId"),
    optOutOfPublicLeaderboards: body.optOutOfPublicLeaderboards ?? false
  });
});

admin.get("/fortnite/api/game/v2/grant_access/:accountId", (c) => {
  return c.body(null, 204);
});

admin.post("/fortnite/api/game/v2/grant_access/:accountId", (c) => {
  return c.body(null, 204);
});

admin.get("/links/api/fn/mnemonic/:code", (c) => {
  const code = c.req.param("code");
  return c.json({
    namespace: "fn",
    mnemonic: code,
    linkType: "creative:island",
    metadata: {
      image_url: "https://cdn2.unrealengine.com/11br-launch-newsfeed-1920x1080-606277150.jpg",
      matchmaking: {
        override_playlist: "Playlist_DefaultSolo"
      },
      title: `Zero Creative Island (${code})`,
      tagline: "Created on Zero Backend",
      introduction: "Welcome to this custom Fortnite Creative island."
    },
    version: 1,
    active: true,
    disabled: false,
    created: new Date().toISOString(),
    published: new Date().toISOString(),
    descriptionTags: []
  });
});

export default admin;
