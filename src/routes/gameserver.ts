import { Hono } from "hono";
import { getUserById, getUserByUsername, getProfile, saveProfile, getStats, saveStats } from "../utilites/database";
import { registerGameServer, removeSession, sessions } from "../utilites/MatchmakingFunctions";
import logger from "../utilites/logger";

const gameserver = new Hono();

let isServerJoinable = false;

function calculateDivision(hype: number): number {
  if (hype < 500) return 1;
  if (hype < 1000) return 2;
  if (hype < 1500) return 3;
  if (hype < 2000) return 4;
  if (hype < 3000) return 5;
  if (hype < 4500) return 6;
  if (hype < 6000) return 7;
  if (hype < 10000) return 8;
  return 10;
}

gameserver.get("/joinable", (c) => {
  isServerJoinable = true;
  logger.info("Project Reboot Gameserver reported: JOINABLE");
  return c.text("OK");
});

gameserver.get("/notjoinable", (c) => {
  isServerJoinable = false;
  logger.info("Project Reboot Gameserver reported: NOT JOINABLE (Bus started)");
  return c.text("OK");
});

gameserver.post("/gameserver/notify", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const ip = body.ip || "127.0.0.1";
  const port = parseInt(body.port || "7777", 10);
  const playlist = body.playlist || "Playlist_DefaultSolo";

  const session = registerGameServer({
    serverAddress: ip,
    serverPort: port,
    attributes: {
      REGION_s: "NAE",
      GAMEMODE_s: "FORTATHENA",
      PLAYLISTNAME_s: playlist
    }
  });

  isServerJoinable = true;
  logger.info(`Reboot gameserver registered: ${ip}:${port} (${session.id})`);
  return c.json({ success: true, sessionId: session.id });
});

gameserver.post("/gameserver/register", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const session = registerGameServer({
    serverAddress: body.ip || "127.0.0.1",
    serverPort: parseInt(body.port || "7777", 10),
    attributes: {
      REGION_s: body.region || "NAE",
      GAMEMODE_s: "FORTATHENA",
      PLAYLISTNAME_s: body.playlist || "Playlist_DefaultSolo"
    }
  });

  return c.json({ success: true, sessionId: session.id });
});

gameserver.post("/gameserver/ready", (c) => {
  isServerJoinable = true;
  return c.json({ success: true, joinable: true });
});

gameserver.post("/gameserver/heartbeat", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const port = parseInt(body.port || "7777", 10);
  for (const session of sessions.values()) {
    if (session.serverPort === port) {
      session.lastUpdated = new Date().toISOString();
      return c.json({ success: true });
    }
  }

  return c.json({ success: true });
});

gameserver.post("/gameserver/unregister", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const port = parseInt(body.port || "7777", 10);
  for (const [id, session] of sessions.entries()) {
    if (session.serverPort === port) {
      removeSession(id);
      break;
    }
  }

  return c.json({ success: true });
});

gameserver.get("/gameserver/list", (c) => {
  const list = Array.from(sessions.values()).map((s) => ({
    key: `${s.serverAddress}:${s.serverPort}`,
    playlist: s.attributes?.PLAYLISTNAME_s || "Playlist_DefaultSolo",
    players: `${s.totalPlayers}/${s.maxPublicPlayers}`,
    ready: isServerJoinable,
    lastHeartbeat: s.lastUpdated
  }));

  return c.json(list);
});

async function addVBucks(accountId: string, amount: number): Promise<number> {
  const profile = await getProfile(accountId, "common_core");
  if (!profile) return 0;

  if (!profile.items) profile.items = {};
  const mtxKey = "Currency:MtxPurchased";

  if (!profile.items[mtxKey]) {
    profile.items[mtxKey] = {
      templateId: "Currency:MtxPurchased",
      attributes: { platform: "EpicPC" },
      quantity: 0
    };
  }

  profile.items[mtxKey].quantity = (profile.items[mtxKey].quantity || 0) + amount;
  profile.rvn = (profile.rvn || 0) + 1;
  profile.updated = new Date().toISOString();
  await saveProfile(accountId, "common_core", profile);

  return profile.items[mtxKey].quantity;
}

gameserver.post("/api/elo/kill", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const killer = body.killer;
  const victim = body.victim;
  const hypeReward = parseInt(body.hype || "50", 10);
  const vbucksReward = parseInt(body.vbucks || "50", 10);

  if (!killer) return c.json({ error: "killer username required" }, 400);

  const user = await getUserByUsername(killer);
  if (!user) return c.json({ error: "Killer not found" }, 404);

  const stats = await getStats(user.accountId);
  stats.solo.kills = (stats.solo.kills || 0) + 1;
  stats.solo.score = (stats.solo.score || 0) + 50;
  stats.hype = (stats.hype || 0) + hypeReward;
  stats.division = calculateDivision(stats.hype);
  await saveStats(user.accountId, stats);

  let newVbucks = 0;
  if (vbucksReward > 0) {
    newVbucks = await addVBucks(user.accountId, vbucksReward);
  }

  logger.info(`Match event: ${killer} eliminated ${victim} (+${vbucksReward} V-Bucks, +${hypeReward} Hype)`);
  return c.json({ success: true, killer, victim, hype: stats.hype, vbucks: newVbucks });
});

