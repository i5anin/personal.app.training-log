import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { MuscleGroupsService } from './muscle-groups.service';

@Controller('muscle-groups')
export class MuscleGroupsController {
  constructor(private readonly service: MuscleGroupsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  upsert(@Body() body: any) {
    return this.service.upsert(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
