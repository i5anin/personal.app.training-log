import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { ExerciseEntry } from '../exercise-entries/exercise-entry.entity';

@Entity()
export class SetRow {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => ExerciseEntry, (e) => e.sets, { onDelete: 'CASCADE' })
  entry: ExerciseEntry;

  @Column('integer')
  order: number;

  @Column('real')
  weight: number;

  @Column('integer')
  reps: number;

  @Column({ default: false })
  isBurnout: boolean;

  toJSON() {
    const { weight, reps, isBurnout } = this;
    return isBurnout ? { reps, weight, isBurnout: true } : { reps, weight };
  }
}
