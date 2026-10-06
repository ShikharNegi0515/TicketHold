import { NextResponse } from 'next/server';
import { initializeDB } from '@/db/dataSource';
import { Event } from '@/db/entities/Event';
import { Hold } from '@/db/entities/Hold';
import { Order } from '@/db/entities/Order';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ event_id: string }> }
) {
  try {
    const ds = await initializeDB();
    const { event_id } = await params;

    const event = await ds.getRepository(Event).findOne({
      where: { id: event_id },
      relations: { tiers: true },
    });

    if (!event) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
    }

    const tiersWithInventory = await Promise.all(event.tiers.map(async (tier) => {
      const activeHoldsCount = await ds.getRepository(Hold)
        .createQueryBuilder('hold')
        .select('SUM(hold.quantity)', 'sum')
        .where('hold.tier_id = :tierId AND hold.status = :status AND hold.expires_at > NOW()', { tierId: tier.id, status: 'active' })
        .getRawOne();
      
      const paidOrdersCount = await ds.getRepository(Order)
        .createQueryBuilder('order')
        .select('SUM(order.quantity)', 'sum')
        .where('order.tier_id = :tierId AND order.status = :status', { tierId: tier.id, status: 'paid' })
        .getRawOne();

      const holdQty = parseInt(activeHoldsCount?.sum || '0', 10);
      const paidQty = parseInt(paidOrdersCount?.sum || '0', 10);
      const available = tier.total_inventory - holdQty - paidQty;

      return {
        ...tier,
        available_inventory: available,
      };
    }));

    return NextResponse.json({
      ...event,
      tiers: tiersWithInventory,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
