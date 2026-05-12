import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateBranchDto } from './dto/create-branch.dto';
import { BranchesService } from './branches.service';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get()
  list() {
    return this.branches.list();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branches.create(dto);
  }
}
