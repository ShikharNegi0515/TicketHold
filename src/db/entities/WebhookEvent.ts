import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryColumn({ type: 'varchar' })
  id!: string; // The idempotency key from the webhook payload

  @Column({ type: 'varchar' })
  event_type!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  processed_at!: Date;
}
