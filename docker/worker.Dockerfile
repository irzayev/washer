FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run db:generate
RUN npm run build -w worker

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
COPY --from=build /app/apps/worker/package.json ./apps/worker/
COPY --from=build /app/packages/db ./packages/db
CMD ["node", "apps/worker/dist/main.js"]
