# ---------- Build stage ----------
FROM node:24-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# generate only needs DATABASE_URL to exist, it never connects to it
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
# fail the build early if the query engine binary was not generated
RUN ls src/generated/prisma/*.node
RUN npm run build

# ---------- Runtime stage ----------
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

# Pre-create directory so wildcard copy succeeds
RUN mkdir -p ./dist/generated/prisma
COPY --from=builder --chown=node:node /app/src/generated/prisma/*.node ./dist/generated/prisma/

COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts

USER node
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]