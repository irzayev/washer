import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { Roles } from '../../common/decorators/roles.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller()
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get('clients/:clientId/vehicles')
  list(@Param('clientId') clientId: string) {
    return this.vehicles.listByClient(clientId);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('clients/:clientId/vehicles')
  create(@Param('clientId') clientId: string, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(clientId, dto);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch('vehicles/:id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehicles.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('vehicles/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    await this.vehicles.remove(id);
  }
}
