import logger from "../utilites/logger";
import { createExchangeCode } from "../routes/oauth";
import { findOrCreateUser, getUserById, getUserByDiscordId } from "../utilites/database";

export async function sendDiscordWebhook(
  title: string,
  description: string,
  color: number = 0x3498db
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title,
            description,
            color,
            footer: { text: "Zero Backend" },
            timestamp: new Date().toISOString()
          }
        ]
      })
    });
  } catch (err: any) {
    logger.warn(`Failed to send Discord webhook: ${err?.message || err}`);
  }
}

export async function initDiscord(): Promise<void> {
  const botToken = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (webhookUrl) {
    logger.info("Discord Webhook integration initialized.");
    sendDiscordWebhook("Zero Backend Online", "Zero Backend has started and is listening for connections.", 0x2ecc71);
  }

  if (!botToken) {
    logger.info("Discord Bot token not configured in .env. Bot feature will remain idle.");
    return;
  }

  logger.info("Discord Bot integration enabled.");
}

export default {
  initDiscord,
  sendDiscordWebhook
};