gameserver.post("/api/gameserver/kill", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const killer = body.killer;
  const victim = body.victim;
  const hypeReward = parseInt(body.hype || "50", 10);
  const vbucksReward = parseInt(body.vbucks || "50", 10);

  if (!killer) return c.json({ error: "killer username required" }, 400);

  const user = await getUserByUsername(killer);
  if (!user) return c.json({ error: "Killer not found" }, 404);

  const stats = await getStats(user.accountId);
  stats.solo.kills = (stats.solo.kills || 0) + 1;
  stats.solo.score = (stats.solo.score || 0) + 50;
  stats.hype = (stats.hype || 0) + hypeReward;
  stats.division = calculateDivision(stats.hype);
  await saveStats(user.accountId, stats);

  let newVbucks = 0;
  if (vbucksReward > 0) {
    newVbucks = await addVBucks(user.accountId, vbucksReward);
  }

  logger.info(`Match event: ${killer} eliminated ${victim} (+${vbucksReward} V-Bucks, +${hypeReward} Hype)`);
  return c.json({ success: true, killer, victim, hype: stats.hype, vbucks: newVbucks });
});

gameserver.post("/api/elo/win", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const winner = body.winner;
  const kills = parseInt(body.kills || "0", 10);
  const hypeReward = parseInt(body.hype || "150", 10);
  const vbucksReward = parseInt(body.vbucks || "150", 10);

  if (!winner) return c.json({ error: "winner username required" }, 400);

  const user = await getUserByUsername(winner);
  if (!user) return c.json({ error: "Winner not found" }, 404);

  const stats = await getStats(user.accountId);
  stats.solo.wins = (stats.solo.wins || 0) + 1;
  stats.solo.placetop1 = (stats.solo.placetop1 || 0) + 1;
  stats.solo.matchesplayed = (stats.solo.matchesplayed || 0) + 1;
  stats.solo.score = (stats.solo.score || 0) + 150;
  stats.hype = (stats.hype || 0) + hypeReward;
  stats.division = calculateDivision(stats.hype);
  await saveStats(user.accountId, stats);

  let newVbucks = 0;
  if (vbucksReward > 0) {
    newVbucks = await addVBucks(user.accountId, vbucksReward);
  }

  logger.info(`Victory Royale: ${winner} won with ${kills} kills (+${vbucksReward} V-Bucks, +${hypeReward} Hype)`);
  return c.json({ success: true, winner, hype: stats.hype, vbucks: newVbucks });
});

gameserver.post("/api/gameserver/win", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const winner = body.winner;
  const kills = parseInt(body.kills || "0", 10);
  const hypeReward = parseInt(body.hype || "150", 10);
  const vbucksReward = parseInt(body.vbucks || "150", 10);

  if (!winner) return c.json({ error: "winner username required" }, 400);

  const user = await getUserByUsername(winner);
  if (!user) return c.json({ error: "Winner not found" }, 404);

  const stats = await getStats(user.accountId);
  stats.solo.wins = (stats.solo.wins || 0) + 1;
  stats.solo.placetop1 = (stats.solo.placetop1 || 0) + 1;
  stats.solo.matchesplayed = (stats.solo.matchesplayed || 0) + 1;
  stats.solo.score = (stats.solo.score || 0) + 150;
  stats.hype = (stats.hype || 0) + hypeReward;
  stats.division = calculateDivision(stats.hype);
  await saveStats(user.accountId, stats);

  let newVbucks = 0;
  if (vbucksReward > 0) {
    newVbucks = await addVBucks(user.accountId, vbucksReward);
  }

  logger.info(`Victory Royale: ${winner} won with ${kills} kills (+${vbucksReward} V-Bucks, +${hypeReward} Hype)`);
  return c.json({ success: true, winner, hype: stats.hype, vbucks: newVbucks });
});

gameserver.post("/api/elo/vbucks/add", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const { username, accountId, amount } = body;
  const addAmount = parseInt(amount || "0", 10);
  if (addAmount <= 0) return c.json({ error: "Positive amount required" }, 400);

  let user = null;
  if (accountId) user = await getUserById(accountId);
  if (!user && username) user = await getUserByUsername(username);
  if (!user) return c.json({ error: "User not found" }, 404);

  const newTotal = await addVBucks(user.accountId, addAmount);
  return c.json({ success: true, username: user.username, vbucks: newTotal });
});

gameserver.post("/api/elo/hype/add", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const { username, accountId, amount } = body;
  const addAmount = parseInt(amount || "0", 10);
  if (addAmount === 0) return c.json({ error: "Non-zero amount required" }, 400);

  let user = null;
  if (accountId) user = await getUserById(accountId);
  if (!user && username) user = await getUserByUsername(username);
  if (!user) return c.json({ error: "User not found" }, 404);

  const stats = await getStats(user.accountId);
  stats.hype = (stats.hype || 0) + addAmount;
  stats.division = calculateDivision(stats.hype);
  await saveStats(user.accountId, stats);

  return c.json({ success: true, username: user.username, hype: stats.hype, division: stats.division });
});

gameserver.get("/api/elo/player/:username", async (c) => {
  const username = c.req.param("username");
  const user = await getUserByUsername(username);
  if (!user) return c.json({ error: "User not found" }, 404);

  const stats = await getStats(user.accountId);
  const profile = await getProfile(user.accountId, "common_core");
  const vbucks = profile?.items?.["Currency:MtxPurchased"]?.quantity || 0;

  return c.json({
    username: user.username,
    accountId: user.accountId,
    banned: user.banned,
    hype: stats.hype,
    division: stats.division,
    vbucks,
    stats: stats.solo
  });
});

export default gameserver;
