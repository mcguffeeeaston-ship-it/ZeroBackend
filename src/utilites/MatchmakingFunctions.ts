import crypto from "crypto";
import logger from "./logger";

export interface GameSession {
  id: string;
  ownerId: string;
  ownerName: string;
  serverName: string;
  serverAddress: string;
  serverPort: number;
  maxPublicPlayers: number;
  openPublicPlayers: number;
  maxPrivatePlayers: number;
  openPrivatePlayers: number;
  attributes: Record<string, any>;
  publicPlayers: string[];
  privatePlayers: string[];
  totalPlayers: number;
  allowJoinInProgress: boolean;
  shouldAdvertise: boolean;
  isDedicated: boolean;
  usesStats: boolean;
  allowInvites: boolean;
  usesPresence: boolean;
  allowJoinViaPresence: boolean;
  allowJoinViaPresenceFriendsOnly: boolean;
  buildUniqueId: string;
  lastUpdated: string;
  started: boolean;
}

export const sessions = new Map<string, GameSession>();

export const defaultMatchmakingConfig = {
  ip: process.env.GAMESERVER_IP || "127.0.0.1",
  port: parseInt(process.env.GAMESERVER_PORT || "7777", 10),
  clientVersion: process.env.CLIENT_VERSION || "++Fortnite+Release-11.50-CL-11603517-Windows",
  region: process.env.REGION || "NAE",
  playlist: process.env.PLAYLIST || "Playlist_DefaultSolo"
};

export function createMatchmakingTicket(accountId: string, playlist: string = defaultMatchmakingConfig.playlist): {
  ticket: string;
  payload: string;
  signature: string;
} {
  const payload = JSON.stringify({
    accountId,
    playlist,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString("hex")
  });

  const signature = crypto.createHash("sha256").update(payload).digest("hex");
  const ticket = Buffer.from(payload).toString("base64");

  return { ticket, payload, signature };
}

export function parseMatchmakingTicket(ticket: string): any {
  try {
    const raw = Buffer.from(ticket, "base64").toString("utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function registerGameServer(data: Partial<GameSession>): GameSession {
  const sessionId = data.id || crypto.randomUUID().replace(/-/g, "");
  const session: GameSession = {
    id: sessionId,
    ownerId: data.ownerId || crypto.randomUUID().replace(/-/g, ""),
    ownerName: data.ownerName || "ZeroDedicatedServer",
    serverName: data.serverName || "Zero Backend Server",
    serverAddress: data.serverAddress || defaultMatchmakingConfig.ip,
    serverPort: data.serverPort || defaultMatchmakingConfig.port,
    maxPublicPlayers: data.maxPublicPlayers || 100,
    openPublicPlayers: data.openPublicPlayers || 99,
    maxPrivatePlayers: 0,
    openPrivatePlayers: 0,
    attributes: data.attributes || {
      REGION_s: defaultMatchmakingConfig.region,
      GAMEMODE_s: "FORTATHENA",
      PLAYLISTNAME_s: defaultMatchmakingConfig.playlist
    },
    publicPlayers: data.publicPlayers || [],
    privatePlayers: [],
    totalPlayers: data.totalPlayers || 1,
    allowJoinInProgress: true,
    shouldAdvertise: true,
    isDedicated: true,
    usesStats: false,
    allowInvites: true,
    usesPresence: true,
    allowJoinViaPresence: true,
    allowJoinViaPresenceFriendsOnly: false,
    buildUniqueId: data.buildUniqueId || defaultMatchmakingConfig.clientVersion,
    lastUpdated: new Date().toISOString(),
    started: false
  };

  sessions.set(sessionId, session);
  logger.info(`Registered Game Server session ${sessionId} on ${session.serverAddress}:${session.serverPort}`);
  return session;
}

export function getAvailableSession(): GameSession {
  for (const session of sessions.values()) {
    if (session.openPublicPlayers > 0) {
      return session;
    }
  }

  const defaultSessionId = crypto.randomUUID().replace(/-/g, "");
  const defaultSession: GameSession = {
    id: defaultSessionId,
    ownerId: crypto.randomUUID().replace(/-/g, ""),
    ownerName: "ZeroHost",
    serverName: "Zero Backend 11.50 Dedicated Server",
    serverAddress: defaultMatchmakingConfig.ip,
    serverPort: defaultMatchmakingConfig.port,
    maxPublicPlayers: 100,
    openPublicPlayers: 99,
    maxPrivatePlayers: 0,
    openPrivatePlayers: 0,
    attributes: {
      REGION_s: defaultMatchmakingConfig.region,
      GAMEMODE_s: "FORTATHENA",
      ALLOWBROADCASTING_b: true,
      SUBREGION_s: "VA",
      DCID_s: "FORTNITE-282-125",
      tenant_s: "Fortnite",
      MATCHMAKINGPOOL_s: "Any",
      HOTFIXVERSION_i: 0,
      PLAYLISTNAME_s: defaultMatchmakingConfig.playlist,
      SESSIONKEY_s: crypto.randomUUID().replace(/-/g, "")
    },
    publicPlayers: [],
    privatePlayers: [],
    totalPlayers: 1,
    allowJoinInProgress: true,
    shouldAdvertise: true,
    isDedicated: true,
    usesStats: false,
    allowInvites: true,
    usesPresence: true,
    allowJoinViaPresence: true,
    allowJoinViaPresenceFriendsOnly: false,
    buildUniqueId: defaultMatchmakingConfig.clientVersion,
    lastUpdated: new Date().toISOString(),
    started: false
  };

  sessions.set(defaultSessionId, defaultSession);
  return defaultSession;
}

export function removeSession(sessionId: string): boolean {
  return sessions.delete(sessionId);
}
