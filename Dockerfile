# syntax=docker/dockerfile:1.10
FROM node:24.22.1-bookworm-slim AS toolchain
RUN npm install --global npm@12.2.1

FROM toolchain AS deps

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM toolchain AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_ENV
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
ARG NEXT_PUBLIC_ENABLE_GTM_PREVIEW
ARG DIRECTUS_URL
ARG DIRECTUS_CLIENT_SLUG

ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
ENV NEXT_PUBLIC_GTM_ID=${NEXT_PUBLIC_GTM_ID}
ENV NEXT_PUBLIC_META_PIXEL_ID=${NEXT_PUBLIC_META_PIXEL_ID}
ENV NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=${NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY}
ENV NEXT_PUBLIC_ENABLE_GTM_PREVIEW=${NEXT_PUBLIC_ENABLE_GTM_PREVIEW}
ENV DIRECTUS_URL=${DIRECTUS_URL}
ENV DIRECTUS_CLIENT_SLUG=${DIRECTUS_CLIENT_SLUG}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG CONTENT_BUILD_ID
RUN --mount=type=secret,id=build_env,required=true \
    CONTENT_BUILD_ID="${CONTENT_BUILD_ID}" node scripts/build-with-secrets.mjs

FROM node:24.22.1-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.generated ./.generated
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
