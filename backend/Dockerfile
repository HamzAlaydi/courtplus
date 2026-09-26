# Multi-stage build.
#
# Previously this was a single stage on node:23-alpine that ran as root and
# shipped dev dependencies, the full source tree and the pnpm store in the
# final image. CMD went through pnpm, which made pnpm PID 1 — so SIGTERM was
# delivered to pnpm and never reached Node, and every deploy killed in-flight
# requests and running BullMQ jobs instead of draining them.

# Node 22 LTS. Node 23 is an odd-numbered release line: never LTS, and already
# out of support.
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy manifests first so the dependency layer is cached and only reinstalls
# when the lockfile actually changes. The old file copied package*.json and
# then immediately COPY . ., which invalidated the cache on every source edit.
COPY package.json pnpm-lock.yaml ./
# --frozen-lockfile fails the build if the lockfile and manifest disagree,
# rather than silently resolving different versions than were tested.
RUN pnpm install --frozen-lockfile

COPY . .
RUN NODE_OPTIONS="--max-old-space-size=3072" pnpm run build

# Drop dev dependencies from the tree that gets copied into the runtime image.
RUN pnpm prune --prod


FROM node:22-alpine AS runtime

RUN apk add --no-cache libc6-compat tini
ENV NODE_ENV=production

WORKDIR /app

# Run unprivileged. The node image ships a `node` user for exactly this.
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3000

# tini is PID 1 and forwards signals to node, so app.enableShutdownHooks()
# actually fires on SIGTERM and the process drains instead of being killed.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main"]
