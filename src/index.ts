import { Hono } from "hono";
import ConnectDatabase from "./utilites/database";
import logger from "./utilites/logger";
import oauth from "./routes/oauth";
import lightswitch from "./routes/lightswitch";
import waitingroom from "./routes/waitingroom";
import cloudstorage from "./routes/cloudstorage";
import clientsettings from "./routes/clientsettings";
import discordoauth from "./routes/discordoauth";
import social from "./routes/social";
import gameserver from "./routes/gameserver";
import leaderboards from "./routes/leaderboards";
import calendar from "./routes/calendar";
import { handleMcpOperation } from "./operations/ClientQuestLogin";
import {
  createMatchmakingTicket,
  getAvailableSession,
  registerGameServer,
  sessions
} from "./utilites/MatchmakingFunctions";
import { matchmakerWebSocketHandler } from "./ws/matchmaker/index";
import XmppServer from "./ws/xmpp/xmpp";
import { initDiscord } from "./discord/index";

const app = new Hono();
const port = parseInt(process.env.PORT || "3551", 10);

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  logger.info(`${c.req.method} ${c.req.path} -> ${c.res.status} (${duration}ms)`);
});

app.all("/datarouter/*", (c) => c.body(null, 204));
app.all("/telemetry/*", (c) => c.body(null, 204));

app.route("/account/api", oauth);
app.route("/lightswitch/api", lightswitch);
app.route("/waitingroom/api", waitingroom);
app.route("/fortnite/api", cloudstorage);
app.route("/api", clientsettings);
app.route("/", discordoauth);
app.route("/", social);
app.route("/", gameserver);
app.route("/", leaderboards);
app.route("/", calendar);

app.get("/", (c) => {
  return c.json({
    project: "Zero Backend",
    description: "Universal Fortnite OGFN Backend",
    version: "11.50",
    status: "online",
    discordAuth: "/auth/discord",
    time: new Date().toISOString()
  });
});

app.get("/fortnite/api/game/v2/enabled_features", (c) => c.json([]));
app.get("/fortnite/api/v2/versioncheck/*", (c) => c.json({ type: "NO_UPDATE" }));
app.get("/fortnite/api/versioncheck*", (c) => c.json({ type: "NO_UPDATE" }));

app.get("/content/api/pages/fortnite-game", (c) => {
  return c.json({
    _title: "Fortnite Game",
    _activeDate: "2019-10-15T00:00:00.000Z",
    lastModified: new Date().toISOString(),
    _locale: "en-US",
    dynamicbackgrounds: {
      "jcr:isCheckedOut": true,
      _title: "dynamicbackgrounds",
      _noIndex: false,
      backgrounds: {
        backgrounds: [
          { stage: "season11", _type: "DynamicBackground", key: "lobby" },
          { stage: "season11", _type: "DynamicBackground", key: "vault" }
        ],
        _type: "DynamicBackgroundList"
      },
      _activeDate: "2019-10-15T00:00:00.000Z",
      lastModified: new Date().toISOString(),
      _locale: "en-US"
    },
    battleroyalenews: {
      news: {
        motds: [
          {
            image: "https://cdn2.unrealengine.com/11br-launch-newsfeed-1920x1080-1920x1080-606277150.jpg",
            hidden: false,
            _type: "CommonUI Simple Message MOTD",
            title: "ZERO BACKEND 11.50",
            body: "Welcome to Zero Backend!",
            videoStreamingEnabled: false,
            sortingPriority: 100,
            id: "ZeroWelcomeMotd",
            spotlight: false
          }
        ],
        _type: "Battle Royale News",
        messages: []
      },
      _title: "battleroyalenews",
      _activeDate: "2019-10-15T00:00:00.000Z",
      lastModified: new Date().toISOString(),
      _locale: "en-US"
    }
  });
});

app.get("/fortnite/api/storefront/v2/catalog", (c) => {
  return c.json({
    refreshIntervalHrs: 24,
    dailyPurchaseHrs: 24,
    expiration: new Date(Date.now() + 86400 * 1000).toISOString(),
    storefronts: [
      {
        name: "BRDailyStorefront",
        catalogEntries: []
      },
      {
        name: "BRWeeklyStorefront",
        catalogEntries: []
      }
    ]
  });
});

app.get("/fortnite/api/storefront/v2/keychain", (c) => c.json([]));

app.get("/fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId", (c) => {
  const accountId = c.req.param("accountId");
  const host = c.req.header("host") || `127.0.0.1:${port}`;
  const { ticket, payload, signature } = createMatchmakingTicket(accountId);

  logger.info(`Issued matchmaking ticket for player ${accountId}`);

  return c.json({
    serviceUrl: `ws://${host}`,
    ticketType: "mms-player",
    payload,
    signature
  });
});

app.get("/fortnite/api/matchmaking/session/findPlayer/:accountId", (c) => {
  const session = getAvailableSession();
  logger.info(`Routing player ${c.req.param("accountId")} to session ${session.id} (${session.serverAddress}:${session.serverPort})`);
  return c.json([session]);
});

app.get("/fortnite/api/matchmaking/session/:sessionId", (c) => {
  const sessionId = c.req.param("sessionId");
  const session = sessions.get(sessionId) || getAvailableSession();
  return c.json(session);
});

app.post("/fortnite/api/matchmaking/session/:sessionId/join", (c) => {
  return c.body(null, 204);
});

app.post("/fortnite/api/matchmaking/session", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}
  const session = registerGameServer(body);
  return c.json(session);
});

app.post("/fortnite/api/matchmaking/session/:sessionId/heartbeat", (c) => {
  const sessionId = c.req.param("sessionId");
  const session = sessions.get(sessionId);
  if (session) {
    session.lastUpdated = new Date().toISOString();
    return c.json(session);
  }
  return c.body(null, 404);
});

app.post("/fortnite/api/game/v2/profile/:accountId/client/:operation", async (c) => {
  const accountId = c.req.param("accountId");
  const operation = c.req.param("operation");
  const profileId = c.req.query("profileId") || "athena";

  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  logger.info(`Processing MCP client operation '${operation}' (${profileId}) for ${accountId}`);
  const result = await handleMcpOperation(accountId, profileId, operation, body);
  return c.json(result);
});

app.post("/fortnite/api/game/v2/profile/:accountId/dedicated_server/:operation", async (c) => {
  const accountId = c.req.param("accountId");
  const operation = c.req.param("operation");
  const profileId = c.req.query("profileId") || "athena";

  let body = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  logger.info(`Processing MCP dedicated_server operation '${operation}' (${profileId}) for ${accountId}`);
  const result = await handleMcpOperation(accountId, profileId, operation, body);
  return c.json(result);
});

app.all("*", (c) => {
  return c.json(
    {
      errorCode: "errors.com.epicgames.common.not_found",
      errorMessage: `Endpoint '${c.req.path}' not found`,
      numericErrorCode: 1004,
      originatingService: "Fortnite",
      intent: "prod"
    },
    404
  );
});

await ConnectDatabase();

XmppServer.start();

await initDiscord();

Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return app.fetch(req);
  },
  websocket: matchmakerWebSocketHandler,
  port: port,
  development: false
});

logger.info(`===============================================`);
logger.info(`  Zero Backend Fortnite Server is Online!      `);
logger.info(`  HTTP & Matchmaker WebSocket: http://127.0.0.1:${port}`);
logger.info(`  XMPP Service: 127.0.0.1:5222                 `);
logger.info(`===============================================`);

export { app };
