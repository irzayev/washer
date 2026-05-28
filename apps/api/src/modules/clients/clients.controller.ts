import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Public()
  @Get('public/lookup')
  publicLookup(@Query('branchCode') branchCode: string, @Query('phone') phone: string) {
    return this.clients.publicLookup(branchCode, phone);
  }

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.clients.list(user.branchId, q, Number(page) || 1, Number(pageSize) || 20);
  }

  @Get('segments/summary')
  segments(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.clients.segments(user.branchId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.clients.findOne(user.branchId, id);
  }

  @Get(':id/history')
  history(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.clients.history(user.branchId, id);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateClientDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.clients.create(user.branchId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.clients.update(user.branchId, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    await this.clients.softDelete(user.branchId, id);
  }
}
