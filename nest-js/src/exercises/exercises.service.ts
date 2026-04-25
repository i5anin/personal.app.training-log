import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './exercise.entity';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private readonly repo: Repository<Exercise>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async upsert(data: Partial<Exercise>) {
    await this.repo.save(data);
    return { ok: true };
  }

  async replaceAll(exercises: Partial<Exercise>[]) {
    await this.repo.clear();
    await this.repo.save(exercises);
    return { ok: true };
  }
}
