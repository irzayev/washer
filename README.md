# eDetailing CRM

CRM для автомоек и детейлинг-центров. Монорепо: NestJS API + Next.js (admin + client-portal) + BullMQ worker + Prisma + PostgreSQL + Redis + MinIO.

## Стек

- **Backend**: NestJS 10, Prisma 5, PostgreSQL 16, Redis 7, BullMQ, Socket.io
- **Frontend**: Next.js 15 (App Router, React 19), Tailwind CSS, shadcn-style UI
- **Auth**: JWT access + refresh, argon2id, RBAC (ADMIN / MANAGER / WORKER / CLIENT)
- **Финансы**: Decimal(12,2), валюта AZN, настраиваемый НДС (INCLUDED / ADDED / NONE)
- **Платежи**: Cash, POS, Azericard (mock-провайдер + готовый каркас), Transfer, Bonus, смешанная оплата
- **Интеграции**: Evolution API (WhatsApp), Ollama (локальный LLM), MinIO/S3, заглушка Instagram
- **Observability**: pino structured logs, Sentry-ready, audit-log interceptor
- **Locale**: RU / AZ / EN, TZ Asia/Baku

## Структура

```
apps/
  api/             NestJS REST API + Socket.io gateway
  worker/          BullMQ воркеры (notifications, outbox, cron)
  web/             Next.js admin CRM
  client-portal/   Next.js клиентский портал (Phase 3)
packages/
  db/              Prisma schema + migrations + seed
  types/           Общие Zod-схемы и типы DTO
  utils/           money, datetime (Baku TZ), phone E.164, order numbers
  config/          Zod-валидация env
docker/            Dockerfile для api/worker/web
infra/             docker-compose.yml (postgres, redis, minio, evolution, ollama)
```

## Быстрый старт

```bash
# 1. Установить зависимости (требует pnpm 9+)
pnpm install

# 2. Поднять инфру (Postgres, Redis, MinIO, Evolution API, Ollama)
cp .env.example .env
pnpm docker:up

# 3. Сгенерировать Prisma клиент и применить миграцию
pnpm db:generate
pnpm db:push       # для первого старта; на проде используйте db:migrate
pnpm db:seed

# 4. Запустить все приложения
pnpm dev
```

После запуска:

- **API**: http://localhost:4000/api/v1
- **API Docs (Swagger)**: http://localhost:4000/api/docs
- **Admin Web**: http://localhost:3000
- **Client Portal**: http://localhost:3001
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)

### Стартовые учётки

- `admin@washer.local` / `Admin123!` (ADMIN)
- `manager@washer.local` / `Manager123!` (MANAGER)

## Архитектурные принципы

1. **Single-tenant, multi-branch**. Все операционные сущности (Order, Payment, Inventory, CashShift) привязаны к `branchId`.
2. **Pricing pipeline** — единый сервис `PricingService`: subtotal → items discounts → order discounts → bonus cap (30%) → VAT → bonus cashback. Полностью покрыт unit-тестами.
3. **Idempotent close-order**. `Order.close` принимает `idempotencyKey` и в одной транзакции: фиксирует pricing, создаёт `Payment[]`, начисляет/списывает бонусы, публикует `OutboxEvent`. Optimistic locking через `version`.
4. **Outbox pattern**. Доменные события сохраняются в `OutboxEvent` и обрабатываются BullMQ-воркером — гарантия доставки WhatsApp-уведомлений и интеграций.
5. **Audit log** через NestJS interceptor: все write-запросы (POST/PUT/PATCH/DELETE) логируются с actor/entity/diff.
6. **Money as Decimal(12,2)**. Никакого float. `decimal.js` для всех вычислений, утилиты в `@washer/utils`.
7. **Azericard — реальная RSA-SHA256 интеграция**. По спецификации [developer.azericard.com](https://developer.azericard.com): подпись `RSAwithSHA256` 2048-бит, MAC source — конкатенация `LENGTH+VALUE` (или `-` для пустых полей) в фиксированном порядке, P_SIGN в HEX UPPERCASE. Поддержаны TRTYPE=1 (auth), webhook с верификацией подписи банка, идемпотентность через `Payment.transactionRef = NONCE`. Перед production:
   - Сгенерировать ключи: `openssl genrsa -out merchant_private.pem 2048 && openssl rsa -in merchant_private.pem -pubout -out merchant_public.pem`
   - Передать `merchant_public.pem` в банк, получить от них Gateway public key.
   - Заполнить `AZERICARD_MERCHANT_ID`, `AZERICARD_TERMINAL_ID`, пути к ключам, переключить `AZERICARD_MODE=sandbox`, протестировать на `testmpi.3dsecure.az`, затем `production`.

## Дорожная карта

- **Phase 1 — MVP**: реализовано (auth, CRM, заказы, закрытие, WhatsApp, Docker).
- **Phase 2 — реализовано (каркас)**: appointments API+UI, refunds, payroll runs, inventory receive + автосписание при close, HTML-чеки, касса UI, mixed payments, analytics (top services/employees/box load), сегментация, Socket.io realtime, cron (birthday/inactive/low stock).
- **Phase 3 — реализовано (каркас)**: client portal (запись/история/бонусы), AI chat (Ollama), Instagram webhook stub, i18n RU/AZ/EN переключатель.
- **Остаётся для production**: реальный Azericard sandbox, Evolution API ключ, Meta Instagram App Review, PDF через puppeteer, e2e-тесты, PWA, фото MinIO, fiscal printer, multi-tenant SaaS.

## Замечания по плану `washerplan.md`

Архитектурный план с критикой исходного `washerplan.md` лежит в `.cursor/plans/`. Ключевые улучшения, заложенные в фундамент:

- разделены `Appointment` (запись) и `Order` (рабочий заказ);
- введены сущности `Branch`, `Box`, `OrderItem`, `OrderMaterialUsage`, `StockMovement`, `CashShift`, `Refund`, `OutboxEvent`, `AuditLog`;
- бонусы вынесены в отдельный домен с `expiresAt` и историей по типам (`EARN/SPEND/EXPIRE/ADJUST/REFUND`);
- НДС реализован как `vatMode` на уровне филиала (а не глобально);
- денежные суммы — `Decimal(12,2)`, через единый pricing-движок;
- идемпотентность платежей через unique `Payment.idempotencyKey`;
- optimistic locking на `Order.version` против гонок при закрытии;
- soft-delete для клиентов и заказов;
- Audit log через interceptor с partition-готовой моделью.

## Тесты

```bash
pnpm --filter @washer/api test
```

Покрыт критический pricing pipeline. Дальше: e2e на close-order, payments, bonus flow.

## Лицензия

Proprietary.
