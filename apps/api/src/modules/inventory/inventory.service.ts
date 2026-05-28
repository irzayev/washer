import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StockMovementType } from '@washer/db';
import { money } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventoryItemDto, ReceiveStockDto, UpdateInventoryItemDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(branchId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  lowStock(branchId: string) {
    return this.prisma.$queryRawUnsafe<unknown[]>(
      `SELECT id, sku, name, unit, "stockQty", "minStock"
       FROM "InventoryItem"
       WHERE "branchId" = $1::uuid AND "isActive" = true AND "stockQty" <= "minStock"
       ORDER BY name`,
      branchId,
    );
  }

  create(branchId: string, dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({ data: { ...dto, branchId } });
  }

  async update(branchId: string, itemId: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id: itemId, branchId, isActive: true } });
    if (!item) throw new NotFoundException('Item not found');

    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async receive(branchId: string, dto: ReceiveStockDto, userId: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id: dto.itemId, branchId } });
    if (!item) throw new NotFoundException('Item not found');
    if (dto.qty <= 0) throw new BadRequestException('qty must be > 0');

    return this.prisma.$transaction(async (tx) => {
      const currentValue = money(item.stockQty).mul(item.costAvg);
      const incomingValue = money(dto.qty).mul(dto.unitCost);
      const newQty = money(item.stockQty).add(dto.qty);
      const newCostAvg = newQty.gt(0) ? currentValue.add(incomingValue).div(newQty) : money(dto.unitCost);

      await tx.stockMovement.create({
        data: {
          branchId,
          itemId: dto.itemId,
          type: StockMovementType.RECEIPT,
          qty: dto.qty,
          unitCost: dto.unitCost,
          createdById: userId,
          note: dto.note ?? null,
        },
      });

      return tx.inventoryItem.update({
        where: { id: dto.itemId },
        data: { stockQty: newQty.toNumber(), costAvg: newCostAvg.toNumber() },
      });
    });
  }
}
