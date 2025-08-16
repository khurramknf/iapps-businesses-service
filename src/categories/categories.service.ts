// File: services/businesses-service/backend/src/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly repo: Repository<Category>) {}

  async ensureExist(ids: string[] | undefined) {
    if (!ids?.length) return;
    const unique = Array.from(new Set(ids));
    const found = await this.repo.find({ where: { id: In(unique), isActive: true } });
    if (found.length !== unique.length) {
      const missing = unique.filter((id) => !found.find((c) => c.id === id));
      throw new Error(`Unknown or inactive categories: ${missing.join(', ')}`);
    }
  }
}
