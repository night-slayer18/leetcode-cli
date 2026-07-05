FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Native deps needed for keytar fallback compilation on Linux
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    pkg-config \
    libsecret-1-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Production image
FROM node:22-bookworm-slim

WORKDIR /app

# Runtime library for keytar on Debian/Ubuntu images
RUN apt-get update \
  && apt-get install -y --no-install-recommends libsecret-1-0 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set entrypoint
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--help"]
