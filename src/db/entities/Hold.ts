import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('holds')
export class Hold {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  tier_id!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'timestamp with time zone' })
  expires_at!: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'converted'],
    default: 'active',
  })
  status!: 'active' | 'expired' | 'converted';

  @ManyToOne('Tier', 'holds')
  @JoinColumn({ name: 'tier_id' })
  tier!: unknown;
}
