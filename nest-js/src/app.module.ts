import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { MuscleGroup } from './muscle-groups/muscle-group.entity';
import { Exercise } from './exercises/exercise.entity';
import { Workout } from './workouts/workout.entity';
import { MuscleGroupsModule } from './muscle-groups/muscle-groups.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { PhotosModule } from './photos/photos.module';
import { SeedService } from './seed.service';
import { DataController } from './data.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(process.cwd(), '..', 'data', 'gym.db'),
      entities: [MuscleGroup, Exercise, Workout],
      synchronize: true,
    }),
    MuscleGroupsModule,
    ExercisesModule,
    WorkoutsModule,
    PhotosModule,
  ],
  controllers: [DataController],
  providers: [SeedService],
})
export class AppModule {}
