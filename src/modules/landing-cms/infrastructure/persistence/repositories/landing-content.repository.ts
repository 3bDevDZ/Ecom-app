import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ILandingContentRepository } from '../../../domain/repositories/ilanding-content-repository';
import { LandingPageContent } from '../../../domain/aggregates/landing-page-content';
import { LandingPageContentEntity } from '../entities/landing-page-content.entity';
import { LandingContentMapper } from '../mappers/landing-content.mapper';

@Injectable()
export class LandingContentRepository implements ILandingContentRepository {
  constructor(
    @InjectRepository(LandingPageContentEntity)
    private readonly repository: Repository<LandingPageContentEntity>,
  ) {}

  async findCurrent(): Promise<LandingPageContent | null> {
    // There should only be one landing page content record
    const entity = await this.repository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!entity) {
      return null;
    }

    return LandingContentMapper.toDomain(entity);
  }

  async save(content: LandingPageContent): Promise<void> {
    const entity = LandingContentMapper.toPersistence(content);
    await this.repository.save(entity);
  }

  async exists(): Promise<boolean> {
    const count = await this.repository.count();
    return count > 0;
  }
}
