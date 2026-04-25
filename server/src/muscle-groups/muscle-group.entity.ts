import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class MuscleGroup {
  @PrimaryColumn()
  id: string;

  @Column()
  label: string;
}
