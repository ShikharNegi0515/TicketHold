#!/bin/bash
set -e

BASE_URL="http://localhost:3000/api"
echo "======================================"
echo "1. Seeding DB"
curl -s "$BASE_URL/seed" | jq .

echo ""
echo "======================================"
echo "2. Checking Inventory for evt_001"
curl -s "$BASE_URL/events/evt_001" | jq .

echo ""
echo "======================================"
echo "3. Creating a hold for tier_001_a (Qty: 2)"
HOLD_RES=$(curl -s -X POST "$BASE_URL/events/evt_001/holds" \
  -H "Content-Type: application/json" \
  -d '{"tier_id": "tier_001_a", "quantity": 2}')
echo "$HOLD_RES" | jq .
HOLD_ID=$(echo "$HOLD_RES" | jq -r .id)

echo ""
echo "======================================"
echo "4. Canceling the hold (id: $HOLD_ID)"
curl -s -X POST "$BASE_URL/holds/$HOLD_ID/cancel" | jq .

echo ""
echo "======================================"
echo "5. Creating a new hold to pay for"
HOLD_RES_2=$(curl -s -X POST "$BASE_URL/events/evt_001/holds" \
  -H "Content-Type: application/json" \
  -d '{"tier_id": "tier_001_a", "quantity": 1}')
echo "$HOLD_RES_2" | jq .

echo ""
echo "======================================"
echo "6. Sending Webhook to pay for the order"
curl -s -X POST "$BASE_URL/webhooks/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "webhook_evt_'$(date +%s)'",
    "type": "order.paid",
    "order_id": "order_test_'$(date +%s)'",
    "tier_id": "tier_001_a",
    "quantity": 1,
    "amount_total": 8500,
    "currency": "EUR",
    "occurred_at": "'$(date --iso-8601=seconds -u)'"
  }' | jq .

echo ""
echo "======================================"
echo "7. Sending duplicate webhook (idempotency test)"
DUP_EVENT_ID="webhook_dup_test_123"
curl -s -X POST "$BASE_URL/webhooks/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "'$DUP_EVENT_ID'",
    "type": "order.paid",
    "order_id": "order_dup_123",
    "tier_id": "tier_001_a",
    "quantity": 1,
    "amount_total": 8500,
    "currency": "EUR",
    "occurred_at": "'$(date --iso-8601=seconds -u)'"
  }' > /dev/null

curl -s -X POST "$BASE_URL/webhooks/payments" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "'$DUP_EVENT_ID'",
    "type": "order.paid",
    "order_id": "order_dup_123",
    "tier_id": "tier_001_a",
    "quantity": 1,
    "amount_total": 8500,
    "currency": "EUR",
    "occurred_at": "'$(date --iso-8601=seconds -u)'"
  }' | jq .

echo ""
echo "======================================"
echo "8. Race condition check (evt_002 tier_002_b total_inventory is 20, let's request 20 twice)"
# Run concurrently
curl -s -X POST "$BASE_URL/events/evt_002/holds" \
  -H "Content-Type: application/json" \
  -d '{"tier_id": "tier_002_b", "quantity": 20}' &
PID1=$!

curl -s -X POST "$BASE_URL/events/evt_002/holds" \
  -H "Content-Type: application/json" \
  -d '{"tier_id": "tier_002_b", "quantity": 20}' &
PID2=$!

wait $PID1
wait $PID2
echo "(Note: One should succeed, one should fail with 409 OVERSOLD)"

