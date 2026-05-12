import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BonusesModule } from './bonuses/bonuses.module';
import { BranchesModule } from './branches/branches.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { CatalogModule } from './catalog/catalog.module';
import { ClientsModule } from './clients/clients.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { InstagramModule } from './instagram/instagram.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrdersModule } from './orders/orders.module';
import { PayrollModule } from './payroll/payroll.module';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { VehiclesModule } from './vehicles/vehicles.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    PrismaModule,
    AuditModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    ClientsModule,
    VehiclesModule,
    CatalogModule,
    OrdersModule,
    BonusesModule,
    InventoryModule,
    CashRegisterModule,
    AnalyticsModule,
    PayrollModule,
    WhatsappModule,
    InstagramModule,
    TenantModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly users: UsersService) {}

  async onApplicationBootstrap() {
    await this.users.ensureSeedData();
  }
}
