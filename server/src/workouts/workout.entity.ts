import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Workout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: string;

  @Column('simple-json', { nullable: true })
  muscleGroups: string[];

  @Column('simple-json', { nullable: true })
  entries: any[];

  @Column({ nullable: true })
  description: string;

  @Column('simple-json', { nullable: true })
  photoIds: string[];

  @Column({ nullable: true })
  primaryType: string;

  @Column({ nullable: true })
  secondaryType: string;

  @Column({ nullable: true })
  createdAt: string;

  @Column({ nullable: true })
  totalEditMs: number;
}
