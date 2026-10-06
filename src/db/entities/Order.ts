import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryColumn({ type: 'varchar' })
  id!: string; // External processor's order ID

  @Column({ type: 'varchar' })
  tier_id!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: ['paid', 'refunded', 'partially_refunded'],
  })
  status!: 'paid' | 'refunded' | 'partially_refunded';

  @ManyToOne('Tier', 'orders')
  @JoinColumn({ name: 'tier_id' })
  tier!: unknown;
}
