import { NextResponse } from 'next/server';
import { initializeDB } from '@/db/dataSource';
import { Event } from '@/db/entities/Event';
import { Tier } from '@/db/entities/Tier';

const mockData = {
  "events": [
    {
      "id": "evt_001",
      "title": "Anoushka Shankar — Live in Lisbon",
      "venue": "Coliseu dos Recreios, Lisboa",
      "starts_at": "2026-11-14T20:00:00Z",
      "tiers": [
        { "id": "tier_001_a", "name": "Front Stalls", "price": 8500, "currency": "EUR", "total_inventory": 50 },
        { "id": "tier_001_b", "name": "General Standing", "price": 4500, "currency": "EUR", "total_inventory": 200 },
        { "id": "tier_001_c", "name": "Balcony", "price": 3000, "currency": "EUR", "total_inventory": 100 }
      ]
    },
    {
      "id": "evt_002",
      "title": "Indie Devs Meetup — Berlin",
      "venue": "Festsaal Kreuzberg, Berlin",
      "starts_at": "2026-08-22T19:30:00Z",
      "tiers": [
        { "id": "tier_002_a", "name": "Standard", "price": 1500, "currency": "EUR", "total_inventory": 80 },
        { "id": "tier_002_b", "name": "Student", "price": 800, "currency": "EUR", "total_inventory": 20 }
      ]
    }
  ]
};

export async function GET() {
  try {
    const ds = await initializeDB();
    for (const eventData of mockData.events) {
      let event = await ds.getRepository(Event).findOne({ where: { id: eventData.id } });
      if (!event) {
        event = ds.getRepository(Event).create({
          id: eventData.id,
          title: eventData.title,
          venue: eventData.venue,
          starts_at: new Date(eventData.starts_at),
        });
        await ds.getRepository(Event).save(event);
      }
      for (const tierData of eventData.tiers) {
        let tier = await ds.getRepository(Tier).findOne({ where: { id: tierData.id } });
        if (!tier) {
          tier = ds.getRepository(Tier).create({
            id: tierData.id,
            event_id: event.id,
            name: tierData.name,
            price: tierData.price,
            currency: tierData.currency,
            total_inventory: tierData.total_inventory,
          });
          await ds.getRepository(Tier).save(tier);
        }
      }
    }
    return NextResponse.json({ success: true, message: 'Seeded successfully' });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to seed', detail: message }, { status: 500 });
  }
}
