# EchoGPT Backend

Backend REST API for the [EchoGPT Chrome Extension](https://chromewebstore.google.com/detail/echogpt-multi-ai-chat-sid/negimdcamohmoheiifgecbjgjepkcfhj), built with NestJS, PostgreSQL, Prisma, and Swagger, as a technical assessment for the Software Engineering Internship (Backend) role at AppifyDevs.

- **Live API:** https://echogpt-backend.onrender.com
- **Swagger docs:** https://echogpt-backend.onrender.com/docs

> Render's free tier spins down after inactivity. The first request after idle time can take 30-60 seconds to wake up.

## Tech stack

- **Framework:** NestJS (ESM)
- **Database:** PostgreSQL, via Prisma ORM
- **Cache:** Redis (search result caching)
- **Auth:** JWT (access + refresh tokens), Passport
- **Docs:** Swagger / OpenAPI
- **AI providers:** OpenAI, Anthropic (Claude), Google Gemini
- **Web search:** Serper.dev
- **Containerization:** Docker, Docker Compose

## Features

All required features are implemented. Two items were explicitly listed as bonus in the assignment; one was built, one was deferred by design (see [Design decisions](#design-decisions)).

| Module | Status |
|---|---|
| Authentication (register, login, logout, JWT, refresh, hashing) | Done |
| Email verification (bonus) | Not implemented |
| User management (profile, update, change password, delete, roles) | Done |
| Subscription management (plans, status, usage, upgrade/downgrade) | Done |
| AI provider management (CRUD, encrypted keys, default, health check) | Done |
| Chat API (send/receive, provider + model selection, conversation history) | Done |
| Streaming responses (bonus) | Not implemented |
| Web search API (AI-assisted, history, recent, suggestions) | Done |
| Search result caching (bonus) | Done (Redis) |
| Admin panel (dashboard, user/subscription/provider management, analytics, logs, health) | Done |
| Swagger documentation | Done |
| Docker | Done |
| Postman collection (optional) | Done (`docs/echo-gpt.postman_collection.json`) |

## Getting started

### Option A: Docker (recommended)

Requires Docker and Docker Compose. No local Postgres, Redis, or Node install needed.

```bash
git clone https://github.com/fahimx51/echogpt-backend.git
cd echogpt-backend
cp .env.example .env
```

Open `.env` and fill in at least `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY` (see [Environment variables](#environment-variables) for how to generate them). Leave `DATABASE_URL` unset to use the bundled Postgres container automatically, or point it at your own Postgres/Neon instance.

```bash
docker compose up --build
```

This starts a local Postgres container, applies all migrations, and starts the API. Open http://localhost:3000/docs to confirm it's running.

### Option B: Without Docker

Requires Node.js 24+, npm, and a running PostgreSQL instance.

```bash
git clone https://github.com/fahimx51/echogpt-backend.git
cd echogpt-backend
npm install
cp .env.example .env
```

Fill in `.env`, including a real `DATABASE_URL` pointing at your own PostgreSQL database.

```bash
npx prisma migrate deploy
npm run build
npm run start:prod
```

For local development with hot reload:

```bash
npm run start:dev
```

## Environment variables

Copy `.env.example` to `.env` and fill in your own values. None of these are committed to the repository.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes (Option B) / Optional (Docker) | PostgreSQL connection string. If unset under Docker, falls back to the bundled Postgres container. |
| `PORT` | No | Port the API listens on. Defaults to 3000. Render sets this automatically. |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens. |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens. Must differ from the access secret. |
| `JWT_ACCESS_EXPIRY` | No | Access token lifetime, e.g. `15m`. |
| `JWT_REFRESH_EXPIRY` | No | Refresh token lifetime, e.g. `7d`. |
| `ENCRYPTION_KEY` | Yes | 64 hex characters (32 bytes). Encrypts stored AI provider API keys at rest. |
| `SERPER_API_KEY` | Yes, for Web Search | API key from [serper.dev](https://serper.dev), used for the underlying web search calls. |
| `REDIS_URL` | Yes, for Search caching | Redis connection string (e.g. from Redis Cloud's free tier). |
| `OPENAI_DEFAULT_MODEL` | No | Fallback model if a user hasn't set one on their provider. Defaults to `gpt-4o-mini`. |
| `CLAUDE_DEFAULT_MODEL` | No | Defaults to `claude-3-5-haiku-20241022`. |
| `GEMINI_DEFAULT_MODEL` | No | Defaults to `gemini-3.5-flash-lite`. Verify these model names are still current; providers deprecate models over time. |
| `FRONTEND_URL` | No | Reserved for CORS configuration if a frontend is added later. |

Generate the JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Generate the encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important:** AI provider keys (OpenAI, Claude, Gemini) are *not* environment variables. Each user adds their own through the `/api/ai-providers` endpoints after registering, since this is a multi-tenant backend, not a single-key proxy. Testing Chat and Search requires a real key from at least one provider, and a Serper key for Search.

## API overview

All routes are prefixed with `/api`. Full request/response schemas, parameters, and error responses are documented in Swagger at `/docs`.

| Module | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | register, login, refresh, logout |
| Users | `/api/users/me` | profile, update, change password, delete (always acts on the authenticated user, not an arbitrary ID) |
| Subscriptions | `/api/subscriptions` | status, usage, change-plan |
| AI Providers | `/api/ai-providers` | CRUD, toggle, set-default, model, health |
| Chat | `/api/chat` | send, history, conversations, conversation by ID |
| Search | `/api/search` | search, history, recent, suggestions |
| Admin | `/api/admin` | dashboard, users, subscriptions, ai-providers, analytics, logs, health (all require `role: ADMIN`) |

### Authentication

Register and log in through `/api/auth/register` and `/api/auth/login` to receive an `accessToken` and `refreshToken`. Pass the access token as `Authorization: Bearer <token>` on protected routes. Use `/api/auth/refresh` with the refresh token to get a new pair once the access token expires; refresh tokens rotate on use.

### Becoming an admin

New accounts default to the `USER` role. To test the Admin Panel, promote an account directly in the database:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Log in again afterward, since the role is embedded in the JWT at login time and won't update on an existing token.

## Database design

PostgreSQL, managed through Prisma migrations (`prisma/migrations/`). Seven core tables:

- **User** — accounts, roles (`USER` / `ADMIN`), credentials
- **Session** — refresh tokens, one row per active login, supports multi-device logout
- **Subscription** — one-to-one with User, plan type and usage counters
- **AIProvider** — one row per (user, provider) pair; encrypted API key, per-provider default model, enabled/default flags
- **Chat** — one row per prompt/response pair, grouped into threads via `conversationId`
- **WebSearch** — one row per search, storing raw results and the AI-generated summary together
- **ApiUsageLog** — one row per HTTP request, written by a global interceptor, powers the Admin analytics and logs endpoints

Indexes are added on every foreign key plus the columns each endpoint actually filters or sorts by (e.g. `[userId, createdAt]` on Chat and WebSearch, `[userId, name]` unique on AIProvider).

## Design decisions

A few choices worth calling out, since they weren't the only valid option:

- **Chat threading uses a plain `conversationId` string on the `Chat` table**, not a separate `Conversation` model. Each message already carries `userId` and `createdAt`; grouping by `conversationId` is sufficient to reconstruct threads and pass prior turns back to the AI provider as context, without a second table and its own CRUD surface.
- **AI provider API keys are encrypted at rest** with AES-256-GCM before being stored, using a server-side `ENCRYPTION_KEY`, and are never returned in full through any endpoint, including immediately after creation, only a masked preview.
- **User-facing routes operate on `/users/me`, not `/users/:id`.** Regular users can only read, update, or delete their own account; there is no way to target another user's ID from a non-admin token. Admins manage other users through the separate, role-gated `/api/admin/users/:id` routes.
- **Search result caching is keyed by the normalized query text only, shared across all users.** Serper's results for a given query don't depend on who's asking, so this maximizes cache hits without any privacy concern. The AI-generated summary is *not* cached, since it depends on each user's chosen provider and model.
- **Streaming responses and email verification were left as the two explicitly-bonus items not built**, in favor of finishing search result caching and hardening the required feature set (authorization checks, Docker, migration verification) within the available time. Streaming in particular would require a materially different response mechanism (SSE) with a different payload shape per provider (OpenAI, Anthropic, and Gemini each stream differently), which was a larger scope increase than the time available supported doing well.
- **Model names per AI provider are configurable**, not hardcoded: a user can set a `defaultModel` per provider, override it per chat/search request, or fall back to a server-wide `.env` default. This was added after hitting several live model deprecations from Google during development, and is meant to keep the app resilient to providers retiring model names over time.
- **Roles are a `Role` enum (`USER` / `ADMIN`) on the `User` table, not a separate table.** There are only two fixed roles and no per-role permissions, so a join table would add complexity without adding capability. If granular permissions were needed later, this could be migrated to a `Role` table.

## Testing

A Postman collection covering every endpoint is included at [`docs/echo-gpt.postman_collection.json`](docs/echo-gpt.postman_collection.json).

1. In Postman, choose **Import** and select the file.
2. Set the `baseUrl` collection variable to `http://localhost:3000` (local) or `https://echogpt-backend.onrender.com` (deployed).
3. Run the requests roughly top to bottom: Auth → Users → Subscriptions → AI Providers → Chat → Search → Admin.

Chat and Search need a real provider key added through `/api/ai-providers`, and Search also needs `SERPER_API_KEY` on the server. Admin requests need an account promoted to `ADMIN` (see [Becoming an admin](#becoming-an-admin)).

## Known limitations

- Streaming chat responses and email verification are not implemented (see above).
- Render's free tier cold-starts after inactivity.

## License

Built as a technical assessment for AppifyDevs. Not licensed for other use.