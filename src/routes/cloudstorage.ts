import { Hono } from "hono";
import { sha1, sha256, getUserCloudFile, saveUserCloudFile, listUserCloudFiles } from "../utilites/database";

const cloudstorage = new Hono();

const systemFiles: Record<string, string> = {
  "DefaultEngine.ini": `[OnlineSubsystemMcp.Xmpp]
bUseSSL=false
ServerAddr="127.0.0.1"
ServerPort=5222

[OnlineSubsystemMcp.Xmpp.Prod]
bUseSSL=false
ServerAddr="127.0.0.1"
ServerPort=5222

[/Script/Qos.QosRegionManager]
NumPingFailuresToError=10

[/Script/FortniteGame.FortMatchmaking]
bDisableMatchmaking=false
bEnableMatchmakingTrace=true
`,
  "DefaultGame.ini": `[/Script/FortniteGame.FortGameSessionDedicatedAthena]
bRequiresWarmupEarlyExit=false

[/Script/FortniteGame.FortPlaylistAthena]
bAllowUserPickedCustomCreativeMatchmaking=true
`,
  "DefaultRuntimeOptions.ini": `[RuntimeOptions]
bDisableVoiceChat=false
bEnableReplays=true
bEnableInGamePurchases=true
`
};

cloudstorage.get("/cloudstorage/system", (c) => {
  const result = Object.entries(systemFiles).map(([filename, content]) => {
    const buffer = Buffer.from(content, "utf-8");
    return {
      uniqueFilename: filename,
      filename,
      hash: sha1(buffer),
      hash256: sha256(buffer),
      length: buffer.length,
      contentType: "application/octet-stream",
      uploaded: new Date().toISOString(),
      storageType: "S3",
      doNotCache: false
    };
  });

  return c.json(result);
});

cloudstorage.get("/cloudstorage/system/:file", (c) => {
  const filename = c.req.param("file");
  const content = systemFiles[filename];

  if (!content) {
    return c.text("File not found", 404);
  }

  c.header("Content-Type", "application/octet-stream");
  return c.body(content);
});

cloudstorage.get("/cloudstorage/user/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const files = await listUserCloudFiles(accountId);
  return c.json(files);
});

cloudstorage.get("/cloudstorage/user/:accountId/:file", async (c) => {
  const accountId = c.req.param("accountId");
  const file = c.req.param("file");
  const content = await getUserCloudFile(accountId, file);

  if (!content) {
    return c.body(null, 404);
  }

  c.header("Content-Type", "application/octet-stream");
  return c.body(content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer);
});

cloudstorage.put("/cloudstorage/user/:accountId/:file", async (c) => {
  const accountId = c.req.param("accountId");
  const file = c.req.param("file");

  const arrayBuffer = await c.req.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await saveUserCloudFile(accountId, file, buffer);
  return c.body(null, 204);
});

export default cloudstorage;
