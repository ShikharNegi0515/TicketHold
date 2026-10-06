import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryColumn({ type: 'varchar' })
  id!: string; // The idempotency key from webhook

  @Column({ type: 'varchar' })
  event_type!: string;

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  processed_at!: Date;
}
