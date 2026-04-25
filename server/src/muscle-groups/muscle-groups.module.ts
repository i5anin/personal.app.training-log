import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MuscleGroup } from './muscle-group.entity';
import { MuscleGroupsService } from './muscle-groups.service';
import { MuscleGroupsController } from './muscle-groups.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MuscleGroup])],
  controllers: [MuscleGroupsController],
  providers: [MuscleGroupsService],
  exports: [MuscleGroupsService],
})
export class MuscleGroupsModule {}
