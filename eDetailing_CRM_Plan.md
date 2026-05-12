# eDetailing CRM — Полный план системы для разработки в Cursor

Концепция проекта
DOCKER 
---

Веб-приложение и веб-CRM-система для автомойки и детейлинг-центра с:

* управлением клиентами
* заказами
* складом
* сотрудниками
* бонусами
* зарплатами
* аналитикой
* WhatsApp bot
* Instagram bot
* финансовым учетом

Система должна быть масштабируемой и в будущем поддерживать:

* несколько филиалов
* SaaS модель
* white-label
* мобильное приложение(в будующем, а сейчас веб-апп)

\---

# 1\. Роли пользователей

## Администратор

Полный доступ:

* финансы
* аналитика
* склад
* CRM
* сотрудники
* зарплаты
* бонусы
* настройки
* маркетинг

## Менеджер / Оператор

* создание заказов
* запись клиентов
* управление очередью
* закрытие заказов
* применение скидок
* списание бонусов
* уведомления

## Работник

Личный кабинет:

* свои задачи
* статус работ
* зарплата
* бонусы
* график
* фото до/после

## Клиент

Личный кабинет:

* история услуг
* онлайн запись
* бонусный баланс
* уведомления
* рекомендации
* статус автомобиля

\---

# 2\. Основные модули системы

## MODULE 1 — CRM клиентов

### Возможности

* база клиентов
* несколько автомобилей
* VIN / госномер
* история посещений
* средний чек
* любимые услуги
* VIP статус

### Автоматизация

* прошло 30 дней после мойки
* пора обновить керамику
* давно не приезжал
* день рождения

### Сегментация клиентов

* VIP
* inactive
* frequent
* high check
* debtors

\---

## MODULE 2 — Заказы / Work Orders

### Статусы заказа

* новый
* записан
* в работе
* ожидание
* завершен
* выдан

### В заказе

* клиент
* автомобиль
* услуги
* исполнитель
* материалы
* фото
* время работы
* скидки
* бонусы
* способ оплаты

\---

## MODULE 3 — Услуги и пакеты

### Категории услуг

* мойка
* полировка
* химчистка
* керамика
* антидождь
* пленка
* детейлинг

### Конструктор пакетов

Пример:
Premium Wash:

* exterior wash
* wax
* tire shine
* vacuum

### Возможности

* фиксированные пакеты
* кастомные услуги
* add-ons
* сезонные акции

\---

## MODULE 4 — Финансы и оплаты

### Способы оплаты

* наличные
* POS терминал
* Azericard
* банковский перевод
* бонусы
* смешанная оплата

### Смешанная оплата

Примеры:

* 70 AZN наличными + 30 AZN бонусами
* часть наличными + часть картой

### Финансовая структура заказа

```txt
Order
- subtotal
- discount\_type
- discount\_value
- bonus\_used
- final\_total
- payment\_status
```

### Таблица платежей

```txt
Payment
- id
- order\_id
- method
- amount
- status
- transaction\_reference
- created\_at
```

\---

## MODULE 5 — Скидки

### Типы скидок

#### Фиксированная

\-10 AZN

#### Процентная

\-15%

#### Ручная скидка менеджера

Обязательно:

* комментарий
* audit log

### Причины скидок

* VIP
* complaint
* promotion
* manager decision

\---

## MODULE 6 — Бонусная система клиентов

### Начисление бонусов

* 5% cashback
* только на определенные услуги

### Использование бонусов

* максимум 30% заказа
* нельзя использовать на акционные услуги

### Bonus Wallet

```txt
ClientBonusWallet
- client\_id
- balance
- lifetime\_earned
- lifetime\_spent
```

### История бонусов

```txt
BonusTransaction
- client\_id
- type (earn/spend/expire)
- amount
- source\_order\_id
- created\_at
```

### Уровни клиентов

* Silver
* Gold
* Platinum

\---

## MODULE 7 — Склад / Inventory

### Учет

* химия
* инструменты
* расходники
* тряпки

### Автосписание

Каждая услуга содержит:

* расход химии
* расход воды
* расход электричества
* время работы

### Пример

Полировка кузова:

* паста: 120ml
* microfiber: 1
* electricity: 1.2 kWh

### После завершения заказа

→ автоматическое списание материалов

\---

## MODULE 8 — Зарплаты и KPI

