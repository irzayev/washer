import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@washer/db';
import { Roles } from '../../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }
  @Roles(UserRole.ADMIN)
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }
  @Roles(UserRole.ADMIN)
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Get('services')
  listServices(@Query('branchId') branchId?: string) {
    return this.catalog.listServices(branchId);
  }
  @Get('services/:id')
  findService(@Param('id') id: string) {
    return this.catalog.findService(id);
  }
  @Roles(UserRole.ADMIN)
  @Post('services')
  createService(@Body() dto: CreateServiceDto) {
    return this.catalog.createService(dto);
  }
  @Roles(UserRole.ADMIN)
  @Patch('services/:id')
  updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.catalog.updateService(id, dto);
  }
}
