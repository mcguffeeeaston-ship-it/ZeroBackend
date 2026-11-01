import logger from "../utilites/logger";

export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbedOptions {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  footerText?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  timestamp?: string;
  ping?: string;
  webhookUrl?: string;
}

export async function sendDiscordNotification(options: DiscordEmbedOptions): Promise<boolean> {
  const url = options.webhookUrl || process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;

  const payload: any = {
    embeds: [
      {
        title: options.title,
        description: options.description || "",
        color: options.color || 0x3498db,
        fields: options.fields || [],
        footer: { text: options.footerText || "Zero Backend" },
        timestamp: options.timestamp || new Date().toISOString()
      }
    ]
  };

  if (options.ping && options.ping.trim()) {
    payload.content = options.ping.trim();
  }

  if (options.thumbnailUrl) {
    payload.embeds[0].thumbnail = { url: options.thumbnailUrl };
  }

  if (options.imageUrl) {
    payload.embeds[0].image = { url: options.imageUrl };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err: any) {
    logger.warn(`Failed to send Discord notification: ${err?.message || err}`);
    return false;
  }
}

export async function sendBackendOnlineNotification(): Promise<void> {
  const port = process.env.PORT || "3551";
  const xmppPort = process.env.XMPP_PORT || "5222";
  const clientVersion = process.env.CLIENT_VERSION || "++Fortnite+Release-11.50-CL-11603517-Windows";
  const region = process.env.REGION || "NAE";
  const startupPing = process.env.DISCORD_STARTUP_PING || "";

  await sendDiscordNotification({
    title: "Zero Backend is Online!",
    description: "The Zero Fortnite Backend has successfully booted and is ready to accept player connections.",
    color: 0x2ecc71,
    ping: startupPing,
    fields: [
      { name: "Server Status", value: "ONLINE (100% Operational)", inline: true },
      { name: "Target Build", value: clientVersion.split("-")[1] || "11.50", inline: true },
      { name: "Region", value: region, inline: true },
      { name: "HTTP & MMS API", value: `http://127.0.0.1:${port}`, inline: true },
      { name: "XMPP Service", value: `127.0.0.1:${xmppPort}`, inline: true },
      { name: "Framework", value: "Bun + Hono", inline: true }
    ],
    footerText: "Zero Backend - Server Started"
  });

  logger.info("Sent backend online notification to Discord.");
}

export async function sendShopNotification(
  daily: Array<{ name: string; price: number; rarity: string; type: string }>,
  featured: Array<{ name: string; price: number; rarity: string; type: string }>,
  nextReset: Date
): Promise<void> {
  const shopWebhookUrl = process.env.DISCORD_SHOP_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
  if (!shopWebhookUrl) return;

  const shopPing = process.env.DISCORD_SHOP_PING || "";
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60)));

  const featuredText = featured.length > 0
    ? featured.map((item) => `• **${item.name}** (${item.rarity}) - **${item.price.toLocaleString()}** V-Bucks`).join("\n")
    : "No featured items today";

  const dailyText = daily.length > 0
    ? daily.map((item) => `• **${item.name}** (${item.rarity}) - **${item.price.toLocaleString()}** V-Bucks`).join("\n")
    : "No daily items today";

  await sendDiscordNotification({
    title: "Zero Backend Item Shop Rotation",
    description: `The Item Shop has updated! Jump into the lobby to check out today's cosmetics.\nShop resets in **${hoursRemaining} hours**.`,
    color: 0x9b59b6,
    ping: shopPing,
    webhookUrl: shopWebhookUrl,
    fields: [
      { name: "Featured Cosmetics", value: featuredText, inline: false },
      { name: "Daily Cosmetics", value: dailyText, inline: false }
    ],
    footerText: "Zero Backend - Daily Shop Rotation"
  });

  logger.info("Sent shop rotation notification to Discord.");
}

export async function initDiscord(): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (webhookUrl) {
    logger.info("Discord Webhook integration ready.");
    await sendBackendOnlineNotification();
  }

  if (botToken) {
    logger.info("Discord Bot token provided.");
  }
}

export default {
  initDiscord,
  sendDiscordNotification,
  sendBackendOnlineNotification,
  sendShopNotification
};
