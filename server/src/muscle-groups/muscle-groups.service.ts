import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MuscleGroup } from './muscle-group.entity';

@Injectable()
export class MuscleGroupsService {
  constructor(
    @InjectRepository(MuscleGroup)
    private readonly repo: Repository<MuscleGroup>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async upsert(data: Partial<MuscleGroup>) {
    await this.repo.save(data);
    return { ok: true };
  }

  async replaceAll(groups: Partial<MuscleGroup>[]) {
    await this.repo.clear();
    await this.repo.save(groups);
    return { ok: true };
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
