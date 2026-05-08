# Discord Daily Check-in

A Discord bot that automatically performs daily check-ins for **Arknights: Endfield** on your behalf.

- Runs every day at **00:00 AM** (with a backup at **12:00 PM**) using the `Asia/Hong_Kong` timezone.

---

## Environment Variables

| Variable             | Description                                         | Required                             |
| -------------------- | --------------------------------------------------- | ------------------------------------ |
| `DISCORD_TOKEN`      | Your Discord bot token                              | Yes                                  |
| `MONGODB_URI`        | MongoDB connection URI                              | Yes                                  |
| `MONGODB_NAME`       | Database name                                       | Yes (default: `DiscordDailyCheckin`) |
| `LOG_LEVEL`          | Logging level (`debug`, `info`)                     | No (default: `info`)                 |
| `BATCH_SIZE`         | Number of accounts processed per batch              | No (default: `10`)                   |
| `DELAY_PER_BATCH_MS` | Delay in milliseconds between each batch            | No (default: `0`)                    |
| `CONCURRENCY`        | Number of accounts processed concurrently per batch | No (default: `1`)                    |

---

## Without Docker

**Requirements:** [Node.js](https://nodejs.org/) >= 22.13.0, [pnpm](https://pnpm.io/) (recommended) or npm, a MongoDB instance, and a Discord bot token.

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

Copy the example file and fill in your values (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env
```

### 4. Run the bot

```bash
# Using pnpm
pnpm start

# Using npm
npm run start
```

---

## With Docker

**Requirements:** [Docker](https://docs.docker.com/get-docker/) and a Discord bot token. A MongoDB instance is optional — see the run options below.

> Don't want to clone the repo? See **[Docker_PreBuilt.md](Docker_PreBuilt.md)** to pull and run the latest pre-built image directly.

### 1. Clone the repository

```bash
git clone https://github.com/NekoCyan/Discord-Daily-Checkin.git
cd Discord-Daily-Checkin
```

### 2. Build the Docker image

```bash
# Using pnpm (recommended)
pnpm docker:prod:build

# Using npm
npm run docker:prod:build
```

### 3. Configure environment variables

Copy the example file and fill in your values (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env.production
```

### 4. Run the bot

**Option A — You already have a MongoDB URI**

Set `MONGODB_URI` in `.env.production` to your remote connection string, then run:

```bash
# Using pnpm (recommended)
pnpm docker:prod

# Using npm
npm run docker:prod
```

**Option B — Run MongoDB locally via Docker**

Leave `MONGODB_URI` as the default (`mongodb://mongo:27017`). The mongo service will start alongside the bot and its data will be persisted to `./data/mongo` in the workspace:

```bash
# Using pnpm (recommended)
pnpm docker:prod:mongo

# Using npm
npm run docker:prod:mongo
```

---

## Retrieving Your Endfield Account Token

The bot requires your Arknights: Endfield account token to perform check-ins on your behalf.

1. Open the [Arknights: Endfield check-in portal](https://game.skport.com/endfield/sign-in) and **log in**.
2. Open your browser's DevTools (`F12`) and go to the **Console** tab.
3. Paste and run the following snippet:

```js
const res = await fetch('https://web-api.skport.com/cookie_store/account_token', {
  headers: { accept: 'application/json', 'x-language': 'en-us' },
  credentials: 'include',
});
const {
  data: { content },
} = await res.json();

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
