import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tier } from './Tier';

@Entity('holds')
export class Hold {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  tier_id!: string;

  @Column('int')
  quantity!: number;

  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ type: 'enum', enum: ['active', 'expired', 'converted'], default: 'active' })
  status!: 'active' | 'expired' | 'converted';

  @ManyToOne(() => Tier, tier => tier.holds)
  @JoinColumn({ name: 'tier_id' })
  tier!: Tier;
}
