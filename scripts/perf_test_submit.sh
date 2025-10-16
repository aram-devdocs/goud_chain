#!/bin/bash
# Performance test for data submission endpoint
# Tests block creation speed from API to storage

set -e

NODE_URL="${NODE_URL:-http://localhost:8080}"
ITERATIONS="${ITERATIONS:-10}"

echo "=== Block Creation Performance Test ==="
echo "Node: $NODE_URL"
echo "Iterations: $ITERATIONS"
echo ""

# Create test account
echo "[1/3] Creating test account..."
RESPONSE=$(curl -s -X POST "$NODE_URL/account/create" \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"test": "perf_test"}}')

API_KEY=$(echo "$RESPONSE" | grep -o '"api_key":"[^"]*"' | cut -d'"' -f4)

if [ -z "$API_KEY" ]; then
  echo "Failed to create account"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "Account created: ${API_KEY:0:20}..."
echo ""

# Warm up (populate key cache)
echo "[2/3] Warming up (populating key cache)..."
for i in {1..3}; do
  curl -s -X POST "$NODE_URL/data/submit" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"label": "warmup", "data": "test"}' > /dev/null
  sleep 0.5
done
echo "Warmup complete"
echo ""

# Performance test
echo "[3/3] Running performance test..."
echo "Submitting $ITERATIONS data items..."
echo ""

TOTAL_TIME=0
MIN_TIME=999999
MAX_TIME=0

for i in $(seq 1 $ITERATIONS); do
  START=$(date +%s%3N)

  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}\n" \
    -X POST "$NODE_URL/data/submit" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"label\": \"perf_test_$i\", \"data\": \"Lorem ipsum dolor sit amet, consectetur adipiscing elit. $(date)\"}")

  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
  TIME_TOTAL=$(echo "$RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)

  END=$(date +%s%3N)
  DURATION=$((END - START))

  if [ "$HTTP_CODE" != "200" ]; then
    echo "Request $i failed with HTTP $HTTP_CODE"
    continue
  fi

  # Convert to milliseconds (curl reports in seconds)
  TIME_MS=$(echo "$TIME_TOTAL * 1000" | bc)
  TIME_MS_INT=$(printf "%.0f" "$TIME_MS")

  TOTAL_TIME=$((TOTAL_TIME + TIME_MS_INT))

  if [ $TIME_MS_INT -lt $MIN_TIME ]; then
    MIN_TIME=$TIME_MS_INT
  fi

  if [ $TIME_MS_INT -gt $MAX_TIME ]; then
    MAX_TIME=$TIME_MS_INT
  fi

  echo "[$i/$ITERATIONS] Block created in ${TIME_MS_INT}ms"
done

echo ""
echo "=== Performance Summary ==="
AVG_TIME=$((TOTAL_TIME / ITERATIONS))
echo "Requests: $ITERATIONS"
echo "Total time: ${TOTAL_TIME}ms"
echo "Average: ${AVG_TIME}ms per block"
echo "Min: ${MIN_TIME}ms"
echo "Max: ${MAX_TIME}ms"
echo ""

# Performance rating
if [ $AVG_TIME -lt 50 ]; then
  echo "⚡ EXCELLENT: <50ms (optimized for free-tier)"
elif [ $AVG_TIME -lt 100 ]; then
  echo "✅ GOOD: <100ms (acceptable for free-tier)"
elif [ $AVG_TIME -lt 200 ]; then
  echo "⚠️  FAIR: <200ms (may need optimization)"
else
  echo "❌ SLOW: >${AVG_TIME}ms (needs optimization)"
fi
