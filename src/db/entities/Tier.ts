import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import type { Hold } from './Hold';
import type { Order } from './Order';

@Entity('tiers')
export class Tier {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  event_id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'int' })
  price!: number; // minor units (cents)

  @Column({ type: 'varchar' })
  currency!: string;

  @Column({ type: 'int' })
  total_inventory!: number;

  @ManyToOne('Event', 'tiers')
  @JoinColumn({ name: 'event_id' })
  event!: unknown;

  @OneToMany('Hold', 'tier')
  holds!: Hold[];

  @OneToMany('Order', 'tier')
  orders!: Order[];
}
