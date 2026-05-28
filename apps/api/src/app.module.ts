import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { BonusesModule } from './modules/bonuses/bonuses.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AzericardModule } from './modules/azericard/azericard.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { BoxesModule } from './modules/boxes/boxes.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AiModule } from './modules/ai/ai.module';
import { InstagramModule } from './modules/instagram/instagram.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    ClientsModule,
    VehiclesModule,
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    PricingModule,
    BonusesModule,
    InventoryModule,
    CashRegisterModule,
    AnalyticsModule,
    AuditModule,
    NotificationsModule,
    WhatsappModule,
    AzericardModule,
    AppointmentsModule,
    RefundsModule,
    PayrollModule,
    InvoicesModule,
    BoxesModule,
    AiModule,
    InstagramModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
