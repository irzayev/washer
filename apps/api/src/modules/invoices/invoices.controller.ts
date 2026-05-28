import { BadRequestException, Controller, Get, Header, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get('order/:orderId')
  async get(@CurrentUser() user: RequestUser, @Param('orderId') orderId: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.invoices.findByOrder(user.branchId, orderId);
  }

  @Get('order/:orderId/receipt.html')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async receiptHtml(
    @CurrentUser() user: RequestUser,
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    const order = await this.invoices.findByOrder(user.branchId, orderId);
    res.send(this.invoices.buildReceiptHtml(order));
  }
}
