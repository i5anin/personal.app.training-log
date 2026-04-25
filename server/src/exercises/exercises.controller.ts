import { Controller, Get, Post, Body } from '@nestjs/common';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly service: ExercisesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  upsert(@Body() body: any) {
    return this.service.upsert(body);
  }
}
