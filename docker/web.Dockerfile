FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @washer/web build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@washer/web", "start"]
