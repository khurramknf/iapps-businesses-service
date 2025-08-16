// File: services/businesses-service/backend/src/tags/tags.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private readonly repo: Repository<Tag>) {}

  async ensureAllExist(tagNames: string[] | undefined) {
    if (!tagNames?.length) return;
    const unique = Array.from(new Set(tagNames.map((t) => t.trim().toLowerCase())));
    const found = await this.repo.find({ where: { name: In(unique), isActive: true } });
    if (found.length !== unique.length) {
      const missing = unique.filter((n) => !found.find((f) => f.name === n));
      throw new Error(`Unknown or inactive tags: ${missing.join(', ')}`);
    }
  }
}
