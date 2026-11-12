# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends openssl ca-certificates tzdata \
 && ln -snf /usr/share/zoneinfo/America/Santiago /etc/localtime \
 && echo "America/Santiago" >/etc/timezone \
 && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Imagen de build: Next.js standalone + Prisma Client.
FROM base AS builder
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEMO_MODE=false
ENV NODE_ENV=production \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE} \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?schema=public
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Imagen de ejecución: solo el servidor standalone y archivos públicos.
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=America/Santiago \
    HOME=/home/nextjs
RUN groupadd --gid 1001 nodejs \
 && useradd --uid 1001 --gid nodejs --create-home --shell /usr/sbin/nologin nextjs
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts/check-env.mjs ./scripts/check-env.mjs
COPY --chown=nextjs:nodejs deploy/entrypoint.sh /usr/local/bin/mesacerca-entrypoint
RUN chmod 0555 /usr/local/bin/mesacerca-entrypoint \
 && mkdir -p /app/public/uploads/stores \
 && chown -R nextjs:nodejs /app/public/uploads
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["/usr/local/bin/mesacerca-entrypoint"]

# Imagen de migraciones: incluye Prisma CLI y las migraciones versionadas.
FROM deps AS migrate
COPY prisma ./prisma
COPY deploy/migrate.sh /usr/local/bin/mesacerca-migrate
RUN chmod 0555 /usr/local/bin/mesacerca-migrate
ENV HOME=/home/node
USER node
ENTRYPOINT ["/usr/local/bin/mesacerca-migrate"]
