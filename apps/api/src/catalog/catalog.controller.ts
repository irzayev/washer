import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('categories')
  categories(@Query('includeInactive') includeInactive?: string) {
    return this.catalog.listCategories(includeInactive === 'true');
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

  @Roles(UserRole.ADMIN)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.catalog.deleteCategory(id);
  }

  @Public()
  @Get('services')
  services(@Query('includeInactive') includeInactive?: string) {
    return this.catalog.listServices(includeInactive === 'true');
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post('services')
  createService(@Body() dto: CreateServiceDto) {
    return this.catalog.createService(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch('services/:id')
  updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.catalog.updateService(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('services/:id')
  archiveService(@Param('id') id: string) {
    return this.catalog.archiveService(id);
  }
}
