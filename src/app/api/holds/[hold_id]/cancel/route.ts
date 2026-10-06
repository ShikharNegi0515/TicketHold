import { NextResponse } from 'next/server';
import { initializeDB } from '@/db/dataSource';
import { Hold } from '@/db/entities/Hold';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hold_id: string }> }
) {
  try {
    const ds = await initializeDB();
    const { hold_id } = await params;

    const hold = await ds.getRepository(Hold).findOne({ where: { id: hold_id } });
    if (!hold) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Hold not found' } }, { status: 404 });
    }

    if (hold.status !== 'active') {
      return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Hold is not active' } }, { status: 400 });
    }

    hold.status = 'expired';
    await ds.getRepository(Hold).save(hold);

    return NextResponse.json({ success: true, hold });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
