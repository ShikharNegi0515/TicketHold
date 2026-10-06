import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Tier } from './Tier';

@Entity('events')
export class Event {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  venue!: string;

  @Column({ type: 'timestamp' })
  starts_at!: Date;

  @OneToMany(() => Tier, tier => tier.event)
  tiers!: Tier[];
}
