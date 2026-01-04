FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies if any (none heavy usually)
RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Install production deps only
RUN npm ci --omit=dev

# Link the binary
RUN npm link

# Set entrypoint
ENTRYPOINT ["leetcode"]
CMD ["--help"]
