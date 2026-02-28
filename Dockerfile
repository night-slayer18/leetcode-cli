FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-bookworm-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production deps only
RUN npm ci --omit=dev

# Set entrypoint
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--help"]
