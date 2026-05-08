# Discord Daily Check-in

A Discord bot that automatically performs daily check-ins for **Arknights: Endfield** on your behalf.

- Runs every day at **00:00 AM** (with a backup at **12:00 PM**) using the `Asia/Hong_Kong` timezone.

---

## Requirements

- [Node.js](https://nodejs.org/) >= 22.13.0
- [pnpm](https://pnpm.io/) (recommended) or npm
- A MongoDB instance (self-hosted or remote)
- A Discord bot token

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/NekoCyan/Discord-Daily-Checkin.git
cd Discord-Daily-Checkin
```

### 2. Install dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Your Discord bot token |
| `MONGODB_URI` | MongoDB connection URI |
| `MONGODB_NAME` | Database name (default: `DiscordDailyCheckin`) |

---

## Running the Bot

### Without Docker

Use `.env` for your environment file, then start the bot:

```bash
# Using pnpm
pnpm start

# Using npm
npm run start
```

### With Docker

Use `.env.production` as your environment file:

```bash
cp .env.example .env.production
# Fill in .env.production with your values
```

**Option A — You already have a MongoDB URI**

Set `MONGODB_URI` in `.env.production` to your remote connection string, then run:

```bash
pnpm docker:prod
```

**Option B — Run MongoDB locally via Docker**

Leave `MONGODB_URI` as the default (`mongodb://mongo:27017`). The mongo service will start alongside the bot and its data will be persisted to `./data/mongo` in the workspace:

```bash
pnpm docker:prod:mongo
```

---

## Retrieving Your Endfield Account Token

The bot requires your Arknights: Endfield account token to perform check-ins on your behalf.

1. Open the [Arknights: Endfield check-in portal](https://game.skport.com/endfield/sign-in) and **log in**.
2. Open your browser's DevTools (`F12`) and go to the **Console** tab.
3. Paste and run the following snippet:

```js
const res = await fetch('https://web-api.skport.com/cookie_store/account_token', {
  headers: { 'accept': 'application/json', 'x-language': 'en-us' },
  credentials: 'include',
});
const { data: { content } } = await res.json();

if (content) {
  const el = document.createElement('textarea');
  el.value = content;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  console.log(content);
  alert('Account token copied to clipboard!');
} else {
  alert('Failed to retrieve account token.');
}
```

4. The token will be printed in the console and copied to your clipboard automatically.
5. Use the token with the bot's `/endfield set-account-token` slash command to register your account.

---

## License

[MIT](LICENSE)
