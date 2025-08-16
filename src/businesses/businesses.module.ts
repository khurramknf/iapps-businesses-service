// File: services/businesses-service/backend/src/businesses/businesses.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { Business } from './entities/business.entity';
import { BusinessManager } from './entities/business-manager.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Category } from '../categories/entities/category.entity';
import { TagsService } from '../tags/tags.service';
import { CategoriesService } from '../categories/categories.service';
import { OrganizationsClient } from '../common/services/organizations.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, BusinessManager, Tag, Category]),
    HttpModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService, TagsService, CategoriesService, OrganizationsClient],
  exports: [BusinessesService],
})
export class BusinessesModule {}
