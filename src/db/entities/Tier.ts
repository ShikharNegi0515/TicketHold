import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Event } from './Event';
import { Hold } from './Hold';
import { Order } from './Order';

@Entity('tiers')
export class Tier {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  event_id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column('int')
  price!: number; // minor units

  @Column({ type: 'varchar' })
  currency!: string;

  @Column('int')
  total_inventory!: number;

  @ManyToOne(() => Event, event => event.tiers)
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @OneToMany(() => Hold, hold => hold.tier)
  holds!: Hold[];

  @OneToMany(() => Order, order => order.tier)
  orders!: Order[];
}
