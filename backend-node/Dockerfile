# syntax=docker/dockerfile:1.7

# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=development
RUN apk add --no-cache tini

# ---------- deps ----------
FROM base AS deps
COPY package.json ./
RUN npm install --no-audit --no-fund

# ---------- dev ----------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npx", "tsx", "watch", "src/index.ts"]

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx tsc -p tsconfig.build.json

# ---------- prod ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache tini && addgroup -S app && adduser -S app -G app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
USER app
EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
