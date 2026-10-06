import { NextResponse } from 'next/server';
import { initializeDB } from '@/db/dataSource';
import { WebhookEvent } from '@/db/entities/WebhookEvent';
import { Order } from '@/db/entities/Order';
import { Hold } from '@/db/entities/Hold';

export async function POST(request: Request) {
  try {
    const ds = await initializeDB();
    const payload = await request.json();

    const { event_id: webhook_event_id, type, order_id, tier_id, quantity } = payload;

    if (!webhook_event_id || !type || !order_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await ds.transaction(async (manager) => {
      // 1. Idempotency check with pg advisory lock or by inserting into webhook_events
      // Using an insert with conflict ignore or checking first.
      const existingEvent = await manager.findOne(WebhookEvent, {
        where: { id: webhook_event_id },
        lock: { mode: 'pessimistic_write' }
      });

      if (existingEvent) {
        return { alreadyProcessed: true };
      }

      // Record the webhook event
      const whEvent = manager.create(WebhookEvent, {
        id: webhook_event_id,
        event_type: type,
        payload,
      });
      await manager.save(whEvent);

      // Lock the order to prevent race conditions on the same order
      let order = await manager.findOne(Order, {
        where: { id: order_id },
        lock: { mode: 'pessimistic_write' }
      });

      if (type === 'order.paid') {
        if (!order) {
          order = manager.create(Order, {
            id: order_id,
            tier_id,
            quantity,
            status: 'paid',
          });
          await manager.save(order);
        } else if (order.status === 'refunded') {
          // It was refunded before it was paid! Out-of-order.
          // Keep it refunded, or maybe partially refunded.
          // For simplicity, if it's already refunded, we just leave it refunded.
          // We might want to ensure the tier_id and quantity are set if they were missing.
          if (!order.tier_id && tier_id) {
            order.tier_id = tier_id;
            order.quantity = quantity;
            await manager.save(order);
          }
        }

        // Convert hold to sold to release the hold inventory.
        // We find the oldest active hold for this tier and mark it converted.
        // In a real system, the order_id would be tied to the hold_id.
        const holds = await manager.createQueryBuilder(Hold, 'hold')
          .where('hold.tier_id = :tierId AND hold.status = :status', { tierId: tier_id, status: 'active' })
          .orderBy('hold.expires_at', 'ASC')
          .setLock('pessimistic_write')
          .getMany();
        
        let remainingToConvert = quantity;
        for (const hold of holds) {
          if (remainingToConvert <= 0) break;
          
          if (hold.quantity <= remainingToConvert) {
            hold.status = 'converted';
            remainingToConvert -= hold.quantity;
            await manager.save(hold);
          } else {
            // Split the hold
            hold.quantity -= remainingToConvert;
            await manager.save(hold);
            
            const convertedHold = manager.create(Hold, {
              tier_id: hold.tier_id,
              quantity: remainingToConvert,
              expires_at: hold.expires_at,
              status: 'converted'
            });
            await manager.save(convertedHold);
            remainingToConvert = 0;
          }
        }
      } else if (type === 'order.refunded') {
        if (!order) {
          // Out of order: refund arrived before paid.
          order = manager.create(Order, {
            id: order_id,
            tier_id: payload.tier_id || 'unknown', // We might not have this in refund payload
            quantity: payload.quantity || 0,
            status: 'refunded',
          });
          await manager.save(order);
        } else {
          order.status = 'refunded';
          await manager.save(order);
        }
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
