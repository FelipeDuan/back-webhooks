FROM node:22-alpine AS builder

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build


FROM node:22-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY . .

COPY --from=builder /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3100

CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]

