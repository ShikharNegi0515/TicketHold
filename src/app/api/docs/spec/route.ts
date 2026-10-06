import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Encore Tickets — Inventory API',
    version: '1.0.0',
    description: `
Real-time ticket inventory API for Encore Tickets.

Handles event querying, hold reservations with safe concurrency (SELECT FOR UPDATE), 
idempotent webhook processing, and automatic hold expiry.

## Key Design Decisions
- **No Overselling**: Concurrent hold requests are serialized using \`SELECT ... FOR UPDATE\` on the Tier row inside a transaction.
- **Idempotency**: Webhooks are deduplicated using the \`event_id\` field as a primary key in the \`webhook_events\` table.
- **Hold Expiry**: Holds expire organically — inventory queries always filter \`expires_at > NOW()\`, so no cron job is needed.
- **Out-of-Order Webhooks**: A refund webhook arriving before its corresponding payment is stored as \`refunded\` status; when the paid webhook arrives later, inventory is correctly managed.
    `,
    contact: {
      name: 'Shikhar Negi',
      url: 'https://github.com/ShikharNegi0515/TicketHold',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Local Development' },
  ],
  tags: [
    { name: 'Events', description: 'Query events and their available inventory' },
    { name: 'Holds', description: 'Create and manage ticket holds (10-minute TTL)' },
    { name: 'Webhooks', description: 'Receive payment processor events (idempotent)' },
    { name: 'Admin', description: 'Utility endpoints for testing and seeding' },
  ],
  paths: {
    '/api/events/{event_id}': {
      get: {
        tags: ['Events'],
        summary: 'Get event with live inventory',
        description: 'Returns the event details with all tiers. Each tier includes `available_inventory` computed as `total_inventory − active_holds − paid_orders`.',
        parameters: [
          {
            name: 'event_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'evt_001' },
            description: 'The event ID',
          },
        ],
        responses: {
          200: {
            description: 'Event with tiers and live available inventory',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EventWithInventory' },
                example: {
                  id: 'evt_001',
                  title: 'Anoushka Shankar — Live in Lisbon',
                  venue: 'Coliseu dos Recreios, Lisboa',
                  starts_at: '2026-11-14T20:00:00.000Z',
                  tiers: [
                    {
                      id: 'tier_001_a',
                      name: 'Front Stalls',
                      price: 8500,
                      currency: 'EUR',
                      total_inventory: 50,
                      available_inventory: 48,
                    },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/events/{event_id}/holds': {
      post: {
        tags: ['Holds'],
        summary: 'Create a hold (reserve tickets)',
        description: `
Creates a hold for the requested quantity of tickets on the given tier.

**Concurrency Safety**: Uses \`SELECT ... FOR UPDATE\` on the Tier row inside a transaction to serialize concurrent requests. If two requests race for the last ticket, exactly one succeeds and the other receives \`409 OVERSOLD\`.

The hold automatically expires after **10 minutes** if not converted by a payment webhook.
        `,
        parameters: [
          {
            name: 'event_id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'evt_001' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateHoldRequest' },
              example: { tier_id: 'tier_001_a', quantity: 2 },
            },
          },
        },
        responses: {
          200: {
            description: 'Hold created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HoldResponse' },
                example: {
                  id: '7f34be6c-e6ef-4d6f-8766-fd53e845fd5f',
                  expires_at: '2026-10-07T04:32:10.787Z',
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          409: {
            description: 'Not enough inventory — OVERSOLD',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  error: {
                    code: 'OVERSOLD',
                    message: 'Not enough available inventory',
                  },
                },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/holds/{hold_id}/cancel': {
      post: {
        tags: ['Holds'],
        summary: 'Cancel an active hold',
        description: 'Immediately expires a hold and returns the tickets to available inventory. Convenience endpoint for testing — saves waiting 10 minutes for natural expiry.',
        parameters: [
          {
            name: 'hold_id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid', example: '7f34be6c-e6ef-4d6f-8766-fd53e845fd5f' },
          },
        ],
        responses: {
          200: {
            description: 'Hold cancelled successfully',
            content: {
              'application/json': {
                example: { success: true },
              },
            },
          },
          400: {
            description: 'Hold is not active (already expired or converted)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { error: { code: 'INVALID_STATE', message: 'Hold is not active' } },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/webhooks/payments': {
      post: {
        tags: ['Webhooks'],
        summary: 'Receive payment processor webhook',
        description: `
Handles \`order.paid\` and \`order.refunded\` events from the mock payment processor.

**Idempotency**: The \`event_id\` field is the idempotency key. Receiving the same webhook twice produces the same end state — the second call returns \`{"alreadyProcessed": true}\`.

**Out-of-Order Delivery**: A \`order.refunded\` webhook may arrive before its \`order.paid\`. The system handles this gracefully by recording the refund first and correctly reconciling when the paid event arrives.
        `,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WebhookPayload' },
              examples: {
                'order.paid': {
                  summary: 'Payment succeeded',
                  value: {
                    event_id: 'evt_wh_001',
                    type: 'order.paid',
                    order_id: 'ord_001',
                    tier_id: 'tier_001_a',
                    quantity: 2,
                    amount_total: 17000,
                    currency: 'EUR',
                    occurred_at: '2026-10-07T04:20:00Z',
                  },
                },
                'order.refunded': {
                  summary: 'Refund issued',
                  value: {
                    event_id: 'evt_wh_002',
                    type: 'order.refunded',
                    order_id: 'ord_001',
                    amount_refunded: 17000,
                    currency: 'EUR',
                    occurred_at: '2026-10-07T05:00:00Z',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Webhook processed successfully',
            content: {
              'application/json': {
                examples: {
                  processed: { summary: 'First delivery', value: { success: true } },
                  duplicate: { summary: 'Duplicate delivery (idempotent)', value: { alreadyProcessed: true } },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/api/seed': {
      get: {
        tags: ['Admin'],
        summary: 'Seed the database',
        description: 'Inserts the two mock events (evt_001, evt_002) and all 5 tiers into the database. Safe to call multiple times — skips existing records.',
        responses: {
          200: {
            description: 'Seeded successfully',
            content: {
              'application/json': {
                example: { success: true, message: 'Seeded successfully' },
              },
            },
          },
          500: { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
  components: {
    schemas: {
      Tier: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'tier_001_a' },
          event_id: { type: 'string', example: 'evt_001' },
          name: { type: 'string', example: 'Front Stalls' },
          price: { type: 'integer', description: 'Price in minor units (cents)', example: 8500 },
          currency: { type: 'string', example: 'EUR' },
          total_inventory: { type: 'integer', example: 50 },
        },
      },
      TierWithInventory: {
        allOf: [
          { $ref: '#/components/schemas/Tier' },
          {
            type: 'object',
            properties: {
              available_inventory: {
                type: 'integer',
                description: 'total_inventory − active_holds − paid_orders',
                example: 48,
              },
            },
          },
        ],
      },
      EventWithInventory: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'evt_001' },
          title: { type: 'string', example: 'Anoushka Shankar — Live in Lisbon' },
          venue: { type: 'string', example: 'Coliseu dos Recreios, Lisboa' },
          starts_at: { type: 'string', format: 'date-time', example: '2026-11-14T20:00:00.000Z' },
          tiers: { type: 'array', items: { $ref: '#/components/schemas/TierWithInventory' } },
        },
      },
      CreateHoldRequest: {
        type: 'object',
        required: ['tier_id', 'quantity'],
        properties: {
          tier_id: { type: 'string', example: 'tier_001_a' },
          quantity: { type: 'integer', minimum: 1, example: 2 },
        },
      },
      HoldResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '7f34be6c-e6ef-4d6f-8766-fd53e845fd5f' },
          expires_at: { type: 'string', format: 'date-time', example: '2026-10-07T04:32:10.787Z', description: '10 minutes from creation time' },
        },
      },
      WebhookPayload: {
        type: 'object',
        required: ['event_id', 'type', 'order_id'],
        properties: {
          event_id: { type: 'string', description: 'Idempotency key', example: 'evt_wh_001' },
          type: { type: 'string', enum: ['order.paid', 'order.refunded'], example: 'order.paid' },
          order_id: { type: 'string', example: 'ord_001' },
          tier_id: { type: 'string', description: 'Required for order.paid', example: 'tier_001_a' },
          quantity: { type: 'integer', description: 'Required for order.paid', example: 2 },
          amount_total: { type: 'integer', description: 'Total in minor units (order.paid)', example: 17000 },
          amount_refunded: { type: 'integer', description: 'Refunded amount in minor units (order.refunded)', example: 17000 },
          currency: { type: 'string', example: 'EUR' },
          occurred_at: { type: 'string', format: 'date-time', example: '2026-10-07T04:20:00Z' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'OVERSOLD' },
              message: { type: 'string', example: 'Not enough available inventory' },
            },
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Invalid request payload',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { error: { code: 'BAD_REQUEST', message: 'Invalid payload' } },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { error: { code: 'NOT_FOUND', message: 'Event not found' } },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
