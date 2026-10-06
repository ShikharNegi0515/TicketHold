import { NextResponse } from 'next/server';
import { initializeDB } from '@/db/dataSource';
import { Tier } from '@/db/entities/Tier';
import { Hold } from '@/db/entities/Hold';
import { Order } from '@/db/entities/Order';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ event_id: string }> }
) {
  try {
    const ds = await initializeDB();
    const { event_id } = await params;
    const body = await request.json();
    const { tier_id, quantity } = body;

    if (!tier_id || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid payload' } }, { status: 400 });
    }

    const result = await ds.transaction(async (manager) => {
      // 1. Lock the tier row so concurrent holds serialize here
      const tier = await manager.createQueryBuilder(Tier, 'tier')
        .where('tier.id = :tierId AND tier.event_id = :eventId', { tierId: tier_id, eventId: event_id })
        .setLock('pessimistic_write') // SELECT FOR UPDATE
        .getOne();

      if (!tier) {
        throw new Error('NOT_FOUND');
      }

      // 2. Calculate available inventory
      const activeHoldsCount = await manager.createQueryBuilder(Hold, 'hold')
        .select('SUM(hold.quantity)', 'sum')
        .where('hold.tier_id = :tierId AND hold.status = :status AND hold.expires_at > NOW()', { tierId: tier_id, status: 'active' })
        .getRawOne();
      
      const paidOrdersCount = await manager.createQueryBuilder(Order, 'order')
        .select('SUM(order.quantity)', 'sum')
        .where('order.tier_id = :tierId AND order.status = :status', { tierId: tier_id, status: 'paid' })
        .getRawOne();

      const holdQty = parseInt(activeHoldsCount?.sum || '0', 10);
      const paidQty = parseInt(paidOrdersCount?.sum || '0', 10);
      const available = tier.total_inventory - holdQty - paidQty;

      if (available < quantity) {
        throw new Error('OVERSOLD');
      }

      // 3. Create hold
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      const hold = manager.create(Hold, {
        tier_id,
        quantity,
        expires_at: expiresAt,
        status: 'active'
      });

      await manager.save(hold);
      return hold;
    });

    return NextResponse.json({ id: result.id, expires_at: result.expires_at });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Tier not found' } }, { status: 404 });
    }
    if (error.message === 'OVERSOLD') {
      return NextResponse.json({ error: { code: 'OVERSOLD', message: 'Not enough available inventory' } }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
