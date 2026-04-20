# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the bot locally
node src/index.js

# Or with npm
npm start

# Build and run with Docker (production)
docker-compose up -d --build

# View live logs
docker-compose logs -f rexbot_prod

# Restart container
docker-compose restart rexbot_prod

# Full update cycle
git pull && docker-compose up -d --build
```

No test suite exists. All testing is manual via WhatsApp groups.

---

## Architecture Overview

**REX BOT V2** is a commercial WhatsApp group management bot built on `@whiskeysockets/baileys`. It implements a SaaS licensing model where the bot only operates in groups with an active license, auto-leaving unlicensed ones.

### Request Lifecycle

Every incoming WhatsApp message flows through:

```
messages.upsert (Baileys event)
  └── message.handler.js
        ├── Build ctx (JID, sender, isGroup, isAdmin, isBotAdmin, args, reply(), react())
        ├── remote.middleware    → intercept .remote spoofed context
        ├── whitelist.middleware → filter by ALLOWED_GROUPS env var
        ├── commercial.middleware → validate group license (auto-leave if expired)
        ├── moderation.service  → log message activity
        ├── antilink.middleware  → detect and warn/kick for links
        └── CommandRegistry.findCommand(text) → execute(sock, m, ctx)
```

### Command System

All commands live in `src/commands/` organized by category (`admin/`, `fun/`, `games/`, `info/`, `media/`). `command.registry.js` auto-discovers and loads every file matching `*.command.js` recursively.

**To add a new command:**
1. Create `src/commands/<category>/mycommand.command.js`
2. Extend `BaseCommand`, define `name` and `alias` in constructor
3. Implement `async execute(sock, m, ctx)`
4. It auto-loads — no registration needed

**Guard pattern** — throw structured errors from `execute()`:
- `throw { silent: true }` — silently ignore (wrong context)
- `throw { reply: '❌ message' }` — send feedback to user
- Guards are pre-built in `BaseCommand`: `requireGroup`, `requireOwner`, `requireCommercialAdmin`, `requireAdmin`, `requireBotAdmin`

### Permission Hierarchy

```
OWNER_JID (env var)          → requireOwner()
Commercial Admins (DB)       → requireCommercialAdmin()  [async]
WhatsApp Group Admins        → requireAdmin()
Regular users                → no guard needed
```

### Data Layer

`src/data/db.js` exports named `JsonRepository` instances (one per concern). Each repository:
- Caches reads in memory
- Serializes writes via a queue (no concurrent writes)
- Uses atomic `write-to-tmp → rename` to prevent corruption

```js
const db = require('../data/db');
const data = await db.groupsDirectory.read();
await db.groupsDirectory.write(updatedData);
```

**Never** access `data/*.json` files directly — always go through `db.*`.

### Session / Per-Group RAM State

`src/core/session/group.session.manager.js` provides per-JID transient state (active raffles, roulette participants, etc.) with a 1-hour TTL and Mutex-protected access. Accessed via `ctx.groupState`.

### Commercial License System

`src/services/commercial.service.js` manages:
- Owner identity (`OWNER_JID` env var)
- Commercial admin list (stored in `data/commercial.json`)
- Group licenses with type `days | weeks | months | unlimited` and ISO expiry timestamp (stored in `data/groups_directory.json`)

Groups with expired/no license receive an auto-leave after a warning message. The following commands bypass this check: `/activate`, `/list-groups`, `/add-admin`, `/remove-admin`, `/anuncio`, `/alias`, `.cm-admin`, `.remote`.

### Key Services

| Service | Responsibility |
|---|---|
| `commercial.service` | License lifecycle, admin management |
| `group.registry` | Group directory, alias resolution, operators |
| `command-control.service` | Per-group enable/disable of commands |
| `moderation.service` | Message activity logging |
| `antilink.service` | Link detection + warning strikes |
| `media.service` | ffmpeg queue for sticker/image conversion |
| `auction.service` / `raffle.service` | Game state logic |

### Reconnection & Shutdown

`src/core/bot.js` handles exponential backoff reconnect (up to 10 attempts, starting at 2s). `src/index.js` catches `SIGTERM`/`SIGINT` to flush auth credentials before exit — critical in Docker.

### Environment Variables

| Variable | Required | Default |
|---|---|---|
| `OWNER_JID` | Yes | `524492842300@s.whatsapp.net` |
| `NODE_ENV` | Yes | `development` |
| `TZ` | Yes | `America/Mexico_City` |
| `ALLOWED_GROUPS` | No | (empty = all groups pass whitelist) |

### Docker Volumes

- `auth_data:/app/auth_info` — WhatsApp session credentials (losing this requires re-scan QR)
- `db_data:/app/data` — all JSON databases
- `./media:/app/media` — media files (bind mount)
