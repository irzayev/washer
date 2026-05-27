FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @washer/db prisma:generate
RUN pnpm --filter @washer/worker build
ENV NODE_ENV=production
CMD ["node", "apps/worker/dist/main.js"]
