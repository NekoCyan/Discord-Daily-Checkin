# Using the Pre-built Docker Image

The latest image is published to the GitHub Container Registry on every release. You can pull and run it **without cloning the repository**.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- A `.env.production` file with your environment variables (see the table below)

| Variable             | Description                                         | Required                                                      |
| -------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `DISCORD_TOKEN`      | Your Discord bot token                              | Yes                                                           |
| `MONGODB_URI`        | MongoDB connection URI                              | Yes                                                           |
| `MONGODB_NAME`       | Database name                                       | Yes (default: `DiscordDailyCheckin`)                          |
| `LOG_LEVEL`          | Logging level (`debug`, `info`)                     | No (default: `info`)                                          |
| `IMAGE`              | Docker image to use (for Docker Compose)            | No (default: `ghcr.io/nekocyan/discord-daily-checkin:latest`) |
| `BATCH_SIZE`         | Number of accounts processed per batch              | No (default: `10`)                                            |
| `DELAY_PER_BATCH_MS` | Delay in milliseconds between each batch            | No (default: `0`)                                             |
| `CONCURRENCY`        | Number of accounts processed concurrently per batch | No (default: `1`)                                             |

> All available image tags are listed on the [package page](https://github.com/NekoCyan/Discord-Daily-Checkin/pkgs/container/discord-daily-checkin). Set `IMAGE` to a specific tag (e.g. `ghcr.io/nekocyan/discord-daily-checkin:1.0.0`) to pin to a known release.

---

## Option A — You already have a MongoDB URI

Set `MONGODB_URI` in `.env.production` to your remote connection string, then download the compose file and run:

```bash
# Download the compose file
curl -O https://raw.githubusercontent.com/NekoCyan/Discord-Daily-Checkin/main/docker-compose.yml

# Start the bot
docker compose up -d
```

---

## Option B — Run MongoDB locally via Docker Compose

Leave `MONGODB_URI` as the default (`mongodb://mongo:27017`). Set `IMAGE` in `.env.production` to the image you want to use, then download the compose files and start everything together:

```bash
# Download the compose files
curl -O https://raw.githubusercontent.com/NekoCyan/Discord-Daily-Checkin/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/NekoCyan/Discord-Daily-Checkin/main/docker-compose.mongo.yml

# Start the bot and MongoDB
docker compose -f docker-compose.yml -f docker-compose.mongo.yml up -d
```

MongoDB data will be persisted to `./data/mongo` in whatever directory you run the command from.
