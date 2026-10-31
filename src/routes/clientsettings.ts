import { Hono } from "hono";
import { getUserCloudFile, saveUserCloudFile, listUserCloudFiles } from "../utilites/database";
import logger from "../utilites/logger";

const clientsettings = new Hono();

clientsettings.get("/clientsettings/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const data = await getUserCloudFile(accountId, "ClientSettings.Sav");

  if (!data) {
    return c.text("ClientSettings not found", 404);
  }

  c.header("Content-Type", "application/octet-stream");
  c.header("Content-Disposition", 'attachment; filename="ClientSettings.Sav"');
  return c.body(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
});

clientsettings.post("/clientsettings/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const arrayBuffer = await c.req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    return c.json({ error: "Empty payload" }, 400);
  }

  await saveUserCloudFile(accountId, "ClientSettings.Sav", buffer);
  logger.info(`Updated ClientSettings.Sav for ${accountId} (${buffer.length} bytes)`);

  return c.json({ success: true, size: buffer.length });
});

clientsettings.delete("/clientsettings/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  await saveUserCloudFile(accountId, "ClientSettings.Sav", Buffer.alloc(0));
  return c.json({ success: true, message: "Client settings cleared" });
});

clientsettings.get("/clientsettings/:accountId/info", async (c) => {
  const accountId = c.req.param("accountId");
  const files = await listUserCloudFiles(accountId);
  return c.json({ accountId, files });
});

export default clientsettings;
