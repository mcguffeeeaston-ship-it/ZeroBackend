import { Hono } from "hono";
import { getFriends, saveFriends, getUserById } from "../utilites/database";
import { activeTokens } from "./oauth";
import logger from "../utilites/logger";

const social = new Hono();

export interface PartyMember {
  account_id: string;
  meta: Record<string, string>;
  connections: Array<{
    id: string;
    meta: Record<string, string>;
    connected_at: string;
    updated_at: string;
    yield_leadership: boolean;
  }>;
  revision: number;
  updated_at: string;
  joined_at: string;
  role: string;
}

export interface PartyData {
  id: string;
  privacy: string;
  created_at: string;
  updated_at: string;
  config: Record<string, any>;
  invites: any[];
  meta: Record<string, string>;
  members: PartyMember[];
  revision: number;
}

const parties = new Map<string, PartyData>();
const userPartyMap = new Map<string, string>();

function getAccountIdFromReq(c: any): string {
  const auth = c.req.header("authorization") || "";
  const token = auth.replace(/^bearer\s+/i, "").trim();
  const session = activeTokens.get(token);
  return session ? session.accountId : "zero_user";
}

function createParty(accountId: string, displayName: string = "ZeroPlayer"): PartyData {
  const partyId = crypto.randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();

  const member: PartyMember = {
    account_id: accountId,
    meta: {
      "urn:epic:member:dn_s": displayName,
      "urn:epic:member:joinstate_s": "{\"bIsStandby\":false}"
    },
    connections: [
      {
        id: `${accountId}@zero.local`,
        meta: { "urn:epic:conn:platform_s": "WIN", "urn:epic:conn:type_s": "game" },
        connected_at: now,
        updated_at: now,
        yield_leadership: false
      }
    ],
    revision: 0,
    updated_at: now,
    joined_at: now,
    role: "CAPTAIN"
  };

  const party: PartyData = {
    id: partyId,
    privacy: "PUBLIC",
    created_at: now,
    updated_at: now,
    config: {
      type: "DEFAULT",
      joinability: "OPEN",
      discoverability: "ALL",
      sub_type: "default",
      max_size: 4,
      invite_ttl: 14400,
      chat_type: "NONE"
    },
    invites: [],
    meta: {
      "urn:epic:cfg:party-type-id_s": "default",
      "urn:epic:cfg:build-id_s": "1:3:",
      "urn:epic:cfg:join-request-action_s": "Manual",
      "urn:epic:cfg:chat-type_s": "NONE"
    },
    members: [member],
    revision: 0
  };

  parties.set(partyId, party);
  userPartyMap.set(accountId, partyId);
  return party;
}

social.get("/friends/api/v1/*/settings", (c) => {
  return c.json({ acceptInvites: "public", mutualPrivacy: "ALL" });
});

social.put("/friends/api/v1/:accountId/settings", (c) => {
  return c.json({ acceptInvites: "public", mutualPrivacy: "ALL" });
});

social.patch("/friends/api/v1/:accountId/settings", (c) => {
  return c.json({ acceptInvites: "public", mutualPrivacy: "ALL" });
});

social.get("/friends/api/v1/*/blocklist", async (c) => {
  const accountId = getAccountIdFromReq(c);
  const data = await getFriends(accountId);
  return c.json({ blockedUsers: data.list.blocked.map((f: any) => f.accountId) });
});

social.get("/friends/api/public/list/fortnite/*/recentPlayers", (c) => {
  return c.json([]);
});

social.all("/friends/api/v1/*/friends/:friendId/alias", (c) => {
  return c.body(null, 204);
});

social.get("/friends/api/v1/:accountId/friends", async (c) => {
  const accountId = c.req.param("accountId");
  const data = await getFriends(accountId);
  return c.json(
    data.list.accepted.map((f: any) => ({
      accountId: f.accountId,
      groups: [],
      alias: f.alias || "",
      note: "",
      favorite: false,
      created: f.created
    }))
  );
});

social.get("/friends/api/v1/:accountId/incoming", async (c) => {
  const accountId = c.req.param("accountId");
  const data = await getFriends(accountId);
  return c.json(
    data.list.incoming.map((f: any) => ({
      accountId: f.accountId,
      mutual: 0,
      favorite: false,
      created: f.created
    }))
  );
});

social.get("/friends/api/v1/:accountId/outgoing", async (c) => {
  const accountId = c.req.param("accountId");
  const data = await getFriends(accountId);
  return c.json(
    data.list.outgoing.map((f: any) => ({
      accountId: f.accountId,
      favorite: false,
      created: f.created
    }))
  );
});

