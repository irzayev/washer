FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
COPY apps/client-portal/package.json apps/client-portal/
COPY packages/db/package.json packages/db/
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker
RUN pnpm --filter @washer/db prisma:generate
RUN npx tsc -p packages/types/tsconfig.json
RUN npx tsc -p packages/utils/tsconfig.json && ls -la packages/utils/dist/
RUN npx tsc -p packages/config/tsconfig.json
RUN pnpm --filter @washer/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
COPY docker/api.entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh
EXPOSE 4000
ENTRYPOINT ["/bin/sh", "/entrypoint.sh"]
