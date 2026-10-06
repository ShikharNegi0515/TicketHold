import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import type { Tier } from './Tier';

@Entity('events')
export class Event {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  venue!: string;

  @Column({ type: 'timestamp with time zone' })
  starts_at!: Date;

  @OneToMany('Tier', 'event')
  tiers!: Tier[];
}
