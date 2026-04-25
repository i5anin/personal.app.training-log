import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { Workout } from '../workouts/workout.entity';
import { SetRow } from '../set-rows/set-row.entity';

@Entity()
export class ExerciseEntry {
  @PrimaryColumn()
  id: string;

  @Index()
  @ManyToOne(() => Workout, (w) => w.entries, { onDelete: 'CASCADE' })
  workout: Workout;

  @Index()
  @Column()
  exerciseId: string;

  @OneToMany(() => SetRow, (s) => s.entry, { cascade: true, eager: true })
  sets: SetRow[];

  @Column({ nullable: true, type: 'real' })
  barWeight: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  supersetGroupId: string;

  @Column('simple-json', { nullable: true })
  photoIds: string[];

  @Column({ nullable: true })
  createdAt: string;

  @Column({ nullable: true, type: 'integer' })
  totalEditMs: number;

  toJSON() {
    const { id, exerciseId, barWeight, description, supersetGroupId, photoIds, createdAt, totalEditMs, sets } = this;
    return {
      id, exerciseId, barWeight, description, supersetGroupId,
      photoIds, createdAt, totalEditMs,
      sets: (sets ?? []).slice().sort((a, b) => a.order - b.order),
    };
  }
}
