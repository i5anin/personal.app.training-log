import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Exercise {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column('simple-json')
  muscleGroups: string[];
}