### Модели зарплат

* фиксированная
* процент
* процент + бонус
* KPI

### Бонусы сотрудникам

* за отзывы
* за upsell
* за скорость
* за качество

### Аналитика сотрудников

* количество машин
* выручка
* эффективность
* рейтинг

\---

## MODULE 9 — WhatsApp Automation

### Через Evolution API

#### Возможности

* подтверждение записи
* напоминания
* статус заказа
* фото готовой машины
* маркетинговые рассылки

### AI WhatsApp Bot

* FAQ
* запись клиента
* цены
* рекомендации услуг

\---

## MODULE 10 — Instagram Bot

### Возможности

* автоответы в DM
* запись через Instagram
* FAQ
* акции
* AI ответы

\---

## MODULE 11 — Аналитика

### Dashboard

* машины в работе
* загрузка боксов
* прибыль
* лучшие сотрудники
* retention
* repeat rate

### Графики

* revenue
* client growth
* inventory usage
* service popularity

\---

## MODULE 12 — Касса

### При закрытии заказа

Менеджер выбирает:

* способ оплаты
* скидку
* бонусы

### Система автоматически считает

* subtotal
* скидку
* бонусы
* финальную сумму

### Daily Cash Register

В конце дня:

* наличные
* терминал
* бонусы
* скидки
* выручка

\---

## MODULE 13 — PDF чеки и invoices

PDF документ:

* услуги
* стоимость
* скидка
* бонусы
* способ оплаты
* итог

\---

# 3\. Технологический стек

## Frontend

* Next.js 15
* React
* TypeScript
* Tailwind
* shadcn/ui

## Backend

* NestJS

## Database

* PostgreSQL

## ORM

* Prisma

## Cache

* Redis

## Queue

* BullMQ

## Realtime

* Socket.io

## Storage

* MinIO / S3

## Auth

* JWT
* RBAC

\---

# 4\. Интеграции

* Evolution API
* Meta Graph API
* Azericard
* Resend / SendGrid
* local SMS provider

\---

# 5\. Архитектура проекта

```txt
/apps
  /web
  /admin
  /worker
  /client-portal
  /api

/packages
  /ui
  /types
  /utils

/services
  /whatsapp
  /instagram
  /notifications
  /billing
  /inventory
```

\---

# 6\. Основные сущности БД

```txt
Users
Clients
Vehicles
Orders
Services
Payments
Bonuses
Payroll
Inventory
InventoryTransactions
Notifications
AuditLogs
Branches
```

\---

# 7\. Автоматизация

## Cron Jobs

* напоминания
* inactive clients
* birthday campaigns
* stock alerts

## AI функции

* рекомендации услуг
* анализ клиентов
* прогноз повторного визита
* аналитика эффективности

\---

# 8\. Дополнительные функции

* Queue Management
* Box Management
* Time Estimation AI
* Loyalty Campaigns
* QR Check-in
* Фото до/после
* Audit Logs
* Multi-Branch
* Offline-first

\---

# 9\. Docker инфраструктура

```yaml
services:
  web
  api
  postgres
  redis
  evolution-api
  nginx
  minio
```

\---

# 10\. Структура backend модулей

```txt
/modules
  /auth
  /users
  /clients
  /vehicles
  /orders
  /services
  /inventory
  /billing
  /payments
  /discounts
  /bonuses
  /cash-register
  /payroll
  /analytics
  /notifications
  /whatsapp
  /instagram
```

\---

# 11\. Roadmap разработки

## PHASE 1 — MVP

3–5 недель

* auth
* roles
* CRM
* заказы
* услуги
* dashboard
* WhatsApp notifications
* basic billing

## PHASE 2

4–6 недель

* склад
* зарплаты
* бонусы
* скидки
* analytics
* касса

## PHASE 3

4–8 недель

* AI assistant
* Instagram bot
* клиентский кабинет
* PWA/mobile
* loyalty automation

\---

# 12\. Важные архитектурные требования

* RBAC
* audit logs
* scalable architecture
* modular backend
* queue system
* realtime updates
* background jobs

\---

# 13\. Потенциал проекта

Проект можно масштабировать в:

* SaaS для автомоек
* SaaS для детейлинга
* franchise management system
* white-label platform

Для рынка Азербайджана и СНГ ниша практически свободна.

