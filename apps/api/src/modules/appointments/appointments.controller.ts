import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentStatus, UserRole } from '@washer/db';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, PublicBookDto, UpdateAppointmentDto } from './dto/appointment.dto';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Public()
  @Post('public/book/:branchCode')
  publicBook(@Param('branchCode') branchCode: string, @Body() dto: PublicBookDto) {
    return this.appointments.publicBook(branchCode, dto);
  }

  @ApiBearerAuth()
  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.appointments.list(user.branchId, from, to, status);
  }

  @ApiBearerAuth()
  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.appointments.findOne(user.branchId, id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateAppointmentDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.appointments.create(user.branchId, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.appointments.update(user.branchId, id, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.appointments.cancel(user.branchId, id);
  }

  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/convert-order')
  convert(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.appointments.convertToOrder(user.branchId, id, user.id);
  }
}
