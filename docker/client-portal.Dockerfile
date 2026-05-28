FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/client-portal/package.json apps/client-portal/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY packages ./packages
COPY apps/client-portal ./apps/client-portal
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @washer/client-portal build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3001
CMD ["pnpm", "--filter", "@washer/client-portal", "start"]
