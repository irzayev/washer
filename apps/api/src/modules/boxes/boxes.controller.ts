import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { BoxesService } from './boxes.service';

@ApiTags('boxes')
@ApiBearerAuth()
@Controller('boxes')
export class BoxesController {
  constructor(private readonly boxes: BoxesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.boxes.list(user.branchId);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body('name') name: string) {
    if (!user.branchId) throw new BadRequestException('User has no branch');
    return this.boxes.create(user.branchId, name);
  }
}
