import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tier } from './Tier';

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar' })
  id!: string;

  @Column({ type: 'varchar' })
  tier_id!: string;

  @Column('int')
  quantity!: number;

  @Column({ type: 'enum', enum: ['paid', 'refunded', 'partially_refunded'] })
  status!: 'paid' | 'refunded' | 'partially_refunded';

  @ManyToOne(() => Tier, tier => tier.orders)
  @JoinColumn({ name: 'tier_id' })
  tier!: Tier;
}
