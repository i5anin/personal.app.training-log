import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';

@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly service: WorkoutsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('next-id')
  nextId() {
    return this.service.nextId();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  upsert(@Body() body: any) {
    return this.service.upsert(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
