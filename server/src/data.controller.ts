import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkoutsService } from './workouts/workouts.service';
import { ExercisesService } from './exercises/exercises.service';
import { MuscleGroupsService } from './muscle-groups/muscle-groups.service';

@Controller()
export class DataController {
  constructor(
    private readonly workoutsService: WorkoutsService,
    private readonly exercisesService: ExercisesService,
    private readonly muscleGroupsService: MuscleGroupsService,
  ) {}

  @Get('export')
  async export() {
    const [workouts, exercises, muscleGroups] = await Promise.all([
      this.workoutsService.findAll(),
      this.exercisesService.findAll(),
      this.muscleGroupsService.findAll(),
    ]);
    return { version: 1, workouts, exercises, muscleGroups };
  }

  @Post('import')
  async import(@Body() data: any) {
    if (data.workouts) await this.workoutsService.replaceAll(data.workouts);
    if (data.exercises) await this.exercisesService.replaceAll(data.exercises);
    if (data.muscleGroups) await this.muscleGroupsService.replaceAll(data.muscleGroups);
    return { ok: true };
  }
}