social.get("/friends/api/v1/:accountId/relations", async (c) => {
  const accountId = c.req.param("accountId");
  const data = await getFriends(accountId);
  const relations: any[] = [];

  data.list.accepted.forEach((f: any) =>
    relations.push({ accountId: f.accountId, status: "ACCEPTED", direction: "OUTBOUND", created: f.created, favorite: false })
  );
  data.list.incoming.forEach((f: any) =>
    relations.push({ accountId: f.accountId, status: "PENDING", direction: "INBOUND", created: f.created, favorite: false })
  );
  data.list.outgoing.forEach((f: any) =>
    relations.push({ accountId: f.accountId, status: "PENDING", direction: "OUTBOUND", created: f.created, favorite: false })
  );

  return c.json(relations);
});

social.get("/friends/api/v1/:accountId/summary", async (c) => {
  const accountId = c.req.param("accountId");
  const data = await getFriends(accountId);
  const response: any = {
    friends: [],
    incoming: [],
    outgoing: [],
    suggested: [],
    blocklist: [],
    settings: { acceptInvites: "public", mutualPrivacy: "ALL" },
    limitsReached: { incoming: false, outgoing: false, accepted: false }
  };

  data.list.accepted.forEach((f: any) =>
    response.friends.push({ accountId: f.accountId, groups: [], mutual: 0, alias: f.alias || "", note: "", favorite: false, created: f.created })
  );
  data.list.incoming.forEach((f: any) =>
    response.incoming.push({ accountId: f.accountId, mutual: 0, favorite: false, created: f.created })
  );
  data.list.outgoing.forEach((f: any) =>
    response.outgoing.push({ accountId: f.accountId, favorite: false, created: f.created })
  );
  data.list.blocked.forEach((f: any) =>
    response.blocklist.push({ accountId: f.accountId })
  );

  return c.json(response);
});

social.get("/friends/api/public/friends/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  const data = await getFriends(accountId);
  return c.json(
    data.list.accepted.map((f: any) => ({
      accountId: f.accountId,
      status: "ACCEPTED",
      direction: "OUTBOUND",
      created: f.created || new Date().toISOString(),
      favorite: false
    }))
  );
});

social.get("/friends/api/public/blocklist/*", async (c) => {
  const accountId = getAccountIdFromReq(c);
  const data = await getFriends(accountId);
  return c.json({ blockedUsers: data.list.blocked.map((f: any) => f.accountId) });
});

social.post("/friends/api/*/friends/:receiverId", async (c) => {
  const senderId = getAccountIdFromReq(c);
  const receiverId = c.req.param("receiverId");

  const senderFriends = await getFriends(senderId);
  const receiverFriends = await getFriends(receiverId);

  const isIncoming = senderFriends.list.incoming.some((f: any) => f.accountId === receiverId);
  const now = new Date().toISOString();

  if (isIncoming) {
    senderFriends.list.incoming = senderFriends.list.incoming.filter((f: any) => f.accountId !== receiverId);
    receiverFriends.list.outgoing = receiverFriends.list.outgoing.filter((f: any) => f.accountId !== senderId);

    senderFriends.list.accepted.push({ accountId: receiverId, created: now });
    receiverFriends.list.accepted.push({ accountId: senderId, created: now });
  } else {
    if (!senderFriends.list.outgoing.some((f: any) => f.accountId === receiverId)) {
      senderFriends.list.outgoing.push({ accountId: receiverId, created: now });
      receiverFriends.list.incoming.push({ accountId: senderId, created: now });
    }
  }

  await saveFriends(senderId, senderFriends);
  await saveFriends(receiverId, receiverFriends);

  return c.body(null, 204);
});

social.delete("/friends/api/*/friends/:receiverId", async (c) => {
  const senderId = getAccountIdFromReq(c);
  const receiverId = c.req.param("receiverId");

  const senderFriends = await getFriends(senderId);
  const receiverFriends = await getFriends(receiverId);

  senderFriends.list.accepted = senderFriends.list.accepted.filter((f: any) => f.accountId !== receiverId);
  senderFriends.list.incoming = senderFriends.list.incoming.filter((f: any) => f.accountId !== receiverId);
  senderFriends.list.outgoing = senderFriends.list.outgoing.filter((f: any) => f.accountId !== receiverId);

  receiverFriends.list.accepted = receiverFriends.list.accepted.filter((f: any) => f.accountId !== senderId);
  receiverFriends.list.incoming = receiverFriends.list.incoming.filter((f: any) => f.accountId !== senderId);
  receiverFriends.list.outgoing = receiverFriends.list.outgoing.filter((f: any) => f.accountId !== senderId);

  await saveFriends(senderId, senderFriends);
  await saveFriends(receiverId, receiverFriends);

  return c.body(null, 204);
});

