# Rex Bot (botsito) 🦖

Rex Bot is a WhatsApp bot built using Node.js and the [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys) library. It is designed to manage WhatsApp groups, run raffles (rifas), moderate links, and provide fun interactions for group members.

## Features ✨

* **Group Administration:** Promote, demote, open, and close the group.
* **Anti-Link System:** Protects groups from unauthorized links. Warns users on the first offense and removes them on the second strike (2 strikes = ban). Logs interactions.
* **Whitelist/Security:** Restricts bot operations to authorized groups defined in `.env`.
* **Raffles & Auctions (Subastas y Rifas):**
  * `.ruleta` - Run quick raffles.
  * Reaction-based inscriptions.
  * Manage blacklists (Ruletaban).
* **Fun & Interactive:** Kiss, tickle, and other social interactions.
* **Optimized for low-powered devices:** Pre-configured settings to avoid downloading chat history and link previews, making it suitable and fast for Raspberry Pi hosting.

## Requirements 📦

* Node.js (v14 or higher recommended)
* `npm` or `yarn`

## Installation 🛠️

1. **Clone the repository or download the code.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure the Environment variables:**
   Create a `.env` file in the root directory based on your needs.
   ```env
   ALLOWED_GROUPS="1234567890-123456@g.us, 0987654321-654321@g.us"
   ```
   *(You can obtain the exact Group ID using the `.id` command in a chat where the bot is running).*

## Usage 🚀

Start the bot using node:
```bash
node index.js
```
*On the first run, a QR code will appear in the terminal. Scan it with your WhatsApp mobile app (Linked Devices) to log in.*

**(For production, it is recommended to use PM2):**
```bash
pm2 start index.js --name "RexBot"
```

## Available Commands 📜

*(Send `.cm` or `.cm-sc` directly to the bot to see this dynamically.)*

### 🛠️ Interacción & Info
* `.cm` - Displays the main help menu.
* `.cm-sc` - Displays secret/admin menus.
* `.n` - Forward/Edit media text.
* `.user` - Displays your user info and role.
* `.id` - Requests the Group/Chat ID (Logs it to the terminal).
* `.ping` - Checks bot status.

### 🛡️ Moderation & Admins
* `.antilink on` - Activates the anti-link shield (2 Strikes = Ban).
* `.antilink off` - Deactivates the shield.
* `.antilink logs` - Shows antilink logs.
* `.shh` - Warns about NO SPAM ⚠️.
* `.promote` / `.demote` - Manage admin roles.
* `.close [time]` / `.open` - Closes/Opens the group chat.

### 🎟️ Rifas y Tómbola (Raffles)
* `.ruleta all/admin` - Quick raffle.
* `.ruleta add m` - Inscription via message reactions.
* `.ruleta cs` - Draw from inscribed members.
* `.ruletaban` - Ban roulette for fun/moderation.

### ✨ Fun
* `.kiss` / `.tickle` - Social interactions.
* `.joto` / `.papoi` / `.1500` / `.smoke` - General entertainment.

## Troubleshooting

- **QR Code doesn't show:** Ensure your terminal supports QR rendering or enlarge the terminal window.
- **Bot doesn't respond:** 
  1. Make sure the group ID is properly added to `ALLOWED_GROUPS` in `.env`.
  2. Make sure the bot process hasn't crashed (`auth_info` folder reset might be needed if session is permanently broken).

## Disclaimer

This bot is a fan-made project utilizing the Baileys library and is not officially affiliated with WhatsApp Inc. Please respect WhatsApp's Terms of Service to prevent your number from being banned.
