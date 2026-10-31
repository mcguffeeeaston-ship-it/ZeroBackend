import { Hono } from "hono";
import { getAllStats, getStats, getUserById } from "../utilites/database";

const leaderboards = new Hono();

leaderboards.get("/*/api/statsv2/leaderboards/:leaderboardName", async (c) => {
  const leaderboardName = c.req.param("leaderboardName").toLowerCase();
  const maxSize = Math.min(parseInt(c.req.query("maxSize") || "100", 10), 100);
  const statsList = await getAllStats();
  let entries: any[] = [];

  if (leaderboardName.includes("hype") || leaderboardName.includes("arena")) {
    statsList.sort((a, b) => (b.hype || 0) - (a.hype || 0));
    for (const stat of statsList.slice(0, maxSize)) {
      const user = await getUserById(stat.accountId);
      if (user) {
        entries.push({
          displayName: user.username,
          account: user.accountId,
          value: stat.hype || 0
        });
      }
    }
  } else {
    let statKey = "kills";
    if (leaderboardName.includes("wins") || leaderboardName.includes("placetop1")) statKey = "wins";
    if (leaderboardName.includes("score")) statKey = "score";
    if (leaderboardName.includes("matches")) statKey = "matchesplayed";

    statsList.sort((a, b) => (b.solo?.[statKey] || 0) - (a.solo?.[statKey] || 0));
    for (const stat of statsList.slice(0, maxSize)) {
      const user = await getUserById(stat.accountId);
      if (user) {
        entries.push({
          displayName: user.username,
          account: user.accountId,
          value: stat.solo?.[statKey] || 0
        });
      }
    }
  }

  return c.json({ maxSize, entries });
});

leaderboards.post("/fortnite/api/leaderboards/type/global/stat/:leaderboardName/window/:typeLeaderboard", async (c) => {
  const leaderboardName = c.req.param("leaderboardName");
  const typeLeaderboard = c.req.param("typeLeaderboard");
  const statsList = await getAllStats();
  const entries: any[] = [];

  for (const stat of statsList) {
    const user = await getUserById(stat.accountId);
    if (user) {
      entries.push({
        accountId: user.accountId,
        displayName: user.username,
        rank: 1,
        value: stat.solo?.kills || 0
      });
    }
  }

  entries.sort((a, b) => b.value - a.value);
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
  });

  return c.json({
    statName: leaderboardName,
    statWindow: typeLeaderboard,
    entries
  });
});

leaderboards.post("/*/api/statsv2/query", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const owners = body.owners || [];
  const statKey = body.stats?.[0] || "br_kills_keyboardmouse_m0_playlist_defaultsolo";
  const results: any[] = [];

  for (const owner of owners) {
    const stat = await getStats(owner);
    results.push({
      accountId: owner,
      endTime: body.endTime || 0,
      startTime: body.startTime || 0,
      stats: {
        [statKey]: stat.solo?.kills || 0
      }
    });
  }

  return c.json(results);
});

leaderboards.get("/fortnite/api/game/v2/leaderboards/cohort/:accountId", (c) => {
  return c.json({});
});

leaderboards.get("/api/v1/events/Fortnite/:eventId/history/:accountId", (c) => {
  return c.json({
    gameId: "Fortnite",
    eventId: c.req.param("eventId"),
    accountId: c.req.param("accountId"),
    history: []
  });
});

leaderboards.get("/fortnite/api/stats/accountId/:accountId/bulk/window/:windowType", async (c) => {
  const accountId = c.req.param("accountId");
  const windowType = c.req.param("windowType");
  const stat = await getStats(accountId);

  const statsList: any[] = [
    { name: "br_kills_pc_m0_p2", value: stat.solo?.kills || 0, window: windowType, ownerType: 1 },
    { name: "br_placetop1_pc_m0_p2", value: stat.solo?.wins || 0, window: windowType, ownerType: 1 },
    { name: "br_matchesplayed_pc_m0_p2", value: stat.solo?.matchesplayed || 0, window: windowType, ownerType: 1 },
    { name: "br_score_pc_m0_p2", value: stat.solo?.score || 0, window: windowType, ownerType: 1 }
  ];

  return c.json(statsList);
});

leaderboards.get("/*/api/statsv2/account/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const stat = await getStats(accountId);

  return c.json({
    accountId,
    endTime: 0,
    startTime: 0,
    stats: {
      br_placetop1_keyboardmouse_m0_playlist_defaultsolo: stat.solo?.placetop1 || 0,
      br_placetop1_keyboardmouse_m0_playlist_defaultduo: stat.duo?.placetop1 || 0,
      br_placetop1_keyboardmouse_m0_playlist_defaultsquad: stat.squad?.placetop1 || 0,
      br_placetop10_keyboardmouse_m0_playlist_defaultsolo: stat.solo?.placetop10 || 0,
      br_placetop25_keyboardmouse_m0_playlist_defaultsolo: stat.solo?.placetop25 || 0,
      br_kills_keyboardmouse_m0_playlist_defaultsolo: stat.solo?.kills || 0,
      br_kills_keyboardmouse_m0_playlist_defaultduo: stat.duo?.kills || 0,
      br_kills_keyboardmouse_m0_playlist_defaultsquad: stat.squad?.kills || 0,
      br_matchesplayed_keyboardmouse_m0_playlist_defaultsolo: stat.solo?.matchesplayed || 0,
      br_matchesplayed_keyboardmouse_m0_playlist_defaultduo: stat.duo?.matchesplayed || 0,
      br_matchesplayed_keyboardmouse_m0_playlist_defaultsquad: stat.squad?.matchesplayed || 0,
      br_minutesplayed_keyboardmouse_m0_playlist_defaultsolo: stat.solo?.minutesplayed || 0,
      br_score_keyboardmouse_m0_playlist_defaultsolo: stat.solo?.score || 0,
      br_score_keyboardmouse_m0_playlist_defaultduo: stat.duo?.score || 0,
      br_score_keyboardmouse_m0_playlist_defaultsquad: stat.squad?.score || 0
    }
  });
});

export default leaderboards;
