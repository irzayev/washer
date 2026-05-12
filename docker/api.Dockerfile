FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
RUN npm install --omit=dev -w @edetailing/db -w api || npm install --omit=dev

FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run db:generate
RUN npm run build -w api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Monorepo: Nest resolves peer/platform packages from hoisted root node_modules
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/packages/db ./packages/db
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/api/dist/main.js"]
