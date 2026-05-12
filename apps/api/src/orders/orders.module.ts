import { Module } from '@nestjs/common';
import { BonusesModule } from '../bonuses/bonuses.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [BonusesModule, InventoryModule, CashRegisterModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
