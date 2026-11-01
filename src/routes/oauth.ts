import { Hono } from "hono";
import crypto from "crypto";
import { findOrCreateUser, getUserById, generateUUID } from "../utilites/database";
import logger from "../utilites/logger";

const oauth = new Hono();

export const exchangeCodes = new Map<string, { accountId: string; expiresAt: number }>();
export const activeTokens = new Map<string, { accountId: string; displayName: string; clientId: string }>();

export function createExchangeCode(accountId: string): string {
  const code = crypto.randomBytes(16).toString("hex");
  exchangeCodes.set(code, {
    accountId,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
  return code;
}

oauth.post("/oauth/token", async (c) => {
  let body: Record<string, string> = {};
  const contentType = c.req.header("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      body = await c.req.json();
    } catch (e) {}
  } else {
    try {
      const formData = await c.req.formData();
      formData.forEach((val, key) => {
        body[key] = val.toString();
      });
    } catch (e) {
      try {
        const text = await c.req.text();
        const params = new URLSearchParams(text);
        params.forEach((val, key) => {
          body[key] = val;
        });
      } catch (err) {}
    }
  }

  const grantType = body.grant_type || "client_credentials";
  const clientId = body.client_id || "ec684b8c687f479fadea3cb245e77b57";

  if (grantType === "client_credentials") {
    const token = `eg1~${crypto.randomBytes(32).toString("hex")}`;
    activeTokens.set(token, {
      accountId: "zero_client",
      displayName: "ZeroServer",
      clientId
    });

    return c.json({
      access_token: token,
      expires_in: 28800,
      expires_at: new Date(Date.now() + 28800 * 1000).toISOString(),
      token_type: "bearer",
      client_id: clientId,
      internal_client: true,
      client_service: "fortnite",
      app: "fortnite"
    });
  }

  let user: any = null;

  if (grantType === "exchange_code" && body.exchange_code) {
    const entry = exchangeCodes.get(body.exchange_code);
    if (entry && entry.expiresAt > Date.now()) {
      user = await getUserById(entry.accountId);
      exchangeCodes.delete(body.exchange_code);
    }
  }

  if (!user) {
    let username = body.username || body.email;
    if (!username) {
      if (body.exchange_code) {
        username = `Zero_${body.exchange_code.substring(0, 6)}`;
      } else {
        username = "ZeroPlayer";
      }
    }
    user = await findOrCreateUser(username);
  }

  if (user.banned) {
    return c.json(
      {
        errorCode: "errors.com.epicgames.account.account_not_active",
        errorMessage: "You have been banned from Fortnite.",
        numericErrorCode: 28004,
        originatingService: "Account",
        intent: "prod"
      },
      400
    );
  }

  const token = `eg1~${crypto.randomBytes(32).toString("hex")}`;
  const refreshToken = `eg1~${crypto.randomBytes(32).toString("hex")}`;

  activeTokens.set(token, {
    accountId: user.accountId,
    displayName: user.username,
    clientId
  });

  logger.info(`User authenticated: ${user.username} (${user.accountId}) via ${grantType}`);

  return c.json({
    access_token: token,
    expires_in: 28800,
    expires_at: new Date(Date.now() + 28800 * 1000).toISOString(),
    token_type: "bearer",
    refresh_token: refreshToken,
    refresh_expires: 86400,
    refresh_expires_at: new Date(Date.now() + 86400 * 1000).toISOString(),
    account_id: user.accountId,
    client_id: clientId,
    internal_client: true,
    client_service: "fortnite",
    displayName: user.username,
    app: "fortnite",
    in_app_id: user.accountId,
    device_id: generateUUID()
  });
});

oauth.get("/oauth/verify", (c) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.replace(/^bearer\s+/i, "").trim();

  const session = activeTokens.get(token);
  const accountId = session ? session.accountId : "zero_default_user";
  const displayName = session ? session.displayName : "ZeroPlayer";
  const clientId = session ? session.clientId : "ec684b8c687f479fadea3cb245e77b57";

  return c.json({
    token: token || generateUUID(),
    session_id: generateUUID(),
    token_type: "bearer",
    client_id: clientId,
    internal_client: true,
    client_service: "fortnite",
    account_id: accountId,
    expires_in: 28800,
    expires_at: new Date(Date.now() + 28800 * 1000).toISOString(),
    auth_method: "exchange_code",
    display_name: displayName,
    app: "fortnite",
    in_app_id: accountId,
    device_id: generateUUID()
  });
});

oauth.get("/oauth/exchange", (c) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.replace(/^bearer\s+/i, "").trim();
  const session = activeTokens.get(token);
  const accountId = session ? session.accountId : "zero_default_user";

  const code = createExchangeCode(accountId);
  return c.json({
    expiresInSeconds: 300,
    code,
    creatingClientId: session?.clientId || "ec684b8c687f479fadea3cb245e77b57"
  });
});

oauth.post("/oauth/exchange", (c) => {
  const authHeader = c.req.header("authorization") || "";
  const token = authHeader.replace(/^bearer\s+/i, "").trim();
  const session = activeTokens.get(token);
  const accountId = session ? session.accountId : "zero_default_user";

  const code = createExchangeCode(accountId);
  return c.json({
    expiresInSeconds: 300,
    code,
    creatingClientId: session?.clientId || "ec684b8c687f479fadea3cb245e77b57"
  });
});

oauth.delete("/oauth/sessions/kill", (c) => {
  return c.body(null, 204);
});

oauth.delete("/oauth/sessions/kill/:token", (c) => {
  const token = c.req.param("token");
  activeTokens.delete(token);
  return c.body(null, 204);
});

oauth.get("/public/account/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const user = await getUserById(accountId);

  return c.json({
    id: accountId,
    displayName: user ? user.username : "ZeroPlayer",
    name: user ? user.username : "ZeroPlayer",
    email: user ? user.email : `${accountId}@zero.local`,
    failedLoginAttempts: 0,
    lastLogin: user ? user.lastLogin : new Date().toISOString(),
    numberOfDisplayNameChanges: 0,
    ageGroup: "UNKNOWN",
    headless: false,
    country: "US",
    lastName: "Server",
    preferredLanguage: "en",
    canUpdateDisplayName: false,
    tfaEnabled: false,
    emailVerified: true,
    minorVerified: false,
    minorExpected: false,
    minorStatus: "NOT_MINOR",
    cabinedMode: false,
    hasHashedEmail: false
  });
});

oauth.get("/public/account", async (c) => {
  const accountIds = c.req.queries("accountId") || [];
  const results: any[] = [];

  for (const id of accountIds) {
    const user = await getUserById(id);
    results.push({
      id,
      displayName: user ? user.username : id,
      externalAuths: {}
    });
  }

  return c.json(results);
});

export default oauth;