social.post("/friends/api/*/blocklist/:receiverId", async (c) => {
  const senderId = getAccountIdFromReq(c);
  const receiverId = c.req.param("receiverId");

  const senderFriends = await getFriends(senderId);
  if (!senderFriends.list.blocked.some((f: any) => f.accountId === receiverId)) {
    senderFriends.list.blocked.push({ accountId: receiverId, created: new Date().toISOString() });
    await saveFriends(senderId, senderFriends);
  }

  return c.body(null, 204);
});

social.delete("/friends/api/*/blocklist/:receiverId", async (c) => {
  const senderId = getAccountIdFromReq(c);
  const receiverId = c.req.param("receiverId");

  const senderFriends = await getFriends(senderId);
  senderFriends.list.blocked = senderFriends.list.blocked.filter((f: any) => f.accountId !== receiverId);
  await saveFriends(senderId, senderFriends);

  return c.body(null, 204);
});

social.get("/party/api/v1/Fortnite/user/:accountId/notifications/undelivered/count", (c) => {
  return c.json({ pings: 0, invites: 0 });
});

social.get("/party/api/v1/Fortnite/user/:accountId", async (c) => {
  const accountId = c.req.param("accountId");
  let partyId = userPartyMap.get(accountId);
  let party = partyId ? parties.get(partyId) : null;

  if (!party) {
    const user = await getUserById(accountId);
    party = createParty(accountId, user ? user.username : "ZeroPlayer");
  }

  return c.json({
    current: [party],
    pending: [],
    invites: [],
    pings: []
  });
});

social.post("/party/api/v1/Fortnite/parties", async (c) => {
  const accountId = getAccountIdFromReq(c);
  const user = await getUserById(accountId);
  const party = createParty(accountId, user ? user.username : "ZeroPlayer");
  return c.json(party);
});

social.get("/party/api/v1/Fortnite/parties/:partyId", (c) => {
  const partyId = c.req.param("partyId");
  const party = parties.get(partyId);
  if (!party) {
    return c.json(
      {
        errorCode: "errors.com.epicgames.party.party_not_found",
        errorMessage: "Party not found",
        numericErrorCode: 51002
      },
      404
    );
  }
  return c.json(party);
});

social.patch("/party/api/v1/Fortnite/parties/:partyId", async (c) => {
  const partyId = c.req.param("partyId");
  const party = parties.get(partyId);
  if (!party) return c.body(null, 404);

  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  if (body.meta?.update) {
    Object.assign(party.meta, body.meta.update);
  }
  if (body.config) {
    Object.assign(party.config, body.config);
  }
  party.revision += 1;
  party.updated_at = new Date().toISOString();

  return c.body(null, 204);
});

social.post("/party/api/v1/Fortnite/parties/:partyId/members/:accountId/join", async (c) => {
  const partyId = c.req.param("partyId");
  const accountId = c.req.param("accountId");
  const party = parties.get(partyId);

  if (!party) {
    return c.json(
      {
        errorCode: "errors.com.epicgames.social.party.party_not_found",
        errorMessage: `Party [${partyId}] does not exist.`,
        numericErrorCode: 51002,
        originatingService: "party",
        intent: "prod"
      },
      404
    );
  }

  let body: any = {};
  try {
    body = await c.req.json();
  } catch (e) {}

  const user = await getUserById(accountId);
  const now = new Date().toISOString();

  const newMember: PartyMember = {
    account_id: accountId,
    meta: body.meta || { "urn:epic:member:dn_s": user ? user.username : "ZeroPlayer" },
    connections: [
      {
        id: `${accountId}@zero.local`,
        meta: body.connection?.meta || { "urn:epic:conn:platform_s": "WIN", "urn:epic:conn:type_s": "game" },
        connected_at: now,
        updated_at: now,
        yield_leadership: false
      }
    ],
    revision: 0,
    updated_at: now,
    joined_at: now,
    role: "MEMBER"
  };

  party.members = party.members.filter((m) => m.account_id !== accountId);
  party.members.push(newMember);
  party.revision += 1;
  party.updated_at = now;
  userPartyMap.set(accountId, partyId);

  return c.json({ status: "JOINED", party_id: partyId });
});

social.delete("/party/api/v1/Fortnite/parties/:partyId/members/:accountId", (c) => {
  const partyId = c.req.param("partyId");
  const accountId = c.req.param("accountId");
  const party = parties.get(partyId);

  if (party) {
    party.members = party.members.filter((m) => m.account_id !== accountId);
    party.revision += 1;
    party.updated_at = new Date().toISOString();
    userPartyMap.delete(accountId);
  }

  return c.body(null, 204);
});

export default social;
