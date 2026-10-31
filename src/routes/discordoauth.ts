import { Hono } from "hono";
import { findOrCreateUser, getUserByDiscordId, saveUser, UserModel } from "../utilites/database";
import { createExchangeCode } from "./oauth";
import logger from "../utilites/logger";

const discordoauth = new Hono();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "http://localhost:3551/auth/discord/callback";

discordoauth.get("/auth/discord", (c) => {
  if (!CLIENT_ID) {
    return c.html(`
      <html>
        <head><title>Discord OAuth - Zero Backend</title></head>
        <body style="font-family: sans-serif; background: #121212; color: #fff; text-align: center; padding-top: 50px;">
          <h2>Discord OAuth Not Configured</h2>
          <p>Please provide <code>DISCORD_CLIENT_ID</code> and <code>DISCORD_CLIENT_SECRET</code> in your <code>.env</code> file.</p>
        </body>
      </html>
    `);
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify%20email`;

  return c.redirect(url);
});

discordoauth.get("/auth/discord/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.text("Missing OAuth code parameter", 400);
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logger.error(`Discord token exchange failed: ${errText}`);
      return c.text("Discord token exchange failed", 400);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; token_type: string };

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` }
    });

    if (!userRes.ok) {
      return c.text("Failed to fetch Discord user profile", 400);
    }

    const discordUser = (await userRes.json()) as {
      id: string;
      username: string;
      email?: string;
      avatar?: string;
    };

    let user = await getUserByDiscordId(discordUser.id);
    if (!user) {
      user = await findOrCreateUser(discordUser.username);
      user.discordId = discordUser.id;
      user.discordUsername = discordUser.username;
      await saveUser(user);
    }

    const exchangeCode = createExchangeCode(user.accountId);
    logger.info(`Discord user ${discordUser.username} (${discordUser.id}) authenticated. Exchange code issued.`);

    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zero Backend - Authenticated</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f111a; color: #eceff4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1a1c2b; border: 1px solid #2e3440; border-radius: 12px; padding: 32px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
            h1 { color: #88c0d0; margin-top: 0; font-size: 24px; }
            .code-box { background: #242938; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 18px; color: #a3be8c; margin: 20px 0; word-break: break-all; }
            p { color: #d8dee9; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Logged In Successfully!</h1>
            <p>Welcome, <strong>${user.username}</strong>.</p>
            <p>Your launcher exchange code is:</p>
            <div class="code-box">${exchangeCode}</div>
            <p style="font-size: 13px; color: #81a1c1;">Use this code to launch Fortnite through your custom launcher.</p>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    logger.error(`Error in Discord OAuth: ${err?.message || err}`);
    return c.text("Authentication error occurred", 500);
  }
});

export default discordoauth;
