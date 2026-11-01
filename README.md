# Zero Backend

![Banner](https://cdn.discordapp.com/attachments/1329918037213581402/1330257829050847322/Copy_of_Untitled_Design.png?ex=678d52a5&is=678c0125&hm=7da6d05cd8a02aa62d4bd37fac9f30e3918d8aa9621ad8a54ae18b465a07feeb&)

[![Maintained with Bun](https://img.shields.io/badge/maintained%20with-bun-ac98ff.svg?style=for-the-badge&logo=bun)](https://bun.sh/)
[![Runtime: Hono](https://img.shields.io/badge/Framework-Hono-E36002?style=for-the-badge&logo=hono)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**Zero Backend** is a high-performance, universal Fortnite backend written in TypeScript with **Bun** and **Hono**, designed as a 1:1 replica of original Fortnite service endpoints.

---

## Features

- [x] **Full Authentication & OAuth 2.0**: Client credentials, exchange codes, token verification, and sessions kill endpoints.
- [x] **Native WebSocket Matchmaker (MMS)**: State machine protocol (`Connecting` ➔ `Waiting` ➔ `Queued` ➔ `SessionAssignment`).
- [x] **XMPP Server**: Standalone TCP service on port 5222 with PLAIN SASL, live presence broadcasting, and party/whisper messaging.
- [x] **Party (V1 & V2)**: Full party creation, member joins, metadata updates, privacy toggles, invites, and pings.
- [x] **Friends & Social API**: Friend requests, accept, decline, block/unblock, outgoing/incoming relations, and summaries.
- [x] **GameServer Integration & Match Rewards**:
  - Auto-registration and heartbeats (`/gameserver/notify`, `/gameserver/register`, `/gameserver/heartbeat`, `/gameserver/list`).
  - Project Reboot 3.0 hooks (`/joinable` and `/notjoinable`).
  - V-Bucks on kill & Victory Royale rewards (`/api/elo/kill`, `/api/elo/win`).
  - Arena Hype and Division progression.
- [x] **Stats & Leaderboards**:
  - Global kills, wins, score, and Arena Hype leaderboards.
  - Player stats profiles and Statsproxy v2 query endpoints.
- [x] **Event Timeline & Calendar**: Season event flags, Gold Prop mini-events, Winterfest, and store rotation timers.
- [x] **Support-A-Creator (SAC)**: Creator code validation and profile linking (`SetAffiliateName`).
- [x] **Profile & MCP Operations**:
  - `ClientQuestLogin` (daily login rewards, challenges, level 100 battle pass stats).
  - `QueryProfile`, `EquipBattleRoyaleCustomization`, `SetCosmeticLockerSlot`, `SetCosmeticLockerBanner`, `SetMtxPlatform`.
  - Save The World (`campaign`) and Creative profile support.
  - Battle Pass tier purchasing (`PurchaseBattlePassTierOffers`) and item shop purchases (`PurchaseCatalogEntry`).
  - Gifting items between friends (`GiftCatalogEntry`).
  - Default unlocked cosmetics, emotes, wraps, and pickaxes.
- [x] **Cloudstorage & ClientSettings**: System INI distribution (`DefaultEngine.ini`, `DefaultGame.ini`) and user `ClientSettings.Sav` persistence.
- [x] **Item Shop Auto-Rotation & Discord Shop Pings**: Dynamic storefront rotation with Discord embeds and role pings.
- [x] **Discord Integration & Startup Alerts**: Server online notifications, OAuth account linking, launcher exchange codes, and webhook alerts.
- [x] **Admin Dashboard & Management**:
  - Web management dashboard (`GET /dashboard`) for inspecting online servers, users, and item shop status.
  - Account moderation APIs (`/api/admin/ban/:accountId` & `/api/admin/unban/:accountId`).
  - Creative island mnemonic code lookup (`/links/api/fn/mnemonic/:code`).
  - EULA, terms, and privacy policy endpoints.

---

## Requirements

- [**Bun**](https://bun.sh) (v1.1+ recommended)
- [**MongoDB**](https://www.mongodb.com/docs/manual/installation/) (Optional - automated in-memory fallback cache is included)

---

## Getting Started

### 1. Installation

Run the installation script or use Bun directly:

```bash
install-packages.bat
# or
bun install
```

### 2. Configuration

Copy the example environment file and configure your options:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP API & WebSocket MMS Port | `3551` |
| `MONGODB` | MongoDB connection URI | `mongodb://127.0.0.1:27017/zerobackend` |
| `GAMESERVER_IP` | Dedicated game server IP | `127.0.0.1` |
| `GAMESERVER_PORT` | Dedicated game server port | `7777` |
| `REGION` | Matchmaking server region | `NAE` |
| `PLAYLIST` | Default playlist name | `Playlist_DefaultSolo` |
| `CLIENT_VERSION` | Target Fortnite client build | `++Fortnite+Release-11.50-CL-11603517-Windows` |
| `XMPP_PORT` | Native TCP XMPP server port | `5222` |
| `XMPP_DOMAIN` | XMPP JID domain | `zero.local` |
| `DISCORD_WEBHOOK_URL` | Discord webhook for server alerts | *(Optional)* |
| `DISCORD_CLIENT_ID` | Discord application OAuth client ID | *(Optional)* |
| `DISCORD_CLIENT_SECRET` | Discord application OAuth secret | *(Optional)* |

### 3. Start the Server

```bash
start.bat
# or
bun src/index.ts
```

---

## API Overview

| Service | Endpoint Pattern | Description |
|---|---|---|
| **Status** | `GET /` | Server health and service info |
| **Lightswitch** | `GET /lightswitch/api/service/bulk/status` | Fortnite service status (UP) |
| **Waiting Room** | `GET /waitingroom/api/waitingroom` | 204 bypass for queue screens |
| **Auth** | `POST /account/api/oauth/token` | Grant types: `password`, `exchange_code`, `client_credentials` |
| **Matchmaker** | `GET /fortnite/api/game/v2/matchmakingservice/ticket/player/:accountId` | Matchmaking ticket issuer |
| **Matchmaker WS** | `ws://127.0.0.1:3551` | Native WebSocket matchmaking protocol |
| **MCP** | `POST /fortnite/api/game/v2/profile/:accountId/client/:operation` | Profile mutations and locker management |
| **Cloudstorage** | `GET /fortnite/api/cloudstorage/system` | INI configuration files |
| **Timeline** | `GET /fortnite/api/calendar/v1/timeline` | Active events and season timeline |
| **Affiliate** | `GET /affiliate/api/public/affiliates/slug/:slug` | Support-A-Creator code validation |
| **Friends** | `GET /friends/api/v1/:accountId/summary` | Friend relationships and lists |
| **Party** | `GET /party/api/v1/Fortnite/user/:accountId` | Party lookup and synchronization |
| **GameServer** | `POST /api/elo/kill`, `POST /api/elo/win` | Real-time match rewards (V-Bucks, Hype) |
| **Leaderboards** | `GET /*/api/statsv2/leaderboards/:leaderboardName` | Arena Hype & Kills leaderboards |
| **Admin Dashboard**| `GET /dashboard` | Web browser control panel & server monitor |
| **Moderation** | `POST /api/admin/ban/:accountId` | Account ban and restriction management |
| **Creative** | `GET /links/api/fn/mnemonic/:code` | Creative island code resolver |

---

## Features Implemented

- [x] Battle pass tiered purchase flow
- [x] Save The World (STW) profile operations
- [x] In-game gifting between friends
- [x] Web Admin & Server Monitor Dashboard
- [x] Ban enforcement & account status checks
